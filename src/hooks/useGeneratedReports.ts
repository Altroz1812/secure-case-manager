import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface GeneratedReport {
  id: string;
  task_id: string | null;
  lead_id: string | null;
  report_type: 'task_verification' | 'lead_consolidated';
  version: number;
  report_data: Json;
  storage_path: string | null;
  generated_by: string;
  generated_at: string;
  created_at: string;
}

export interface ReportWithDetails extends GeneratedReport {
  task?: { task_number: string } | null;
  lead?: { lead_number: string; applicant_name: string } | null;
  generated_by_user?: { full_name: string } | null;
}

// Fetch reports for a specific task
export function useTaskReports(taskId: string | undefined) {
  return useQuery({
    queryKey: ['task-reports', taskId],
    queryFn: async () => {
      if (!taskId) return [];

      const { data, error } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('task_id', taskId)
        .order('version', { ascending: false });

      if (error) throw error;
      return data as GeneratedReport[];
    },
    enabled: !!taskId,
  });
}

// Fetch reports for a specific lead
export function useLeadReports(leadId: string | undefined) {
  return useQuery({
    queryKey: ['lead-reports', leadId],
    queryFn: async () => {
      if (!leadId) return [];

      const { data, error } = await supabase
        .from('generated_reports')
        .select('*')
        .eq('lead_id', leadId)
        .order('version', { ascending: false });

      if (error) throw error;
      return data as GeneratedReport[];
    },
    enabled: !!leadId,
  });
}

// Fetch all reports with filters
export function useAllReports(filters?: {
  reportType?: string;
  dateFrom?: Date;
  dateTo?: Date;
}) {
  return useQuery({
    queryKey: ['all-reports', filters],
    queryFn: async () => {
      let query = supabase
        .from('generated_reports')
        .select('*')
        .order('generated_at', { ascending: false })
        .limit(100);

      if (filters?.reportType) {
        query = query.eq('report_type', filters.reportType);
      }
      if (filters?.dateFrom) {
        query = query.gte('generated_at', filters.dateFrom.toISOString());
      }
      if (filters?.dateTo) {
        query = query.lte('generated_at', filters.dateTo.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch related data
      const taskIds = [...new Set(data.filter(r => r.task_id).map(r => r.task_id!))];
      const leadIds = [...new Set(data.filter(r => r.lead_id).map(r => r.lead_id!))];
      const userIds = [...new Set(data.map(r => r.generated_by))];

      const [tasksResult, leadsResult, usersResult] = await Promise.all([
        taskIds.length > 0
          ? supabase.from('tasks').select('id, task_number').in('id', taskIds)
          : { data: [] },
        leadIds.length > 0
          ? supabase.from('leads').select('id, lead_number, applicant_name').in('id', leadIds)
          : { data: [] },
        supabase.from('profiles').select('user_id, full_name').in('user_id', userIds),
      ]);

      const tasksMap = new Map((tasksResult.data || []).map(t => [t.id, t]));
      const leadsMap = new Map((leadsResult.data || []).map(l => [l.id, l]));
      const usersMap = new Map((usersResult.data || []).map(u => [u.user_id, u]));

      return data.map(report => ({
        ...report,
        task: report.task_id ? tasksMap.get(report.task_id) : null,
        lead: report.lead_id ? leadsMap.get(report.lead_id) : null,
        generated_by_user: usersMap.get(report.generated_by) || null,
      })) as ReportWithDetails[];
    },
  });
}

// Generate a new report
export function useGenerateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      leadId,
      reportType,
      reportData,
    }: {
      taskId?: string;
      leadId?: string;
      reportType: 'task_verification' | 'lead_consolidated';
      reportData: Record<string, unknown>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get next version number
      let version = 1;
      if (taskId) {
        const { data: existing } = await supabase
          .from('generated_reports')
          .select('version')
          .eq('task_id', taskId)
          .eq('report_type', reportType)
          .order('version', { ascending: false })
          .limit(1);
        if (existing && existing.length > 0) {
          version = existing[0].version + 1;
        }
      } else if (leadId) {
        const { data: existing } = await supabase
          .from('generated_reports')
          .select('version')
          .eq('lead_id', leadId)
          .eq('report_type', reportType)
          .order('version', { ascending: false })
          .limit(1);
        if (existing && existing.length > 0) {
          version = existing[0].version + 1;
        }
      }

      const { data, error } = await supabase
        .from('generated_reports')
        .insert([{
          task_id: taskId || null,
          lead_id: leadId || null,
          report_type: reportType,
          version,
          report_data: reportData as Json,
          generated_by: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-reports', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['lead-reports', variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ['all-reports'] });
      toast.success('Report generated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to generate report', { description: error.message });
    },
  });
}
