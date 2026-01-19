import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Email = Tables<'emails'>;
type EmailInsert = TablesInsert<'emails'>;
type EmailUpdate = TablesUpdate<'emails'>;
type EmailAttachment = Tables<'email_attachments'>;

export interface EmailWithAttachments extends Email {
  attachments: EmailAttachment[];
}

export function useEmails(filter?: { processed?: boolean; branchId?: string }) {
  return useQuery({
    queryKey: ['emails', filter],
    queryFn: async () => {
      let query = supabase
        .from('emails')
        .select('*, email_attachments(*)')
        .order('received_at', { ascending: false });
      
      if (filter?.processed !== undefined) {
        query = query.eq('is_processed', filter.processed);
      }

      if (filter?.branchId) {
        query = query.eq('branch_id', filter.branchId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return (data || []).map(email => ({
        ...email,
        attachments: email.email_attachments || [],
      })) as EmailWithAttachments[];
    },
  });
}

export function useEmail(id: string | undefined) {
  return useQuery({
    queryKey: ['emails', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('emails')
        .select('*, email_attachments(*)')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return null;
      
      return {
        ...data,
        attachments: data.email_attachments || [],
      } as EmailWithAttachments;
    },
    enabled: !!id,
  });
}

export function useCreateEmail() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (email: EmailInsert) => {
      const { data, error } = await supabase
        .from('emails')
        .insert(email)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      toast.success('Email created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create email', { description: error.message });
    },
  });
}

export function useMarkEmailProcessed() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, processedBy }: { id: string; processedBy: string }) => {
      const { data, error } = await supabase
        .from('emails')
        .update({
          is_processed: true,
          processed_at: new Date().toISOString(),
          processed_by: processedBy,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      toast.success('Email marked as processed');
    },
    onError: (error: Error) => {
      toast.error('Failed to update email', { description: error.message });
    },
  });
}

export function useAssignEmailBranch() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, branchId }: { id: string; branchId: string }) => {
      const { data, error } = await supabase
        .from('emails')
        .update({ branch_id: branchId })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      toast.success('Branch assigned to email');
    },
    onError: (error: Error) => {
      toast.error('Failed to assign branch', { description: error.message });
    },
  });
}
