import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, subMonths, format, differenceInHours } from 'date-fns';

export interface VolumeData {
  date: string;
  total: number;
  completed: number;
  pending: number;
}

export interface TATData {
  verification_type: string;
  avg_tat_hours: number;
  min_tat_hours: number;
  max_tat_hours: number;
  count: number;
}

export interface FEProductivityData {
  fe_id: string;
  fe_name: string;
  employee_code: string;
  total_tasks: number;
  completed_tasks: number;
  approved_tasks: number;
  rejected_tasks: number;
  avg_tat_hours: number;
  productivity_score: number;
}

export interface SLAData {
  branch_id: string;
  branch_name: string;
  total_tasks: number;
  on_time: number;
  breached: number;
  sla_percentage: number;
}

export interface DateRange {
  from: Date;
  to: Date;
}

// Volume Report Hook
export function useVolumeReport(dateRange: DateRange, branchId?: string, clientId?: string) {
  return useQuery({
    queryKey: ['volume-report', dateRange, branchId, clientId],
    queryFn: async () => {
      let query = supabase
        .from('tasks')
        .select(`
          id,
          created_at,
          status,
          branch_id,
          lead:leads!inner(client_id)
        `)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      if (clientId) {
        query = query.eq('lead.client_id', clientId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group by date
      const volumeByDate: Record<string, { total: number; completed: number; pending: number }> = {};
      
      data?.forEach(task => {
        const date = format(new Date(task.created_at), 'yyyy-MM-dd');
        if (!volumeByDate[date]) {
          volumeByDate[date] = { total: 0, completed: 0, pending: 0 };
        }
        volumeByDate[date].total++;
        if (task.status === 'approved' || task.status === 'rejected') {
          volumeByDate[date].completed++;
        } else {
          volumeByDate[date].pending++;
        }
      });

      return Object.entries(volumeByDate)
        .map(([date, stats]) => ({ date, ...stats }))
        .sort((a, b) => a.date.localeCompare(b.date));
    },
  });
}

// Volume Summary Hook
export function useVolumeSummary(dateRange: DateRange) {
  return useQuery({
    queryKey: ['volume-summary', dateRange],
    queryFn: async () => {
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select(`
          id,
          status,
          verification_type,
          branch:branches(name),
          lead:leads!inner(client:clients(name))
        `)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      if (error) throw error;

      // By verification type
      const byType: Record<string, number> = {};
      // By branch
      const byBranch: Record<string, number> = {};
      // By client
      const byClient: Record<string, number> = {};
      
      let total = 0;
      let completed = 0;

      tasks?.forEach(task => {
        total++;
        if (task.status === 'approved' || task.status === 'rejected') {
          completed++;
        }

        // Count by type
        const type = task.verification_type;
        byType[type] = (byType[type] || 0) + 1;

        // Count by branch
        const branchName = (task.branch as any)?.name || 'Unknown';
        byBranch[branchName] = (byBranch[branchName] || 0) + 1;

        // Count by client
        const clientName = (task.lead as any)?.client?.name || 'Unknown';
        byClient[clientName] = (byClient[clientName] || 0) + 1;
      });

      return {
        total,
        completed,
        pending: total - completed,
        byType: Object.entries(byType).map(([name, value]) => ({ name, value })),
        byBranch: Object.entries(byBranch).map(([name, value]) => ({ name, value })),
        byClient: Object.entries(byClient).map(([name, value]) => ({ name, value })),
      };
    },
  });
}

// TAT Report Hook
export function useTATReport(dateRange: DateRange, branchId?: string) {
  return useQuery({
    queryKey: ['tat-report', dateRange, branchId],
    queryFn: async () => {
      let query = supabase
        .from('tasks')
        .select(`
          id,
          verification_type,
          created_at,
          completed_at,
          status,
          branch:branches(name)
        `)
        .in('status', ['approved', 'rejected'])
        .not('completed_at', 'is', null)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calculate TAT by verification type
      const tatByType: Record<string, { total: number; count: number; min: number; max: number }> = {};

      data?.forEach(task => {
        if (!task.completed_at) return;
        
        const tatHours = differenceInHours(new Date(task.completed_at), new Date(task.created_at));
        const type = task.verification_type;

        if (!tatByType[type]) {
          tatByType[type] = { total: 0, count: 0, min: Infinity, max: 0 };
        }

        tatByType[type].total += tatHours;
        tatByType[type].count++;
        tatByType[type].min = Math.min(tatByType[type].min, tatHours);
        tatByType[type].max = Math.max(tatByType[type].max, tatHours);
      });

      return Object.entries(tatByType).map(([type, stats]) => ({
        verification_type: type,
        avg_tat_hours: Math.round(stats.total / stats.count),
        min_tat_hours: stats.min === Infinity ? 0 : stats.min,
        max_tat_hours: stats.max,
        count: stats.count,
      }));
    },
  });
}

// TAT Trend Hook
export function useTATTrend(dateRange: DateRange) {
  return useQuery({
    queryKey: ['tat-trend', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('created_at, completed_at, status')
        .in('status', ['approved', 'rejected'])
        .not('completed_at', 'is', null)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      if (error) throw error;

      // Group by date and calculate average TAT
      const tatByDate: Record<string, { total: number; count: number }> = {};

      data?.forEach(task => {
        if (!task.completed_at) return;
        
        const date = format(new Date(task.created_at), 'yyyy-MM-dd');
        const tatHours = differenceInHours(new Date(task.completed_at), new Date(task.created_at));

        if (!tatByDate[date]) {
          tatByDate[date] = { total: 0, count: 0 };
        }

        tatByDate[date].total += tatHours;
        tatByDate[date].count++;
      });

      return Object.entries(tatByDate)
        .map(([date, stats]) => ({
          date,
          avg_tat: Math.round(stats.total / stats.count),
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    },
  });
}

// FE Productivity Hook
export function useFEProductivity(dateRange: DateRange, branchId?: string) {
  return useQuery({
    queryKey: ['fe-productivity', dateRange, branchId],
    queryFn: async () => {
      let query = supabase
        .from('tasks')
        .select(`
          id,
          status,
          created_at,
          completed_at,
          assigned_to,
          branch_id,
          assignee:profiles!tasks_assigned_to_fkey(full_name),
          field_executive:field_executives!inner(id, employee_code, user_id)
        `)
        .not('assigned_to', 'is', null)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group by field executive
      const feStats: Record<string, {
        fe_id: string;
        fe_name: string;
        employee_code: string;
        total_tasks: number;
        completed_tasks: number;
        approved_tasks: number;
        rejected_tasks: number;
        total_tat: number;
        tat_count: number;
      }> = {};

      data?.forEach(task => {
        const feId = task.assigned_to!;
        const fe = task.field_executive as any;
        const assignee = task.assignee as any;
        
        if (!fe) return;

        if (!feStats[feId]) {
          feStats[feId] = {
            fe_id: feId,
            fe_name: assignee?.full_name || 'Unknown',
            employee_code: fe?.employee_code || 'N/A',
            total_tasks: 0,
            completed_tasks: 0,
            approved_tasks: 0,
            rejected_tasks: 0,
            total_tat: 0,
            tat_count: 0,
          };
        }

        feStats[feId].total_tasks++;

        if (task.status === 'approved') {
          feStats[feId].completed_tasks++;
          feStats[feId].approved_tasks++;
        } else if (task.status === 'rejected') {
          feStats[feId].completed_tasks++;
          feStats[feId].rejected_tasks++;
        }

        if (task.completed_at) {
          const tatHours = differenceInHours(new Date(task.completed_at), new Date(task.created_at));
          feStats[feId].total_tat += tatHours;
          feStats[feId].tat_count++;
        }
      });

      return Object.values(feStats).map(fe => ({
        ...fe,
        avg_tat_hours: fe.tat_count > 0 ? Math.round(fe.total_tat / fe.tat_count) : 0,
        productivity_score: fe.total_tasks > 0 
          ? Math.round((fe.approved_tasks / fe.total_tasks) * 100)
          : 0,
      })).sort((a, b) => b.productivity_score - a.productivity_score);
    },
  });
}

// SLA Report Hook
export function useSLAReport(dateRange: DateRange) {
  return useQuery({
    queryKey: ['sla-report', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          id,
          is_overdue,
          status,
          sla_deadline,
          completed_at,
          branch:branches(id, name)
        `)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      if (error) throw error;

      // Group by branch
      const branchStats: Record<string, {
        branch_id: string;
        branch_name: string;
        total_tasks: number;
        on_time: number;
        breached: number;
      }> = {};

      data?.forEach(task => {
        const branch = task.branch as any;
        if (!branch) return;

        const branchId = branch.id;
        if (!branchStats[branchId]) {
          branchStats[branchId] = {
            branch_id: branchId,
            branch_name: branch.name,
            total_tasks: 0,
            on_time: 0,
            breached: 0,
          };
        }

        branchStats[branchId].total_tasks++;

        // Determine if task was completed on time
        if (task.status === 'approved' || task.status === 'rejected') {
          if (task.is_overdue || (task.sla_deadline && task.completed_at && 
              new Date(task.completed_at) > new Date(task.sla_deadline))) {
            branchStats[branchId].breached++;
          } else {
            branchStats[branchId].on_time++;
          }
        } else if (task.is_overdue) {
          branchStats[branchId].breached++;
        }
      });

      return Object.values(branchStats).map(branch => ({
        ...branch,
        sla_percentage: branch.total_tasks > 0
          ? Math.round((branch.on_time / branch.total_tasks) * 100)
          : 100,
      })).sort((a, b) => b.sla_percentage - a.sla_percentage);
    },
  });
}

// SLA Summary Hook
export function useSLASummary(dateRange: DateRange) {
  return useQuery({
    queryKey: ['sla-summary', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, is_overdue, status, sla_deadline, completed_at')
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      if (error) throw error;

      let total = 0;
      let onTime = 0;
      let breached = 0;
      let atRisk = 0;

      data?.forEach(task => {
        total++;

        if (task.status === 'approved' || task.status === 'rejected') {
          if (task.is_overdue || (task.sla_deadline && task.completed_at && 
              new Date(task.completed_at) > new Date(task.sla_deadline))) {
            breached++;
          } else {
            onTime++;
          }
        } else {
          // Check if at risk (within 4 hours of SLA deadline)
          if (task.sla_deadline) {
            const hoursUntilDeadline = differenceInHours(new Date(task.sla_deadline), new Date());
            if (hoursUntilDeadline < 0) {
              breached++;
            } else if (hoursUntilDeadline < 4) {
              atRisk++;
            }
          }
        }
      });

      return {
        total,
        onTime,
        breached,
        atRisk,
        slaPercentage: total > 0 ? Math.round((onTime / total) * 100) : 100,
      };
    },
  });
}

// Helper to get default date range (current month)
export function getDefaultDateRange(): DateRange {
  return {
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  };
}

// Helper to get last month date range
export function getLastMonthDateRange(): DateRange {
  const lastMonth = subMonths(new Date(), 1);
  return {
    from: startOfMonth(lastMonth),
    to: endOfMonth(lastMonth),
  };
}
