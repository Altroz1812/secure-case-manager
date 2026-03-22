import { useState } from 'react';
import { useMyTasks, useUpdateTaskStatus, TaskWithDetails } from '@/hooks/useTasks';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FieldVerificationForm } from '@/components/tasks/FieldVerificationForm';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ClipboardCheck, MapPin, Clock, AlertTriangle, Phone, Building, User,
  Play, CheckCircle, XCircle, HelpCircle, ThumbsUp, Undo2, FileText, Eye
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import type { Enums } from '@/integrations/supabase/types';

type TaskStatus = Enums<'task_status'>;

const statusColors: Record<TaskStatus, string> = {
  pending: 'bg-muted text-muted-foreground',
  assigned: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  qc_review: 'bg-purple-100 text-purple-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
};

const statusLabels: Record<TaskStatus, string> = {
  pending: 'Pending',
  assigned: 'New Case',
  in_progress: 'In Progress',
  completed: 'Submitted',
  qc_review: 'QC Review',
  approved: 'Approved',
  rejected: 'Rejected',
};

const verificationTypeLabels: Record<string, string> = {
  residence: 'RV', office: 'OV', business: 'BV', document_verification: 'DV',
  tele_verification: 'TV', reference_check: 'RC', asset_verification: 'AV',
  income_verification: 'IV', bank: 'Bank', residential: 'RV', bgv: 'BGV',
  property: 'PV', end_use: 'EU', itr: 'ITR', profile: 'Profile',
};

