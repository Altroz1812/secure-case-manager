import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { startOfDay, startOfWeek, endOfDay, subDays } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];
type VerificationType = Database['public']['Enums']['verification_type'];

export interface DashboardStats {
  todaysLeads: number;
  pendingTasks: number;
  slaBreaches: number;
  completedToday: number;
  pendingFEAcceptance: number;
  // Trends (comparing to yesterday)
  leadsChange: number;
  completedChange: number;
}

export interface FEStats {
  assignedToMe: number;
  completedToday: number;
  slaWarning: number;
  weeklyCompletions: number;
  weeklyChange: number;
}

export interface AnalystStats {
  pendingReview: number;
  inProgress: number;
  completedToday: number;
  slaAlerts: number;
}

export interface QCStats {
  pendingQC: number;
  approvedToday: number;
  rejectedToday: number;
  approvalChange: number;
}

export interface TeamActivity {
  name: string;
  activeUsers: number;
  totalUsers: number;
  activeTasks: number;
}

export interface RecentTask {
  id: string;
  task_number: string;
  verification_type: string;
  status: string;
  client_name: string;
  created_at: string;
}

export interface SLAOverview {
  type: string;
  healthy: number;
  warning: number;
  breached: number;
}

// Main dashboard stats for Admin/Ops Manager/Intake
export function useDashboardStats() {
  const { user, hasAnyRole } = useAuth();
  const enabled = hasAnyRole(['admin', 'ops_manager', 'intake']);

  return useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: async (): Promise<DashboardStats> => {
      const today = startOfDay(new Date());
      const yesterday = startOfDay(subDays(new Date(), 1));
      const endToday = endOfDay(new Date());

      // Today's leads count
      const { count: todaysLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString())
        .lte('created_at', endToday.toISOString());

      // Yesterday's leads for comparison
      const { count: yesterdaysLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', today.toISOString());

      // Pending tasks
      const { count: pendingTasks } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'assigned', 'in_progress']);

      // SLA breaches
      const { count: slaBreaches } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('is_overdue', true)
        .not('status', 'in', '("approved","rejected")');

      // Completed today
      const { count: completedToday } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .gte('completed_at', today.toISOString())
        .lte('completed_at', endToday.toISOString());

      // Completed yesterday
      const { count: completedYesterday } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .gte('completed_at', yesterday.toISOString())
        .lt('completed_at', today.toISOString());

      // Calculate percentage changes
      const leadsChange = yesterdaysLeads && yesterdaysLeads > 0 
        ? Math.round(((todaysLeads || 0) - yesterdaysLeads) / yesterdaysLeads * 100)
        : 0;

      const completedChange = completedYesterday && completedYesterday > 0
        ? Math.round(((completedToday || 0) - completedYesterday) / completedYesterday * 100)
        : 0;

      return {
        todaysLeads: todaysLeads || 0,
        pendingTasks: pendingTasks || 0,
        slaBreaches: slaBreaches || 0,
        completedToday: completedToday || 0,
        leadsChange,
        completedChange,
      };
    },
    enabled,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

// Field Executive stats
export function useFEStats() {
  const { user, hasRole } = useAuth();
  const enabled = hasRole('field_executive');

  return useQuery({
    queryKey: ['fe-stats', user?.id],
    queryFn: async (): Promise<FEStats> => {
      const today = startOfDay(new Date());
      const endToday = endOfDay(new Date());
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const lastWeekStart = subDays(weekStart, 7);

      // Assigned to me (active tasks)
      const { count: assignedToMe } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user?.id)
        .in('status', ['assigned', 'in_progress']);

      // Completed today by me
      const { count: completedToday } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user?.id)
        .gte('completed_at', today.toISOString())
        .lte('completed_at', endToday.toISOString());

      // SLA warning (approaching deadline within 4 hours)
      const fourHoursFromNow = new Date(Date.now() + 4 * 60 * 60 * 1000);
      const { count: slaWarning } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user?.id)
        .in('status', ['assigned', 'in_progress'])
        .lte('sla_deadline', fourHoursFromNow.toISOString())
        .gt('sla_deadline', new Date().toISOString());

      // This week's completions
      const { count: weeklyCompletions } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user?.id)
        .gte('completed_at', weekStart.toISOString());

      // Last week's completions for comparison
      const { count: lastWeekCompletions } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user?.id)
        .gte('completed_at', lastWeekStart.toISOString())
        .lt('completed_at', weekStart.toISOString());

      const weeklyChange = lastWeekCompletions && lastWeekCompletions > 0
        ? Math.round(((weeklyCompletions || 0) - lastWeekCompletions) / lastWeekCompletions * 100)
        : 0;

      return {
        assignedToMe: assignedToMe || 0,
        completedToday: completedToday || 0,
        slaWarning: slaWarning || 0,
        weeklyCompletions: weeklyCompletions || 0,
        weeklyChange,
      };
    },
    enabled,
    refetchInterval: 30000,
  });
}

// Analyst stats
export function useAnalystStats() {
  const { user, hasRole } = useAuth();
  const enabled = hasRole('analyst');

  return useQuery({
    queryKey: ['analyst-stats', user?.id],
    queryFn: async (): Promise<AnalystStats> => {
      const today = startOfDay(new Date());
      const endToday = endOfDay(new Date());
      const fourHoursFromNow = new Date(Date.now() + 4 * 60 * 60 * 1000);

      // Pending review (assigned to analyst, not yet started)
      const { count: pendingReview } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user?.id)
        .eq('status', 'assigned');

      // In progress
      const { count: inProgress } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user?.id)
        .eq('status', 'in_progress');

      // Completed today (sent for QC)
      const { count: completedToday } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user?.id)
        .in('status', ['completed', 'qc_review'])
        .gte('completed_at', today.toISOString())
        .lte('completed_at', endToday.toISOString());

      // SLA alerts
      const { count: slaAlerts } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user?.id)
        .in('status', ['assigned', 'in_progress'])
        .lte('sla_deadline', fourHoursFromNow.toISOString())
        .gt('sla_deadline', new Date().toISOString());

      return {
        pendingReview: pendingReview || 0,
        inProgress: inProgress || 0,
        completedToday: completedToday || 0,
        slaAlerts: slaAlerts || 0,
      };
    },
    enabled,
    refetchInterval: 30000,
  });
}

