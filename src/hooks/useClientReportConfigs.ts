import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface ClientReportConfig {
  id: string;
  client_id: string;
  report_type: 'verification_report' | 'consolidated_report' | 'mis_report';
  config_name: string;
  template_config: Json;
  header_config: Json;
  field_mappings: Json;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientReportConfigWithClient extends ClientReportConfig {
  client?: { name: string; code: string } | null;
}

// Fetch all report configs
export function useClientReportConfigs(clientId?: string) {
  return useQuery({
    queryKey: ['client-report-configs', clientId],
    queryFn: async () => {
      let query = supabase
        .from('client_report_configs')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (!data || data.length === 0) return [];

      // Fetch client names
      const clientIds = [...new Set(data.map(c => c.client_id))];
      const { data: clients } = await supabase
        .from('clients')
        .select('id, name, code')
        .in('id', clientIds);

      const clientsMap = new Map((clients || []).map(c => [c.id, c]));

      return data.map(config => ({
        ...config,
        client: clientsMap.get(config.client_id) || null,
      })) as ClientReportConfigWithClient[];
    },
  });
}

// Fetch single config
export function useClientReportConfig(id: string | undefined) {
  return useQuery({
    queryKey: ['client-report-config', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('client_report_configs')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as ClientReportConfig | null;
    },
    enabled: !!id,
  });
}

// Create report config
export function useCreateClientReportConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: Omit<ClientReportConfig, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('client_report_configs')
        .insert([{
          client_id: config.client_id,
          report_type: config.report_type,
          config_name: config.config_name,
          template_config: config.template_config,
          header_config: config.header_config,
          field_mappings: config.field_mappings,
          is_active: config.is_active,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-report-configs'] });
      toast.success('Report configuration created');
    },
    onError: (error: Error) => {
      toast.error('Failed to create configuration', { description: error.message });
    },
  });
}

// Update report config
export function useUpdateClientReportConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<ClientReportConfig>;
    }) => {
      // Convert to proper format
      const updateData: Record<string, unknown> = {};
      if (updates.client_id) updateData.client_id = updates.client_id;
      if (updates.report_type) updateData.report_type = updates.report_type;
      if (updates.config_name) updateData.config_name = updates.config_name;
      if (updates.template_config) updateData.template_config = updates.template_config;
      if (updates.header_config) updateData.header_config = updates.header_config;
      if (updates.field_mappings) updateData.field_mappings = updates.field_mappings;
      if (typeof updates.is_active === 'boolean') updateData.is_active = updates.is_active;

      const { data, error } = await supabase
        .from('client_report_configs')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-report-configs'] });
      toast.success('Report configuration updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to update configuration', { description: error.message });
    },
  });
}

// Delete report config
export function useDeleteClientReportConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('client_report_configs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-report-configs'] });
      toast.success('Report configuration deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete configuration', { description: error.message });
    },
  });
}
