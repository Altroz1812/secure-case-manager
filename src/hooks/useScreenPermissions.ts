import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ScreenPermission {
  id: string;
  user_id: string;
  screen_path: string;
  screen_name: string;
  is_allowed: boolean;
  created_at: string;
  updated_at: string;
}

interface ScreenPermissionInsert {
  user_id: string;
  screen_path: string;
  screen_name: string;
  is_allowed: boolean;
}

// All available screens in the application
export const AVAILABLE_SCREENS = [
  { path: '/dashboard', name: 'Dashboard' },
  { path: '/emails', name: 'Email Inbox' },
  { path: '/leads', name: 'Leads' },
  { path: '/leads/new', name: 'Create Lead' },
  { path: '/tasks', name: 'Tasks List' },
  { path: '/my-tasks', name: 'My Tasks' },
  { path: '/qc-review', name: 'QC Review' },
  { path: '/admin/clients', name: 'Clients Management' },
  { path: '/admin/branches', name: 'Branches Management' },
  { path: '/admin/users', name: 'Users Management' },
  { path: '/admin/field-executives', name: 'Field Executives' },
  { path: '/admin/products', name: 'Products Management' },
  { path: '/admin/verification-types', name: 'Verification Types' },
  { path: '/admin/client-assignments', name: 'Client Assignments' },
  { path: '/admin/report-config', name: 'Report Configuration' },
  { path: '/reports/volume', name: 'Volume Report' },
  { path: '/reports/tat', name: 'TAT Report' },
  { path: '/reports/productivity', name: 'Productivity Report' },
  { path: '/reports/sla', name: 'SLA Report' },
  { path: '/reports/reassignment', name: 'Reassignment Report' },
  { path: '/reports/audit', name: 'Audit Logs' },
  { path: '/reports/history', name: 'Report History' },
  { path: '/client-portal', name: 'Client Portal' },
  { path: '/notifications', name: 'Notifications' },
  { path: '/settings', name: 'Settings' },
];

export function useUserScreenPermissions(userId: string | undefined) {
  return useQuery({
    queryKey: ['screen-permissions', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('user_screen_permissions')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      return data as ScreenPermission[];
    },
    enabled: !!userId,
  });
}

export function useMyScreenPermissions() {
  return useQuery({
    queryKey: ['my-screen-permissions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_screen_permissions')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data as ScreenPermission[];
    },
  });
}

export function useSetScreenPermission() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: ScreenPermissionInsert) => {
      // Upsert - insert or update on conflict
      const { error } = await supabase
        .from('user_screen_permissions')
        .upsert(data, { 
          onConflict: 'user_id,screen_path',
          ignoreDuplicates: false 
        });
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['screen-permissions', variables.user_id] });
      queryClient.invalidateQueries({ queryKey: ['my-screen-permissions'] });
      toast({ title: 'Permission updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error updating permission', description: error.message, variant: 'destructive' });
    },
  });
}

export function useBulkSetScreenPermissions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ userId, permissions }: { userId: string; permissions: { screen_path: string; screen_name: string; is_allowed: boolean }[] }) => {
      // Delete existing permissions for the user
      await supabase
        .from('user_screen_permissions')
        .delete()
        .eq('user_id', userId);
      
      // Insert new permissions (only those that are explicitly denied)
      const deniedPermissions = permissions
        .filter(p => !p.is_allowed)
        .map(p => ({
          user_id: userId,
          screen_path: p.screen_path,
          screen_name: p.screen_name,
          is_allowed: false,
        }));
      
      if (deniedPermissions.length > 0) {
        const { error } = await supabase
          .from('user_screen_permissions')
          .insert(deniedPermissions);
        
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['screen-permissions', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['my-screen-permissions'] });
      toast({ title: 'Permissions updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error updating permissions', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteScreenPermission() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ userId, screenPath }: { userId: string; screenPath: string }) => {
      const { error } = await supabase
        .from('user_screen_permissions')
        .delete()
        .eq('user_id', userId)
        .eq('screen_path', screenPath);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['screen-permissions', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['my-screen-permissions'] });
      toast({ title: 'Permission removed' });
    },
    onError: (error) => {
      toast({ title: 'Error removing permission', description: error.message, variant: 'destructive' });
    },
  });
}
