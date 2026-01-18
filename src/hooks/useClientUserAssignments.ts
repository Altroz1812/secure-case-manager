import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type ClientUserAssignment = Tables<'client_user_assignments'>;

export interface ClientUserAssignmentWithDetails extends ClientUserAssignment {
  client: { id: string; name: string; code: string } | null;
  user: { user_id: string; full_name: string; email: string } | null;
}

export function useClientUserAssignments() {
  return useQuery({
    queryKey: ['client_user_assignments'],
    queryFn: async () => {
      // Fetch assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('client_user_assignments')
        .select('*')
        .order('created_at', { ascending: false });

      if (assignmentsError) throw assignmentsError;

      // Fetch clients
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, name, code');

      if (clientsError) throw clientsError;

      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email');

      if (profilesError) throw profilesError;

      // Combine data
      const assignmentsWithDetails: ClientUserAssignmentWithDetails[] = (assignments || []).map(assignment => ({
        ...assignment,
        client: (clients || []).find(c => c.id === assignment.client_id) || null,
        user: (profiles || []).find(p => p.user_id === assignment.user_id) || null,
      }));

      return assignmentsWithDetails;
    },
  });
}

export function useClientViewerUsers() {
  return useQuery({
    queryKey: ['client_viewer_users'],
    queryFn: async () => {
      // Fetch users with client_viewer role
      const { data: clientViewerRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'client_viewer');

      if (rolesError) throw rolesError;

      const clientViewerUserIds = (clientViewerRoles || []).map(r => r.user_id);

      if (clientViewerUserIds.length === 0) {
        return [];
      }

      // Fetch profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', clientViewerUserIds)
        .order('full_name');

      if (profilesError) throw profilesError;

      return profiles || [];
    },
  });
}

export function useCreateClientUserAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, clientId }: { userId: string; clientId: string }) => {
      const { data, error } = await supabase
        .from('client_user_assignments')
        .insert({ user_id: userId, client_id: clientId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client_user_assignments'] });
      toast.success('Client assignment created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create client assignment', { description: error.message });
    },
  });
}

export function useDeleteClientUserAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('client_user_assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client_user_assignments'] });
      toast.success('Client assignment deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete client assignment', { description: error.message });
    },
  });
}
