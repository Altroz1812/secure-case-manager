import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate, Database } from '@/integrations/supabase/types';

type Lead = Tables<'leads'>;
type LeadInsert = TablesInsert<'leads'>;
type LeadUpdate = TablesUpdate<'leads'>;
type VerificationType = Database['public']['Enums']['verification_type'];

export interface LeadWithDetails extends Lead {
  client?: { id: string; name: string; code: string } | null;
  branch?: { id: string; name: string; code: string } | null;
  product?: { id: string; name: string; code: string } | null;
  email?: { id: string; subject: string; sender_email: string } | null;
}

export function useLeads(filter?: { branchId?: string }) {
  return useQuery({
    queryKey: ['leads', filter],
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select(`
          *,
          clients:client_id(id, name, code),
          products:product_id(id, name, code),
          emails:email_id(id, subject, sender_email)
        `)
        .order('created_at', { ascending: false });
      
      if (filter?.branchId) {
        query = query.eq('branch_id', filter.branchId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;

      // Fetch branches separately to avoid relationship conflict
      const branchIds = [...new Set((data || []).map(l => l.branch_id).filter(Boolean))];
      const { data: branchesData } = await supabase
        .from('branches')
        .select('id, name, code')
        .in('id', branchIds);
      
      const branchMap = new Map((branchesData || []).map(b => [b.id, b]));
      
      return (data || []).map(lead => ({
        ...lead,
        client: lead.clients,
        branch: branchMap.get(lead.branch_id) || null,
        product: lead.products,
        email: lead.emails,
      })) as LeadWithDetails[];
    },
  });
}

export function useLead(id: string | undefined) {
  return useQuery({
    queryKey: ['leads', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          clients:client_id(id, name, code),
          products:product_id(id, name, code),
          emails:email_id(id, subject, sender_email)
        `)
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return null;

      // Fetch branch separately
      let branch = null;
      if (data.branch_id) {
        const { data: branchData } = await supabase
          .from('branches')
          .select('id, name, code')
          .eq('id', data.branch_id)
          .maybeSingle();
        branch = branchData;
      }
      
      return {
        ...data,
        client: data.clients,
        branch,
        product: data.products,
        email: data.emails,
      } as LeadWithDetails;
    },
    enabled: !!id,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (lead: Omit<LeadInsert, 'lead_number'> & { verification_types: VerificationType[] }) => {
      // Generate lead number
      const { data: leadNumberData, error: leadNumberError } = await supabase
        .rpc('generate_lead_number');
      
      if (leadNumberError) throw leadNumberError;
      
      const { data, error } = await supabase
        .from('leads')
        .insert({
          ...lead,
          lead_number: leadNumberData,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      toast.success(`Lead ${data.lead_number} created successfully`);
    },
    onError: (error: Error) => {
      toast.error('Failed to create lead', { description: error.message });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: LeadUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update lead', { description: error.message });
    },
  });
}

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
  });
}

export function useVerificationTypeConfig() {
  return useQuery({
    queryKey: ['verification_type_config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('verification_type_config')
        .select('*')
        .eq('is_active', true)
        .order('display_name');
      
      if (error) throw error;
      return data || [];
    },
  });
}
