import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export interface AuditLog {
  id: string;
  user_id: string | null;
  entity_type: string;
  entity_id: string | null;
  action: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  branch_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AuditLogWithDetails extends AuditLog {
  user?: { full_name: string; email: string } | null;
  branch?: { name: string; code: string } | null;
}

export interface AuditLogFilters {
  entityType?: string;
  action?: string;
  userId?: string;
  branchId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  searchTerm?: string;
}

export function useAuditLogs(filters?: AuditLogFilters) {
  return useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (filters?.entityType) {
        query = query.eq('entity_type', filters.entityType);
      }
      if (filters?.action) {
        query = query.eq('action', filters.action);
      }
      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters?.branchId) {
        query = query.eq('branch_id', filters.branchId);
      }
      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom.toISOString());
      }
      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      if (!data || data.length === 0) return [];

      // Fetch related data
      const userIds = [...new Set(data.filter(l => l.user_id).map(l => l.user_id!))];
      const branchIds = [...new Set(data.filter(l => l.branch_id).map(l => l.branch_id!))];

      const [usersResult, branchesResult] = await Promise.all([
        userIds.length > 0
          ? supabase.from('profiles').select('user_id, full_name, email').in('user_id', userIds)
          : { data: [] },
        branchIds.length > 0
          ? supabase.from('branches').select('id, name, code').in('id', branchIds)
          : { data: [] },
      ]);

      const usersMap = new Map((usersResult.data || []).map(u => [u.user_id, u]));
      const branchesMap = new Map((branchesResult.data || []).map(b => [b.id, b]));

      return data.map(log => ({
        ...log,
        user: log.user_id ? usersMap.get(log.user_id) : null,
        branch: log.branch_id ? branchesMap.get(log.branch_id) : null,
      })) as AuditLogWithDetails[];
    },
  });
}

// Get unique entity types for filter dropdown
export function useAuditEntityTypes() {
  return useQuery({
    queryKey: ['audit-entity-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('entity_type')
        .limit(1000);

      if (error) throw error;

      const types = [...new Set(data.map(d => d.entity_type))].sort();
      return types;
    },
  });
}

// Get unique actions for filter dropdown
export function useAuditActions() {
  return useQuery({
    queryKey: ['audit-actions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('action')
        .limit(1000);

      if (error) throw error;

      const actions = [...new Set(data.map(d => d.action))].sort();
      return actions;
    },
  });
}

// Export audit logs to CSV format
export function exportAuditLogsToCSV(logs: AuditLogWithDetails[]): string {
  const headers = [
    'Date/Time',
    'User',
    'Entity Type',
    'Action',
    'Entity ID',
    'Branch',
    'IP Address',
    'Changes',
  ];

  const rows = logs.map(log => [
    format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
    log.user?.full_name || 'System',
    log.entity_type,
    log.action,
    log.entity_id || '-',
    log.branch?.name || '-',
    log.ip_address || '-',
    JSON.stringify(log.new_values || {}),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  return csvContent;
}