// QC stats
export function useQCStats() {
  const { user, hasRole } = useAuth();
  const enabled = hasRole('qc');

  return useQuery({
    queryKey: ['qc-stats', user?.id],
    queryFn: async (): Promise<QCStats> => {
      const today = startOfDay(new Date());
      const endToday = endOfDay(new Date());
      const yesterday = startOfDay(subDays(new Date(), 1));

      // Pending QC
      const { count: pendingQC } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'qc_review');

      // Approved today
      const { count: approvedToday } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')
        .eq('qc_reviewed_by', user?.id)
        .gte('qc_reviewed_at', today.toISOString())
        .lte('qc_reviewed_at', endToday.toISOString());

      // Approved yesterday
      const { count: approvedYesterday } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')
        .eq('qc_reviewed_by', user?.id)
        .gte('qc_reviewed_at', yesterday.toISOString())
        .lt('qc_reviewed_at', today.toISOString());

      // Rejected today
      const { count: rejectedToday } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'rejected')
        .eq('qc_reviewed_by', user?.id)
        .gte('qc_reviewed_at', today.toISOString())
        .lte('qc_reviewed_at', endToday.toISOString());

      const approvalChange = approvedYesterday && approvedYesterday > 0
        ? Math.round(((approvedToday || 0) - approvedYesterday) / approvedYesterday * 100)
        : 0;

      return {
        pendingQC: pendingQC || 0,
        approvedToday: approvedToday || 0,
        rejectedToday: rejectedToday || 0,
        approvalChange,
      };
    },
    enabled,
    refetchInterval: 30000,
  });
}

// Recent tasks
export function useRecentTasks(limit: number = 4) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recent-tasks', user?.id, limit],
    queryFn: async (): Promise<RecentTask[]> => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          id,
          task_number,
          verification_type,
          status,
          created_at,
          leads!inner(
            clients!inner(name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(task => ({
        id: task.id,
        task_number: task.task_number,
        verification_type: task.verification_type,
        status: task.status || 'pending',
        client_name: (task.leads as any)?.clients?.name || 'Unknown',
        created_at: task.created_at,
      }));
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}

// Team activity for Admin/Ops Manager
export function useTeamActivity() {
  const { hasAnyRole } = useAuth();
  const enabled = hasAnyRole(['admin', 'ops_manager']);

  return useQuery({
    queryKey: ['team-activity'],
    queryFn: async (): Promise<TeamActivity[]> => {
      const roles: { name: string; role: AppRole }[] = [
        { name: 'Field Executives', role: 'field_executive' },
        { name: 'Analysts', role: 'analyst' },
        { name: 'QC Team', role: 'qc' },
        { name: 'Intake Team', role: 'intake' },
      ];

      const activities: TeamActivity[] = [];

      for (const { name, role } of roles) {
        // Get users with this role
        const { data: roleUsers } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', role);

        const userIds = (roleUsers || []).map(r => r.user_id);
        const totalUsers = userIds.length;

        // Get active profiles (users who are active)
        const { data: activeProfiles } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('is_active', true)
          .in('user_id', userIds.length > 0 ? userIds : ['none']);

        const activeUsers = (activeProfiles || []).length;

        // Get active tasks for these users
        const { count: activeTasks } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .in('assigned_to', userIds.length > 0 ? userIds : ['none'])
          .in('status', ['assigned', 'in_progress', 'qc_review']);

        activities.push({
          name,
          activeUsers,
          totalUsers,
          activeTasks: activeTasks || 0,
        });
      }

      return activities;
    },
    enabled,
    refetchInterval: 60000, // Refresh every minute
  });
}

// SLA Overview
export function useSLAOverview() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['sla-overview', user?.id],
    queryFn: async (): Promise<SLAOverview[]> => {
      const verificationTypes: VerificationType[] = ['residential', 'business', 'property', 'end_use', 'itr', 'bank', 'profile', 'bgv'];
      const fourHoursFromNow = new Date(Date.now() + 4 * 60 * 60 * 1000);
      const now = new Date();

      const overview: SLAOverview[] = [];

      for (const type of verificationTypes) {
        // Healthy (not overdue, deadline > 4 hours)
        const { count: healthy } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('verification_type', type)
          .in('status', ['pending', 'assigned', 'in_progress'])
          .eq('is_overdue', false)
          .gt('sla_deadline', fourHoursFromNow.toISOString());

        // Warning (not overdue, deadline within 4 hours)
        const { count: warning } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('verification_type', type)
          .in('status', ['pending', 'assigned', 'in_progress'])
          .eq('is_overdue', false)
          .lte('sla_deadline', fourHoursFromNow.toISOString())
          .gt('sla_deadline', now.toISOString());

        // Breached
        const { count: breached } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('verification_type', type)
          .in('status', ['pending', 'assigned', 'in_progress'])
          .eq('is_overdue', true);

        // Only include types with tasks
        const total = (healthy || 0) + (warning || 0) + (breached || 0);
        if (total > 0) {
          overview.push({
            type: type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' '),
            healthy: healthy || 0,
            warning: warning || 0,
            breached: breached || 0,
          });
        }
      }

      return overview;
    },
    enabled: !!user,
    refetchInterval: 60000,
  });
}
