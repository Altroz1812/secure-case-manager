import { useState } from 'react';
import { useTasks, useQCReview, TaskWithDetails } from '@/hooks/useTasks';
import { useAuth } from '@/hooks/useAuth';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  ClipboardCheck, 
  Eye, 
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

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

export default function QCReviewPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: tasks, isLoading } = useTasks({ status: 'qc_review' });
  const qcReview = useQCReview();

  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [qcRemarks, setQcRemarks] = useState('');

  const handleReviewClick = (task: TaskWithDetails, action: 'approve' | 'reject') => {
    setSelectedTask(task);
    setReviewAction(action);
    setQcRemarks('');
  };

  const handleSubmitReview = () => {
    if (!selectedTask || !reviewAction || !user) return;

    qcReview.mutate(
      {
        taskId: selectedTask.id,
        status: reviewAction === 'approve' ? 'qc_approved' : 'qc_rejected',
        qcRemarks,
        reviewedBy: user.id,
      },
      {
        onSuccess: () => {
          setSelectedTask(null);
          setReviewAction(null);
        },
      }
    );
  };

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
      key: 'assigned_to',
      header: 'Verified By',
      render: (task: TaskWithDetails) => (
        task.assigned_user ? (
          <div>
            <p className="text-sm font-medium">{task.assigned_user.full_name}</p>
            {task.field_executive && (
              <p className="text-xs text-muted-foreground">{task.field_executive.employee_code}</p>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      ),
    },
    {
      key: 'completed_at',
      header: 'Completed',
      render: (task: TaskWithDetails) => (
        task.completed_at ? (
          <span className="text-sm">{format(new Date(task.completed_at), 'MMM dd, HH:mm')}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      ),
    },
    {
      key: 'client',
      header: 'Client',
      render: (task: TaskWithDetails) => (
        <Badge variant="secondary">{task.lead?.client?.code || 'N/A'}</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (task: TaskWithDetails) => (
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(`/tasks/${task.id}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-green-600 hover:text-green-700"
            onClick={() => handleReviewClick(task, 'approve')}
          >
            <CheckCircle className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-red-600 hover:text-red-700"
            onClick={() => handleReviewClick(task, 'reject')}
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Get counts for completed and negative tasks pending QC
  const completedCount = tasks?.filter(t => t.final_remarks?.toLowerCase().includes('positive')).length || 0;
  const negativeCount = tasks?.filter(t => t.final_remarks?.toLowerCase().includes('negative')).length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardCheck className="h-6 w-6" />
          QC Review
        </h1>
        <p className="text-muted-foreground">Review and approve completed verifications</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{tasks?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Positive Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{completedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              Negative Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{negativeCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Table */}
      <DataTable
        data={tasks || []}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search tasks..."
        searchKeys={['task_number']}
      />

      {/* Review Dialog */}
      <Dialog open={!!selectedTask && !!reviewAction} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {reviewAction === 'approve' ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Approve Task
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  Reject Task
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === 'approve' 
                ? 'Approve the verification report for ' 
                : 'Reject and send back for rework '}
              {selectedTask?.task_number}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedTask?.final_remarks && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm font-medium mb-1">Verifier's Remarks:</p>
                <p className="text-sm">{selectedTask.final_remarks}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">QC Remarks {reviewAction === 'reject' && <span className="text-destructive">*</span>}</label>
              <Textarea
                placeholder={
                  reviewAction === 'approve' 
                    ? 'Add any notes (optional)...'
                    : 'Explain what needs to be corrected...'
                }
                value={qcRemarks}
                onChange={(e) => setQcRemarks(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTask(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={qcReview.isPending || (reviewAction === 'reject' && !qcRemarks.trim())}
              variant={reviewAction === 'approve' ? 'default' : 'destructive'}
            >
              {qcReview.isPending ? 'Submitting...' : reviewAction === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
