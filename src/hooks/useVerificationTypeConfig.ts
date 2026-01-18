import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate, Enums } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

export type VerificationTypeConfig = Tables<'verification_type_config'>;
export type VerificationTypeConfigInsert = TablesInsert<'verification_type_config'>;
export type VerificationTypeConfigUpdate = TablesUpdate<'verification_type_config'>;
export type VerificationType = Enums<'verification_type'>;

export const VERIFICATION_TYPE_LABELS: Record<VerificationType, string> = {
  profile: 'Profile Verification',
  bgv: 'Background Verification',
  residential: 'Residential Verification',
  business: 'Business Verification',
  itr: 'ITR Verification',
  bank: 'Bank Verification',
  property: 'Property Verification',
  end_use: 'End Use Verification',
};

export function useVerificationTypeConfigs() {
  return useQuery({
    queryKey: ['verification-type-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('verification_type_config')
        .select('*')
        .order('type');
      
      if (error) throw error;
      return data as VerificationTypeConfig[];
    },
  });
}

export function useCreateVerificationTypeConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (config: VerificationTypeConfigInsert) => {
      const { data, error } = await supabase
        .from('verification_type_config')
        .insert(config)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verification-type-configs'] });
      toast({
        title: 'Configuration created',
        description: 'Verification type configuration has been created successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating configuration',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateVerificationTypeConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: VerificationTypeConfigUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('verification_type_config')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verification-type-configs'] });
      toast({
        title: 'Configuration updated',
        description: 'Verification type configuration has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating configuration',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteVerificationTypeConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('verification_type_config')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verification-type-configs'] });
      toast({
        title: 'Configuration deleted',
        description: 'Verification type configuration has been deleted successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting configuration',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