export default function MyTasksPage() {
  const { data: tasks, isLoading } = useMyTasks();
  const updateStatus = useUpdateTaskStatus();
  const queryClient = useQueryClient();
  
  const [sendBackTask, setSendBackTask] = useState<TaskWithDetails | null>(null);
  const [sendBackReason, setSendBackReason] = useState('');
  const [activeFormTask, setActiveFormTask] = useState<TaskWithDetails | null>(null);

  // FE response mutation
  const feResponseMutation = useMutation({
    mutationFn: async ({ taskId, response, reason }: { taskId: string; response: 'accepted' | 'sent_back'; reason?: string }) => {
      const updates: any = { fe_response: response };
      if (response === 'accepted') {
        updates.status = 'in_progress';
      }
      if (response === 'sent_back') {
        updates.send_back_reason = reason;
        updates.status = 'pending';
        updates.assigned_to = null;
      }
      const { error } = await supabase.from('tasks').update(updates).eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      toast.success(vars.response === 'accepted' ? 'Case accepted' : 'Case sent back');
      setSendBackTask(null);
      setSendBackReason('');
    },
    onError: (error: Error) => {
      toast.error('Action failed', { description: error.message });
    },
  });

  const handleAccept = (task: TaskWithDetails) => {
    feResponseMutation.mutate({ taskId: task.id, response: 'accepted' });
  };

  const handleSendBackClick = (task: TaskWithDetails) => {
    setSendBackTask(task);
    setSendBackReason('');
  };

  const handleSendBackConfirm = () => {
    if (!sendBackTask || !sendBackReason.trim()) return;
    feResponseMutation.mutate({ taskId: sendBackTask.id, response: 'sent_back', reason: sendBackReason });
  };

  // Group tasks
  const newCases = tasks?.filter(t => t.status === 'assigned' && !(t as any).fe_response) || [];
  const inProgressTasks = tasks?.filter(t => t.status === 'in_progress') || [];
  const submittedTasks = tasks?.filter(t => ['completed', 'qc_review'].includes(t.status || '')) || [];
  const reviewedTasks = tasks?.filter(t => ['approved', 'rejected'].includes(t.status || '')) || [];

  // If viewing a form for a task
  if (activeFormTask) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setActiveFormTask(null)}>
            ← Back to My Tasks
          </Button>
          <Badge className={statusColors[activeFormTask.status || 'pending']}>
            {statusLabels[activeFormTask.status || 'pending']}
          </Badge>
        </div>
        <FieldVerificationForm 
          task={activeFormTask} 
          readOnly={['completed', 'qc_review', 'approved'].includes(activeFormTask.status || '')} 
        />
      </div>
    );
  }

  const NewCaseCard = ({ task }: { task: TaskWithDetails }) => (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Badge variant="outline">{task.task_number}</Badge>
          <Badge className="bg-blue-100 text-blue-700">
            {verificationTypeLabels[task.verification_type] || task.verification_type}
          </Badge>
        </div>
        <p className="font-medium">{task.lead?.applicant_name}</p>
        {task.lead?.address && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{task.lead.address}</span>
          </div>
        )}
        {task.lead?.pincode && (
          <Badge variant="outline" className="text-xs">PIN: {task.lead.pincode}</Badge>
        )}
        <div className="flex gap-2 pt-2">
          <Button size="sm" className="flex-1" onClick={() => handleAccept(task)} disabled={feResponseMutation.isPending}>
            <ThumbsUp className="h-4 w-4 mr-1" /> Accept
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={() => handleSendBackClick(task)} disabled={feResponseMutation.isPending}>
            <Undo2 className="h-4 w-4 mr-1" /> Send Back
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const InProgressCard = ({ task }: { task: TaskWithDetails }) => {
    const deadline = task.sla_deadline ? new Date(task.sla_deadline) : null;
    const isOverdue = task.is_overdue || (deadline && deadline < new Date());
    return (
      <Card className={`border-l-4 border-l-yellow-500 ${isOverdue ? 'border-destructive' : ''}`}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Badge variant="outline">{task.task_number}</Badge>
            <Badge className="bg-yellow-100 text-yellow-700">In Progress</Badge>
          </div>
          <p className="font-medium">{task.lead?.applicant_name}</p>
          {deadline && (
            <div className={`flex items-center gap-2 text-xs ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
              {isOverdue ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
              <span>Due: {format(deadline, 'MMM dd, HH:mm')}</span>
            </div>
          )}
          <Button size="sm" className="w-full" onClick={() => setActiveFormTask(task)}>
            <FileText className="h-4 w-4 mr-1" /> Fill Verification Form
          </Button>
        </CardContent>
      </Card>
    );
  };

  const SubmittedCard = ({ task }: { task: TaskWithDetails }) => (
    <Card className="border-l-4 border-l-purple-500">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Badge variant="outline">{task.task_number}</Badge>
          <Badge className={statusColors[task.status || 'completed']}>
            {statusLabels[task.status || 'completed']}
          </Badge>
        </div>
        <p className="font-medium">{task.lead?.applicant_name}</p>
        <Button size="sm" variant="outline" className="w-full" onClick={() => setActiveFormTask(task)}>
          <Eye className="h-4 w-4 mr-1" /> View Form
        </Button>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardCheck className="h-6 w-6" /> My Tasks
        </h1>
        <p className="text-muted-foreground">Cases assigned to you</p>
      </div>

      {/* New Cases - Accept/Send Back */}
      {newCases.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" /> New Cases ({newCases.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {newCases.map(task => <NewCaseCard key={task.id} task={task} />)}
          </div>
        </div>
      )}

      {/* In Progress - Fill Form */}
      {inProgressTasks.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Play className="h-5 w-5 text-yellow-600" /> In Progress ({inProgressTasks.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inProgressTasks.map(task => <InProgressCard key={task.id} task={task} />)}
          </div>
        </div>
      )}

      {/* Submitted / QC */}
      {submittedTasks.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-purple-600" /> Pending Review ({submittedTasks.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {submittedTasks.map(task => <SubmittedCard key={task.id} task={task} />)}
          </div>
        </div>
      )}

      {/* Reviewed */}
      {reviewedTasks.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-600" /> Reviewed ({reviewedTasks.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviewedTasks.map(task => <SubmittedCard key={task.id} task={task} />)}
          </div>
        </div>
      )}

      {/* Empty State */}
      {tasks?.length === 0 && (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No Tasks Assigned</h3>
            <p className="text-muted-foreground">You don't have any cases assigned yet.</p>
          </CardContent>
        </Card>
      )}

      {/* Send Back Dialog */}
      <Dialog open={!!sendBackTask} onOpenChange={() => setSendBackTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Back Case</DialogTitle>
            <DialogDescription>
              Provide a reason for sending back {sendBackTask?.task_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={sendBackReason} onValueChange={setSendBackReason}>
              <SelectTrigger><SelectValue placeholder="Select reason..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Non-serviceable area">Non-serviceable area</SelectItem>
                <SelectItem value="Geo limit exceeded">Geo limit exceeded</SelectItem>
                <SelectItem value="Address not found">Address not found</SelectItem>
                <SelectItem value="Incorrect address">Incorrect address</SelectItem>
                <SelectItem value="Already visited - duplicate">Already visited - duplicate</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            {sendBackReason === 'Other' && (
              <Textarea
                placeholder="Enter specific reason..."
                value=""
                onChange={e => setSendBackReason(e.target.value)}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendBackTask(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleSendBackConfirm} disabled={!sendBackReason || feResponseMutation.isPending}>
              Confirm Send Back
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
