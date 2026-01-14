import { useState } from 'react';
import { useMyTasks, useUpdateTaskStatus, TaskWithDetails } from '@/hooks/useTasks';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ClipboardCheck, 
  MapPin, 
  Clock, 
  AlertTriangle,
  Phone,
  Building,
  User,
  Play,
  CheckCircle,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
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
  residence: 'Residence',
  office: 'Office',
  business: 'Business',
  document_verification: 'Document',
  tele_verification: 'Tele',
  reference_check: 'Reference',
  asset_verification: 'Asset',
  income_verification: 'Income',
  bank: 'Bank',
  residential: 'Residential',
};

const verificationIcons: Record<string, React.ReactNode> = {
  residence: <Building className="h-5 w-5" />,
  office: <Building className="h-5 w-5" />,
  business: <Building className="h-5 w-5" />,
  document_verification: <ClipboardCheck className="h-5 w-5" />,
  tele_verification: <Phone className="h-5 w-5" />,
  reference_check: <User className="h-5 w-5" />,
  asset_verification: <Building className="h-5 w-5" />,
  income_verification: <ClipboardCheck className="h-5 w-5" />,
  bank: <Building className="h-5 w-5" />,
  residential: <Building className="h-5 w-5" />,
};

export default function MyTasksPage() {
  const { data: tasks, isLoading } = useMyTasks();
  const updateStatus = useUpdateTaskStatus();
  
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null);
  const [actionType, setActionType] = useState<'start' | 'complete' | null>(null);
  const [completionStatus, setCompletionStatus] = useState<TaskStatus>('completed');
  const [remarks, setRemarks] = useState('');

  const handleStartTask = (task: TaskWithDetails) => {
    updateStatus.mutate({ taskId: task.id, status: 'in_progress' });
  };

  const handleCompleteClick = (task: TaskWithDetails) => {
    setSelectedTask(task);
    setActionType('complete');
    setCompletionStatus('completed');
    setRemarks('');
  };

  const handleCompleteTask = () => {
    if (!selectedTask) return;
    updateStatus.mutate(
      { 
        taskId: selectedTask.id, 
        status: completionStatus,
        finalRemarks: remarks 
      },
      { onSuccess: () => {
        setSelectedTask(null);
        setActionType(null);
      }}
    );
  };

  // Group tasks by status
  const inProgressTasks = tasks?.filter(t => t.status === 'in_progress') || [];
  const assignedTasks = tasks?.filter(t => t.status === 'assigned') || [];
  const pendingQCTasks = tasks?.filter(t => t.status === 'qc_review' || t.status === 'rejected') || [];
  const completedTasks = tasks?.filter(t => t.status === 'completed' || t.status === 'approved') || [];

  const TaskCard = ({ task }: { task: TaskWithDetails }) => {
    const deadline = task.sla_deadline ? new Date(task.sla_deadline) : null;
    const isOverdue = task.is_overdue || (deadline && deadline < new Date());

    return (
      <Card className={`${isOverdue ? 'border-destructive' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {verificationIcons[task.verification_type]}
              <div>
                <CardTitle className="text-base">{task.task_number}</CardTitle>
                <CardDescription>
                  {verificationTypeLabels[task.verification_type] || task.verification_type} Verification
                </CardDescription>
              </div>
            </div>
            <Badge className={statusColors[task.status || 'pending']}>
              {statusLabels[task.status || 'pending']}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="font-medium">{task.lead?.applicant_name}</p>
            <p className="text-sm text-muted-foreground">{task.lead?.lead_number}</p>
          </div>

          {task.lead?.address && (
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <span>{task.lead.address}</span>
            </div>
          )}

          {deadline && (
            <div className={`flex items-center gap-2 text-sm ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
              {isOverdue ? <AlertTriangle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              <span>
                {isOverdue ? 'Overdue - ' : ''}
                {format(deadline, 'MMM dd, HH:mm')} ({formatDistanceToNow(deadline, { addSuffix: true })})
              </span>
            </div>
          )}

          {task.lead?.client && (
            <Badge variant="outline" className="text-xs">
              {task.lead.client.code}
            </Badge>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {task.status === 'assigned' && (
              <Button 
                size="sm" 
                onClick={() => handleStartTask(task)}
                disabled={updateStatus.isPending}
              >
                <Play className="h-4 w-4 mr-1" /> Start
              </Button>
            )}
            {task.status === 'in_progress' && (
              <Button 
                size="sm" 
                onClick={() => handleCompleteClick(task)}
                disabled={updateStatus.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-1" /> Complete
              </Button>
            )}
            {task.status === 'rejected' && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleStartTask(task)}
                disabled={updateStatus.isPending}
              >
                <Play className="h-4 w-4 mr-1" /> Rework
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardCheck className="h-6 w-6" />
          My Tasks
        </h1>
        <p className="text-muted-foreground">Tasks assigned to you</p>
      </div>

      {/* In Progress Section */}
      {inProgressTasks.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Play className="h-5 w-5 text-yellow-600" />
            In Progress ({inProgressTasks.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inProgressTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* Assigned Section */}
      {assignedTasks.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Assigned ({assignedTasks.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* Pending QC Section */}
      {pendingQCTasks.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-purple-600" />
            Pending QC Review ({pendingQCTasks.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingQCTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {tasks?.length === 0 && (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No Tasks Assigned</h3>
            <p className="text-muted-foreground">You don't have any tasks assigned to you yet.</p>
          </CardContent>
        </Card>
      )}

      {/* Completion Dialog */}
      <Dialog open={!!selectedTask && actionType === 'complete'} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Task</DialogTitle>
            <DialogDescription>
              Submit your verification findings for {selectedTask?.task_number}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Verification Result</label>
              <Select value={completionStatus} onValueChange={(v) => setCompletionStatus(v as TaskStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Positive / Verified
                    </div>
                  </SelectItem>
                  <SelectItem value="negative">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      Negative
                    </div>
                  </SelectItem>
                  <SelectItem value="unable_to_verify">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-orange-600" />
                      Unable to Verify
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Remarks</label>
              <Textarea
                placeholder="Enter your verification findings and remarks..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTask(null)}>
              Cancel
            </Button>
            <Button onClick={handleCompleteTask} disabled={updateStatus.isPending}>
              {updateStatus.isPending ? 'Submitting...' : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
