import { useParams, useNavigate } from 'react-router-dom';
import { useTask, useUpdateTaskStatus, TaskWithDetails } from '@/hooks/useTasks';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  User,
  Building,
  FileText,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserPlus
} from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
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

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: task, isLoading } = useTask(id);
  const [showAssignment, setShowAssignment] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Task not found</h2>
        <Button variant="link" onClick={() => navigate('/tasks')}>
          Back to Tasks
        </Button>
      </div>
    );
  }

  const deadline = task.sla_deadline ? new Date(task.sla_deadline) : null;
  const isOverdue = task.is_overdue || (deadline && deadline < new Date());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{task.task_number}</h1>
            <p className="text-muted-foreground">
              {verificationTypeLabels[task.verification_type] || task.verification_type}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={statusColors[task.status || 'pending']}>
            {statusLabels[task.status || 'pending']}
          </Badge>
          {(task.status === 'pending' || !task.assigned_to) && (
            <Button onClick={() => setShowAssignment(true)}>
              <UserPlus className="h-4 w-4 mr-2" /> Assign
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Applicant Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Applicant Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{task.lead?.applicant_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lead Number</p>
                  <p className="font-mono">{task.lead?.lead_number || 'N/A'}</p>
                </div>
              </div>
              
              {task.lead?.address && (
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                    <p>{task.lead.address}</p>
                  </div>
                </div>
              )}

              {task.lead?.pincode && (
                <div>
                  <p className="text-sm text-muted-foreground">Pincode</p>
                  <p className="font-mono">{task.lead.pincode}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Client & Product */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Client & Product
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">
                    {task.lead?.client?.name || 'N/A'}
                    {task.lead?.client?.code && (
                      <Badge variant="outline" className="ml-2">{task.lead.client.code}</Badge>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Product</p>
                  <p className="font-medium">
                    {task.lead?.product?.name || 'N/A'}
                    {task.lead?.product?.code && (
                      <Badge variant="outline" className="ml-2">{task.lead.product.code}</Badge>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Final Remarks (if completed) */}
          {task.final_remarks && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Verification Remarks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{task.final_remarks}</p>
              </CardContent>
            </Card>
          )}

          {/* QC Remarks (if reviewed) */}
          {task.qc_remarks && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {task.status === 'approved' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  QC Review
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{task.qc_remarks}</p>
                {task.qc_reviewed_at && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Reviewed on {format(new Date(task.qc_reviewed_at), 'MMM dd, yyyy HH:mm')}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Assigned To</p>
                {task.assigned_user ? (
                  <div>
                    <p className="font-medium">{task.assigned_user.full_name}</p>
                    {task.field_executive && (
                      <p className="text-sm text-muted-foreground">{task.field_executive.employee_code}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">Unassigned</p>
                )}
              </div>
              {task.assigned_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Assigned At</p>
                  <p>{format(new Date(task.assigned_at), 'MMM dd, yyyy HH:mm')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SLA */}
          <Card className={isOverdue ? 'border-destructive' : ''}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {isOverdue ? (
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                ) : (
                  <Clock className="h-4 w-4" />
                )}
                SLA Deadline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {deadline ? (
                <div className={isOverdue ? 'text-destructive' : ''}>
                  <p className="font-medium">{format(deadline, 'MMM dd, yyyy')}</p>
                  <p className="text-sm">{format(deadline, 'HH:mm')}</p>
                  {isOverdue && <p className="text-sm font-medium mt-1">OVERDUE</p>}
                </div>
              ) : (
                <p className="text-muted-foreground">No deadline set</p>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p>{format(new Date(task.created_at), 'MMM dd, yyyy HH:mm')}</p>
              </div>
              {task.assigned_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Assigned</p>
                  <p>{format(new Date(task.assigned_at), 'MMM dd, yyyy HH:mm')}</p>
                </div>
              )}
              {task.completed_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p>{format(new Date(task.completed_at), 'MMM dd, yyyy HH:mm')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Branch */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Branch</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{task.branch?.name || 'N/A'}</p>
              {task.branch?.code && (
                <Badge variant="outline" className="mt-1">{task.branch.code}</Badge>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Assignment Dialog */}
      <TaskAssignmentDialog
        task={showAssignment ? task : null}
        onClose={() => setShowAssignment(false)}
      />
    </div>
  );
}
