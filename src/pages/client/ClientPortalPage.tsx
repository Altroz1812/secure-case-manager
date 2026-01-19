import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useClientPortalTasks, useClientPortalStats, useClientPortalReports, ClientPortalTask } from '@/hooks/useClientPortal';
import { LeadDetailDialog } from '@/components/client/LeadDetailDialog';
import { format } from 'date-fns';
import { FileText, ClipboardList, CheckCircle, XCircle, Clock, AlertTriangle, Download, Building, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

function TaskStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    pending: { label: 'Pending', className: 'bg-gray-100 text-gray-700' },
    assigned: { label: 'Assigned', className: 'bg-blue-100 text-blue-700' },
    in_progress: { label: 'In Progress', className: 'bg-yellow-100 text-yellow-700' },
    completed: { label: 'Completed', className: 'bg-purple-100 text-purple-700' },
    qc_review: { label: 'QC Review', className: 'bg-orange-100 text-orange-700' },
    approved: { label: 'Approved', className: 'bg-green-100 text-green-700' },
    rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700' },
  };

  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-700' };

  return (
    <Badge variant="secondary" className={cn('font-medium', config.className)}>
      {config.label}
    </Badge>
  );
}

export default function ClientPortalPage() {
  const navigate = useNavigate();
  const [selectedTask, setSelectedTask] = useState<ClientPortalTask | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const { data: tasks, isLoading: tasksLoading } = useClientPortalTasks();
  const { stats, isLoading: statsLoading } = useClientPortalStats();
  const { data: reports, isLoading: reportsLoading } = useClientPortalReports();

  const isLoading = tasksLoading || statsLoading || reportsLoading;

  // Get unique client names from tasks
  const clientNames = tasks ? [...new Set(tasks.map(t => t.lead.client.name))] : [];

  const handleViewLead = (task: ClientPortalTask) => {
    setSelectedTask(task);
    setDialogOpen(true);
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Client Portal</h1>
          <p className="text-muted-foreground">
            View your verification tasks and reports
          </p>
          {clientNames.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Organization: <span className="font-medium text-foreground">{clientNames.join(', ')}</span>
              </span>
            </div>
          )}
        </div>
        <Button onClick={() => navigate('/client-portal/new-lead')}>
          <FileText className="h-4 w-4 mr-2" />
          Submit New Request
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              All verification tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approvedTasks}</div>
            <p className="text-xs text-muted-foreground">
              Successfully verified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingTasks}</div>
            <p className="text-xs text-muted-foreground">
              Pending verification
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overduePercentage}%</div>
            <p className="text-xs text-muted-foreground">
              SLA breached tasks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Tasks and Reports */}
      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Verification Tasks</CardTitle>
              <CardDescription>
                All verification tasks for your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : tasks && tasks.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task Number</TableHead>
                      <TableHead>Applicant</TableHead>
                      <TableHead>Application #</TableHead>
                      <TableHead>Verification Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>SLA Deadline</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">{task.task_number}</TableCell>
                        <TableCell>{task.lead.applicant_name}</TableCell>
                        <TableCell>{task.lead.application_number || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {task.verification_type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <TaskStatusBadge status={task.status} />
                        </TableCell>
                        <TableCell>{format(new Date(task.created_at), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                            {task.sla_deadline ? (
                            <span className={task.is_overdue ? 'text-red-500 font-medium' : ''}>
                              {format(new Date(task.sla_deadline), 'MMM dd, yyyy HH:mm')}
                              {task.is_overdue && ' (Overdue)'}
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewLead(task)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No tasks found for your organization
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generated Reports</CardTitle>
              <CardDescription>
                All verification reports generated for your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reportsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : reports && reports.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report Type</TableHead>
                      <TableHead>Lead/Task</TableHead>
                      <TableHead>Applicant</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Generated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium capitalize">
                          {report.report_type.replace('_', ' ')}
                        </TableCell>
                        <TableCell>
                          {report.task?.task_number || report.lead?.lead_number || '-'}
                        </TableCell>
                        <TableCell>{report.lead?.applicant_name || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">v{report.version}</Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(report.generated_at), 'MMM dd, yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          {report.storage_path && (
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No reports found for your organization
              </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <LeadDetailDialog
        task={selectedTask}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
