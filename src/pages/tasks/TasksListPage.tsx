import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks, TaskWithDetails } from '@/hooks/useTasks';
import { useBranches } from '@/hooks/useBranches';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ClipboardList, 
  Eye, 
  Clock, 
  AlertTriangle, 
  CheckCircle2,
  UserPlus,
  UserCog,
  Filter
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { TaskAssignmentDialog } from '@/components/tasks/TaskAssignmentDialog';
import type { Enums } from '@/integrations/supabase/types';

type TaskStatus = Enums<'task_status'>;

const statusColors: Record<TaskStatus, string> = {
  pending: 'bg-gray-100 text-gray-700',
  assigned: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  qc_review: 'bg-purple-100 text-purple-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
};

const statusLabels: Record<TaskStatus, string> = {
  pending: 'Pending',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  completed: 'Completed',
  qc_review: 'QC Review',
  approved: 'Approved',
  rejected: 'Rejected',
};

const verificationTypeLabels: Record<string, string> = {
  residence: 'Residence Verification',
  office: 'Office Verification',
  business: 'Business Verification',
  document_verification: 'Document Verification',
  tele_verification: 'Tele Verification',
  reference_check: 'Reference Check',
  asset_verification: 'Asset Verification',
  income_verification: 'Income Verification',
  bank: 'Bank Verification',
  residential: 'Residential Verification',
};

export default function TasksListPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [assignmentTask, setAssignmentTask] = useState<TaskWithDetails | null>(null);

  const { data: branches } = useBranches();
  const { data: tasks, isLoading } = useTasks(
    statusFilter !== 'all' || branchFilter !== 'all'
      ? {
          ...(statusFilter !== 'all' && { status: statusFilter }),
          ...(branchFilter !== 'all' && { branchId: branchFilter }),
        }
      : undefined
  );

  const columns = [
    { 
      key: 'task_number', 
      header: 'Task #',
      render: (task: TaskWithDetails) => (
        <span className="font-mono font-medium">{task.task_number}</span>
      ),
    },
    {
      key: 'applicant',
      header: 'Applicant',
      render: (task: TaskWithDetails) => (
        <div>
          <p className="font-medium">{task.lead?.applicant_name || 'N/A'}</p>
          <p className="text-xs text-muted-foreground">{task.lead?.lead_number}</p>
        </div>
      ),
    },
    {
      key: 'verification_type',
      header: 'Type',
      render: (task: TaskWithDetails) => (
        <Badge variant="outline">
          {verificationTypeLabels[task.verification_type] || task.verification_type}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (task: TaskWithDetails) => (
        <Badge className={statusColors[task.status || 'pending']}>
          {statusLabels[task.status || 'pending']}
        </Badge>
      ),
    },
    {
      key: 'assigned_to',
      header: 'Assigned To',
      render: (task: TaskWithDetails) => (
        task.assigned_user ? (
          <div>
            <p className="text-sm font-medium">{task.assigned_user.full_name}</p>
            {task.field_executive && (
              <p className="text-xs text-muted-foreground">{task.field_executive.employee_code}</p>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground italic">Unassigned</span>
        )
      ),
    },
    {
      key: 'sla_deadline',
      header: 'SLA',
      render: (task: TaskWithDetails) => {
        if (!task.sla_deadline) return <span className="text-muted-foreground">-</span>;
        const deadline = new Date(task.sla_deadline);
        const isOverdue = task.is_overdue || deadline < new Date();
        return (
          <div className={isOverdue ? 'text-destructive' : ''}>
            <p className="text-sm">{format(deadline, 'MMM dd, HH:mm')}</p>
            <p className="text-xs">
              {isOverdue ? 'Overdue' : formatDistanceToNow(deadline, { addSuffix: true })}
            </p>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (task: TaskWithDetails) => {
        const isFinalized = ['approved', 'rejected'].includes(task.status || '');
        const isUnassigned = task.status === 'pending' || !task.assigned_to;
        return (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/tasks/${task.id}`)}>
              <Eye className="h-4 w-4" />
            </Button>
            {!isFinalized && isUnassigned && (
              <Button variant="ghost" size="icon" onClick={() => setAssignmentTask(task)} title="Assign">
                <UserPlus className="h-4 w-4" />
              </Button>
            )}
            {!isFinalized && !isUnassigned && (
              <Button variant="ghost" size="icon" onClick={() => setAssignmentTask(task)} title="Reassign">
                <UserCog className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  // Stats
  const pendingCount = tasks?.filter(t => t.status === 'pending').length || 0;
  const overdueCount = tasks?.filter(t => t.is_overdue).length || 0;
  const completedTodayCount = tasks?.filter(t => {
    if (!t.completed_at) return false;
    const today = new Date();
    const completedAt = new Date(t.completed_at);
    return completedAt.toDateString() === today.toDateString();
  }).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-6 w-6" />
            All Tasks
          </h1>
          <p className="text-muted-foreground">Manage and track verification tasks</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{tasks?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Pending Assignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{overdueCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              Completed Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{completedTodayCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filters:</span>
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TaskStatus | 'all')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(statusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={branchFilter} onValueChange={setBranchFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Branch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {branches?.map(branch => (
              <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tasks Table */}
      <DataTable
        data={tasks || []}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search tasks..."
        searchKeys={['task_number']}
      />

      {/* Assignment Dialog */}
      <TaskAssignmentDialog
        task={assignmentTask}
        onClose={() => setAssignmentTask(null)}
      />
    </div>
  );
}
