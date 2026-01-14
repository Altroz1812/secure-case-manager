import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate, Enums } from '@/integrations/supabase/types';

type Task = Tables<'tasks'>;
type TaskInsert = TablesInsert<'tasks'>;
type TaskUpdate = TablesUpdate<'tasks'>;
type TaskStatus = Enums<'task_status'>;

export interface TaskWithDetails extends Task {
  lead: {
    lead_number: string;
    applicant_name: string;
    address: string | null;
    pincode: string | null;
    client: { code: string; name: string } | null;
    product: { code: string; name: string } | null;
  } | null;
  branch: { code: string; name: string } | null;
  assigned_user: { full_name: string; email: string } | null;
  field_executive: { employee_code: string } | null;
}

export function useTasks(filters?: { 
  status?: TaskStatus; 
  branchId?: string; 
  assignedTo?: string;
  isOverdue?: boolean;
}) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      let query = supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.branchId) {
        query = query.eq('branch_id', filters.branchId);
      }
      if (filters?.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo);
      }
      if (filters?.isOverdue !== undefined) {
        query = query.eq('is_overdue', filters.isOverdue);
      }

      const { data: tasks, error: tasksError } = await query;
      if (tasksError) throw tasksError;

      if (!tasks || tasks.length === 0) return [];

      // Fetch related data
      const leadIds = [...new Set(tasks.map(t => t.lead_id))];
      const branchIds = [...new Set(tasks.map(t => t.branch_id))];
      const assignedUserIds = [...new Set(tasks.filter(t => t.assigned_to).map(t => t.assigned_to!))];

      const [leadsResult, branchesResult, profilesResult, fesResult] = await Promise.all([
        supabase.from('leads').select(`
          id, lead_number, applicant_name, address, pincode,
          client:clients(code, name),
          product:products(code, name)
        `).in('id', leadIds),
        supabase.from('branches').select('id, code, name').in('id', branchIds),
        assignedUserIds.length > 0 
          ? supabase.from('profiles').select('user_id, full_name, email').in('user_id', assignedUserIds)
          : { data: [] },
        assignedUserIds.length > 0
          ? supabase.from('field_executives').select('user_id, employee_code').in('user_id', assignedUserIds)
          : { data: [] },
      ]);

      const leadsMap = new Map((leadsResult.data || []).map(l => [l.id, l]));
      const branchesMap = new Map((branchesResult.data || []).map(b => [b.id, b]));
      const profilesMap = new Map((profilesResult.data || []).map(p => [p.user_id, p]));
      const fesMap = new Map((fesResult.data || []).map(fe => [fe.user_id, fe]));

      return tasks.map(task => ({
        ...task,
        lead: leadsMap.get(task.lead_id) || null,
        branch: branchesMap.get(task.branch_id) || null,
        assigned_user: task.assigned_to ? profilesMap.get(task.assigned_to) || null : null,
        field_executive: task.assigned_to ? fesMap.get(task.assigned_to) || null : null,
      })) as TaskWithDetails[];
    },
  });
}

export function useTask(id: string | undefined) {
  return useQuery({
    queryKey: ['tasks', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (taskError) throw taskError;
      if (!task) return null;

      // Fetch related data
      const [leadResult, branchResult, profileResult, feResult] = await Promise.all([
        supabase.from('leads').select(`
          id, lead_number, applicant_name, address, pincode,
          client:clients(code, name),
          product:products(code, name)
        `).eq('id', task.lead_id).maybeSingle(),
        supabase.from('branches').select('id, code, name').eq('id', task.branch_id).maybeSingle(),
        task.assigned_to 
          ? supabase.from('profiles').select('user_id, full_name, email').eq('user_id', task.assigned_to).maybeSingle()
          : { data: null },
        task.assigned_to
          ? supabase.from('field_executives').select('user_id, employee_code').eq('user_id', task.assigned_to).maybeSingle()
          : { data: null },
      ]);

      return {
        ...task,
        lead: leadResult.data || null,
        branch: branchResult.data || null,
        assigned_user: profileResult.data || null,
        field_executive: feResult.data || null,
      } as TaskWithDetails;
    },
    enabled: !!id,
  });
}

export function useMyTasks() {
  return useQuery({
    queryKey: ['my-tasks'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', user.id)
        .order('sla_deadline', { ascending: true });

      if (error) throw error;
      if (!tasks || tasks.length === 0) return [];

      // Fetch leads for these tasks
      const leadIds = [...new Set(tasks.map(t => t.lead_id))];
      const { data: leads } = await supabase
        .from('leads')
        .select(`id, lead_number, applicant_name, address, pincode, client:clients(code, name), product:products(code, name)`)
        .in('id', leadIds);

      const leadsMap = new Map((leads || []).map(l => [l.id, l]));

      return tasks.map(task => ({
        ...task,
        lead: leadsMap.get(task.lead_id) || null,
        branch: null,
        assigned_user: null,
        field_executive: null,
      })) as TaskWithDetails[];
    },
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      taskId, 
      status, 
      finalRemarks 
    }: { 
      taskId: string; 
      status: TaskStatus; 
      finalRemarks?: string;
    }) => {
      const updates: TaskUpdate = { status };
      
      if (status === 'completed' || status === 'rejected') {
        updates.completed_at = new Date().toISOString();
      }
      if (finalRemarks) {
        updates.final_remarks = finalRemarks;
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      toast.success('Task status updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to update task status', { description: error.message });
    },
  });
}

export function useAssignTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      taskId, 
      assignedTo,
      assignedBy,
      reason,
      isOverride,
      previousAssignee
    }: { 
      taskId: string; 
      assignedTo: string;
      assignedBy: string;
      reason?: string;
      isOverride?: boolean;
      previousAssignee?: string;
    }) => {
      // Update the task
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ 
          assigned_to: assignedTo,
          assigned_at: new Date().toISOString(),
          status: 'assigned'
        })
        .eq('id', taskId);

      if (taskError) throw taskError;

      // Create assignment record
      const { error: assignmentError } = await supabase
        .from('task_assignments')
        .insert({
          task_id: taskId,
          assigned_to: assignedTo,
          assigned_by: assignedBy,
          assigned_from: previousAssignee || null,
          reason: reason || null,
          is_override: isOverride || false,
        });

      if (assignmentError) throw assignmentError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['field-executives'] });
      toast.success('Task assigned successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to assign task', { description: error.message });
    },
  });
}

export function useQCReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      taskId, 
      status, 
      qcRemarks,
      reviewedBy
    }: { 
      taskId: string; 
      status: 'approved' | 'rejected';
      qcRemarks: string;
      reviewedBy: string;
    }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({ 
          status,
          qc_remarks: qcRemarks,
          qc_reviewed_by: reviewedBy,
          qc_reviewed_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('QC review submitted');
    },
    onError: (error: Error) => {
      toast.error('Failed to submit review', { description: error.message });
    },
  });
}
