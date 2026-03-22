import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface CaseFieldData {
  id: string;
  task_id: string;
  field_data: Record<string, any>;
  form_type: string;
  submitted_at: string | null;
  submitted_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useCaseFieldData(taskId: string | undefined) {
  return useQuery({
    queryKey: ['case-field-data', taskId],
    queryFn: async () => {
      if (!taskId) return null;
      const { data, error } = await supabase
        .from('case_field_data')
        .select('*')
        .eq('task_id', taskId)
        .maybeSingle();
      if (error) throw error;
      return data as CaseFieldData | null;
    },
    enabled: !!taskId,
  });
}

export function useSaveCaseFieldData() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      taskId,
      fieldData,
      formType,
      isSubmit,
    }: {
      taskId: string;
      fieldData: Record<string, any>;
      formType: string;
      isSubmit?: boolean;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const payload: any = {
        task_id: taskId,
        field_data: fieldData,
        form_type: formType,
      };

      if (isSubmit) {
        payload.submitted_at = new Date().toISOString();
        payload.submitted_by = user.id;
      }

      const { data, error } = await supabase
        .from('case_field_data')
        .upsert(payload, { onConflict: 'task_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['case-field-data', variables.taskId] });
      if (variables.isSubmit) {
        toast.success('Verification form submitted');
      } else {
        toast.success('Form saved');
      }
    },
    onError: (error: Error) => {
      toast.error('Failed to save form', { description: error.message });
    },
  });
}
