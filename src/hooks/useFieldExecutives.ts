import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type FieldExecutive = Tables<'field_executives'>;
type FieldExecutiveInsert = TablesInsert<'field_executives'>;
type FieldExecutiveUpdate = TablesUpdate<'field_executives'>;

export interface FieldExecutiveWithProfile extends FieldExecutive {
  profile: {
    full_name: string;
    email: string;
    phone: string | null;
  } | null;
}

export function useFieldExecutives() {
  return useQuery({
    queryKey: ['field-executives'],
    queryFn: async () => {
      // Fetch field executives
      const { data: fes, error: feError } = await supabase
        .from('field_executives')
        .select('*')
        .order('employee_code');
      
      if (feError) throw feError;

      // Fetch profiles for these users
      const userIds = (fes || []).map(fe => fe.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, phone')
        .in('user_id', userIds);
      
      if (profilesError) throw profilesError;

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));
      
      return (fes || []).map(fe => ({
        ...fe,
        profile: profileMap.get(fe.user_id) || null,
      })) as FieldExecutiveWithProfile[];
    },
  });
}

export function useFieldExecutive(id: string | undefined) {
  return useQuery({
    queryKey: ['field-executives', id],
    queryFn: async () => {
      if (!id) return null;
      const { data: fe, error: feError } = await supabase
        .from('field_executives')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (feError) throw feError;
      if (!fe) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, phone')
        .eq('user_id', fe.user_id)
        .maybeSingle();
      
      return {
        ...fe,
        profile: profile || null,
      } as FieldExecutiveWithProfile;
    },
    enabled: !!id,
  });
}

export function useCreateFieldExecutive() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (fe: FieldExecutiveInsert) => {
      const { data, error } = await supabase
        .from('field_executives')
        .insert(fe)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-executives'] });
      toast.success('Field executive created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create field executive', { description: error.message });
    },
  });
}

export function useUpdateFieldExecutive() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: FieldExecutiveUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('field_executives')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-executives'] });
      toast.success('Field executive updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update field executive', { description: error.message });
    },
  });
}

export function useDeleteFieldExecutive() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('field_executives')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-executives'] });
      toast.success('Field executive deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete field executive', { description: error.message });
    },
  });
}
