import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ClientPortalTask {
  id: string;
  task_number: string;
  verification_type: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  sla_deadline: string | null;
  is_overdue: boolean;
  lead: {
    id: string;
    lead_number: string;
    applicant_name: string;
    application_number: string | null;
    client: {
      id: string;
      name: string;
      code: string;
    };
  };
}

export interface ClientPortalStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  approvedTasks: number;
  rejectedTasks: number;
  overduePercentage: number;
}

export interface ClientDocument {
  id: string;
  lead_id: string;
  uploaded_by: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  storage_path: string;
  document_type: string | null;
  remarks: string | null;
  created_at: string;
}

export function useClientPortalTasks() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['client-portal-tasks', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('tasks')
        .select(`
          id,
          task_number,
          verification_type,
          status,
          created_at,
          completed_at,
          sla_deadline,
          is_overdue,
          lead:leads!inner(
            id,
            lead_number,
            applicant_name,
            application_number,
            client:clients!inner(
              id,
              name,
              code
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as ClientPortalTask[];
    },
    enabled: !!user,
  });
}

export function useClientPortalStats() {
  const { data: tasks, isLoading } = useClientPortalTasks();

  const stats: ClientPortalStats = {
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    approvedTasks: 0,
    rejectedTasks: 0,
    overduePercentage: 0,
  };

  if (tasks && tasks.length > 0) {
    stats.totalTasks = tasks.length;
    stats.completedTasks = tasks.filter(t => ['completed', 'approved', 'rejected'].includes(t.status)).length;
    stats.pendingTasks = tasks.filter(t => ['pending', 'assigned', 'in_progress', 'qc_review'].includes(t.status)).length;
    stats.approvedTasks = tasks.filter(t => t.status === 'approved').length;
    stats.rejectedTasks = tasks.filter(t => t.status === 'rejected').length;
    
    const overdueTasks = tasks.filter(t => t.is_overdue).length;
    stats.overduePercentage = stats.totalTasks > 0 ? Math.round((overdueTasks / stats.totalTasks) * 100) : 0;
  }

  return { stats, isLoading };
}

export function useClientPortalReports() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['client-portal-reports', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('generated_reports')
        .select(`
          id,
          report_type,
          version,
          generated_at,
          storage_path,
          lead:leads(
            id,
            lead_number,
            applicant_name,
            client:clients(
              id,
              name
            )
          ),
          task:tasks(
            id,
            task_number,
            verification_type
          )
        `)
        .order('generated_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useClientLeadDocuments(leadId: string | undefined) {
  return useQuery({
    queryKey: ['client-lead-documents', leadId],
    queryFn: async () => {
      if (!leadId) return [];

      const { data, error } = await supabase
        .from('client_documents')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ClientDocument[];
    },
    enabled: !!leadId,
  });
}

export function useUploadClientDocument() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      leadId,
      file,
      documentType,
      remarks,
    }: {
      leadId: string;
      file: File;
      documentType: string;
      remarks?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${leadId}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('client-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create record in client_documents table
      const { data, error } = await supabase
        .from('client_documents')
        .insert({
          lead_id: leadId,
          uploaded_by: user.id,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          storage_path: fileName,
          document_type: documentType,
          remarks: remarks || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-lead-documents', variables.leadId] });
    },
  });
}
