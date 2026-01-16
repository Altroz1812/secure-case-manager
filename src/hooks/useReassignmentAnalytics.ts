import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DateRange } from './useReports';

export interface ReassignmentStats {
  total_assignments: number;
  total_reassignments: number;
  reassignment_percentage: number;
  override_count: number;
}

export interface ReassignmentByReason {
  reason: string;
  count: number;
  percentage: number;
}

export interface ReassignmentByBranch {
  branch_id: string;
  branch_name: string;
  total_tasks: number;
  reassignments: number;
  reassignment_rate: number;
}

export function useReassignmentStats(dateRange: DateRange) {
  return useQuery({
    queryKey: ['reassignment-stats', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_assignments')
        .select('id, assigned_from, is_override')
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      if (error) throw error;

      const total_assignments = data?.length || 0;
      const reassignments = data?.filter(a => a.assigned_from !== null) || [];
      const total_reassignments = reassignments.length;
      const override_count = data?.filter(a => a.is_override).length || 0;

      return {
        total_assignments,
        total_reassignments,
        reassignment_percentage: total_assignments > 0 
          ? Math.round((total_reassignments / total_assignments) * 100) 
          : 0,
        override_count,
      } as ReassignmentStats;
    },
  });
}

export function useReassignmentByReason(dateRange: DateRange) {
  return useQuery({
    queryKey: ['reassignment-by-reason', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_assignments')
        .select('reason')
        .not('assigned_from', 'is', null)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      if (error) throw error;

      // Group by reason
      const reasonCounts: Record<string, number> = {};
      data?.forEach(assignment => {
        const reason = assignment.reason || 'No reason specified';
        reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
      });

      const total = data?.length || 0;

      return Object.entries(reasonCounts)
        .map(([reason, count]) => ({
          reason,
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count);
    },
  });
}

export function useReassignmentByBranch(dateRange: DateRange) {
  return useQuery({
    queryKey: ['reassignment-by-branch', dateRange],
    queryFn: async () => {
      // Get all task assignments with task details
      const { data: assignments, error: assignmentError } = await supabase
        .from('task_assignments')
        .select('id, task_id, assigned_from')
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      if (assignmentError) throw assignmentError;

      if (!assignments || assignments.length === 0) return [];

      // Get task branch info
      const taskIds = [...new Set(assignments.map(a => a.task_id))];
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, branch_id')
        .in('id', taskIds);

      if (tasksError) throw tasksError;

      // Get branch names
      const branchIds = [...new Set(tasks?.map(t => t.branch_id) || [])];
      const { data: branches, error: branchesError } = await supabase
        .from('branches')
        .select('id, name')
        .in('id', branchIds);

      if (branchesError) throw branchesError;

      const taskBranchMap = new Map(tasks?.map(t => [t.id, t.branch_id]) || []);
      const branchNameMap = new Map(branches?.map(b => [b.id, b.name]) || []);

      // Group assignments by branch
      const branchStats: Record<string, { total: number; reassignments: number }> = {};

      assignments.forEach(assignment => {
        const branchId = taskBranchMap.get(assignment.task_id);
        if (!branchId) return;

        if (!branchStats[branchId]) {
          branchStats[branchId] = { total: 0, reassignments: 0 };
        }

        branchStats[branchId].total++;
        if (assignment.assigned_from) {
          branchStats[branchId].reassignments++;
        }
      });

      return Object.entries(branchStats)
        .map(([branchId, stats]) => ({
          branch_id: branchId,
          branch_name: branchNameMap.get(branchId) || 'Unknown',
          total_tasks: stats.total,
          reassignments: stats.reassignments,
          reassignment_rate: stats.total > 0 
            ? Math.round((stats.reassignments / stats.total) * 100) 
            : 0,
        }))
        .sort((a, b) => b.reassignment_rate - a.reassignment_rate);
    },
  });
}

// Trend data for reassignments over time
export function useReassignmentTrend(dateRange: DateRange) {
  return useQuery({
    queryKey: ['reassignment-trend', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_assignments')
        .select('created_at, assigned_from')
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by date
      const dateStats: Record<string, { assignments: number; reassignments: number }> = {};

      data?.forEach(assignment => {
        const date = assignment.created_at.split('T')[0];
        if (!dateStats[date]) {
          dateStats[date] = { assignments: 0, reassignments: 0 };
        }
        dateStats[date].assignments++;
        if (assignment.assigned_from) {
          dateStats[date].reassignments++;
        }
      });

      return Object.entries(dateStats)
        .map(([date, stats]) => ({
          date,
          assignments: stats.assignments,
          reassignments: stats.reassignments,
          rate: stats.assignments > 0 
            ? Math.round((stats.reassignments / stats.assignments) * 100) 
            : 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    },
  });
}
