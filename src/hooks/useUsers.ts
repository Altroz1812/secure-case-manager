import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;
type ProfileUpdate = TablesUpdate<'profiles'>;
type UserRole = Tables<'user_roles'>;
type UserBranchAssignment = Tables<'user_branch_assignments'>;

export interface UserWithDetails extends Profile {
  roles: string[];
  branches: { id: string; name: string; is_primary: boolean }[];
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');
      
      if (profilesError) throw profilesError;

      // Fetch roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');
      
      if (rolesError) throw rolesError;

      // Fetch branch assignments
      const { data: branchAssignments, error: branchError } = await supabase
        .from('user_branch_assignments')
        .select('*, branches(id, name)');
      
      if (branchError) throw branchError;

      // Combine data
      const usersWithDetails: UserWithDetails[] = (profiles || []).map(profile => ({
        ...profile,
        roles: (roles || [])
          .filter(r => r.user_id === profile.user_id)
          .map(r => r.role),
        branches: (branchAssignments || [])
          .filter(b => b.user_id === profile.user_id)
          .map(b => ({
            id: b.branch_id,
            name: (b.branches as { id: string; name: string })?.name || '',
            is_primary: b.is_primary || false,
          })),
      }));

      return usersWithDetails;
    },
  });
}

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (profileError) throw profileError;
      if (!profile) return null;

      const { data: roles } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', profile.user_id);

      const { data: branchAssignments } = await supabase
        .from('user_branch_assignments')
        .select('*, branches(id, name)')
        .eq('user_id', profile.user_id);

      return {
        ...profile,
        roles: (roles || []).map(r => r.role),
        branches: (branchAssignments || []).map(b => ({
          id: b.branch_id,
          name: (b.branches as { id: string; name: string })?.name || '',
          is_primary: b.is_primary || false,
        })),
      } as UserWithDetails;
    },
    enabled: !!id,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: ProfileUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Profile updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update profile', { description: error.message });
    },
  });
}

type AppRole = 'admin' | 'intake' | 'analyst' | 'field_executive' | 'qc' | 'ops_manager' | 'client_viewer';

export function useAssignRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Role assigned successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to assign role', { description: error.message });
    },
  });
}

export function useRemoveRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Role removed successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to remove role', { description: error.message });
    },
  });
}

export function useAssignBranch() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, branchId, isPrimary }: { userId: string; branchId: string; isPrimary?: boolean }) => {
      const { error } = await supabase
        .from('user_branch_assignments')
        .insert({ user_id: userId, branch_id: branchId, is_primary: isPrimary || false });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Branch assigned successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to assign branch', { description: error.message });
    },
  });
}

export function useRemoveBranch() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, branchId }: { userId: string; branchId: string }) => {
      const { error } = await supabase
        .from('user_branch_assignments')
        .delete()
        .eq('user_id', userId)
        .eq('branch_id', branchId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Branch removed successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to remove branch', { description: error.message });
    },
  });
}
