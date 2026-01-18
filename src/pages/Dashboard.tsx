import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { 
  useDashboardStats,
  useFEStats,
  useAnalystStats,
  useQCStats,
  useRecentTasks,
  useTeamActivity,
  useSLAOverview,
} from '@/hooks/useDashboardStats';
import { 
  FileText, 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Users,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: { value: number; positive: boolean };
  isLoading?: boolean;
}

function StatCard({ title, value, description, icon: Icon, trend, isLoading }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-muted-foreground">{description}</p>
          {trend && trend.value !== 0 && (
            <Badge 
              variant={trend.positive ? 'default' : 'destructive'} 
              className="text-xs px-1 py-0"
            >
              {trend.positive ? '+' : ''}{trend.value}%
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function getStatusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'approved': return 'default';
    case 'in_progress': return 'secondary';
    case 'qc_review': return 'outline';
    case 'rejected': return 'destructive';
    default: return 'secondary';
  }
}

function formatStatus(status: string): string {
  return status.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

export default function Dashboard() {
  const { profile, roles, hasAnyRole, hasRole } = useAuth();

  const showFullDashboard = hasAnyRole(['admin', 'ops_manager']);
  const showIntakeDashboard = hasAnyRole(['intake']);
  const showFEDashboard = hasRole('field_executive');
  const showAnalystDashboard = hasRole('analyst');
  const showQCDashboard = hasRole('qc');

  // Fetch real data
  const { data: dashboardStats, isLoading: statsLoading } = useDashboardStats();
  const { data: feStats, isLoading: feLoading } = useFEStats();
  const { data: analystStats, isLoading: analystLoading } = useAnalystStats();
  const { data: qcStats, isLoading: qcLoading } = useQCStats();
  const { data: recentTasks, isLoading: tasksLoading } = useRecentTasks(4);
  const { data: teamActivity, isLoading: teamLoading } = useTeamActivity();
  const { data: slaOverview, isLoading: slaLoading } = useSLAOverview();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <Card className="bg-gradient-to-r from-primary/10 to-accent border-primary/20">
        <CardContent className="flex items-center gap-4 py-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
            {profile?.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-semibold">Welcome back, {profile?.full_name || 'User'}!</h2>
            <p className="text-muted-foreground capitalize">
              Role: {roles[0]?.replace('_', ' ') || 'Pending Assignment'}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid for Admin/Ops Manager/Intake */}
      {(showFullDashboard || showIntakeDashboard) && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Today's Leads"
            value={dashboardStats?.todaysLeads ?? 0}
            description="New leads created"
            icon={FileText}
            trend={dashboardStats?.leadsChange !== undefined ? { value: dashboardStats.leadsChange, positive: dashboardStats.leadsChange >= 0 } : undefined}
            isLoading={statsLoading}
          />
          <StatCard
            title="Pending Tasks"
            value={dashboardStats?.pendingTasks ?? 0}
            description="Awaiting action"
            icon={ClipboardList}
            isLoading={statsLoading}
          />
          <StatCard
            title="SLA Breaches"
            value={dashboardStats?.slaBreaches ?? 0}
            description="Require immediate attention"
            icon={AlertTriangle}
            isLoading={statsLoading}
          />
          <StatCard
            title="Completed Today"
            value={dashboardStats?.completedToday ?? 0}
            description="Tasks closed"
            icon={CheckCircle2}
            trend={dashboardStats?.completedChange !== undefined ? { value: dashboardStats.completedChange, positive: dashboardStats.completedChange >= 0 } : undefined}
            isLoading={statsLoading}
          />
        </div>
      )}

      {/* FE Dashboard */}
      {showFEDashboard && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Assigned to Me"
            value={feStats?.assignedToMe ?? 0}
            description="Field visits pending"
            icon={ClipboardList}
            isLoading={feLoading}
          />
          <StatCard
            title="Completed Today"
            value={feStats?.completedToday ?? 0}
            description="Verifications done"
            icon={CheckCircle2}
            isLoading={feLoading}
          />
          <StatCard
            title="SLA Warning"
            value={feStats?.slaWarning ?? 0}
            description="Due within 4 hours"
            icon={Clock}
            isLoading={feLoading}
          />
          <StatCard
            title="This Week"
            value={feStats?.weeklyCompletions ?? 0}
            description="Total completions"
            icon={TrendingUp}
            trend={feStats?.weeklyChange !== undefined ? { value: feStats.weeklyChange, positive: feStats.weeklyChange >= 0 } : undefined}
            isLoading={feLoading}
          />
        </div>
      )}

      {/* Analyst Dashboard */}
      {showAnalystDashboard && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Pending Review"
            value={analystStats?.pendingReview ?? 0}
            description="Documents to verify"
            icon={FileText}
            isLoading={analystLoading}
          />
          <StatCard
            title="In Progress"
            value={analystStats?.inProgress ?? 0}
            description="Currently working on"
            icon={ClipboardList}
            isLoading={analystLoading}
          />
          <StatCard
            title="Completed Today"
            value={analystStats?.completedToday ?? 0}
            description="Sent for QC"
            icon={CheckCircle2}
            isLoading={analystLoading}
          />
          <StatCard
            title="SLA Alerts"
            value={analystStats?.slaAlerts ?? 0}
            description="Approaching deadline"
            icon={AlertTriangle}
            isLoading={analystLoading}
          />
        </div>
      )}

      {/* QC Dashboard */}
      {showQCDashboard && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Pending QC"
            value={qcStats?.pendingQC ?? 0}
            description="Awaiting review"
            icon={ClipboardList}
            isLoading={qcLoading}
          />
          <StatCard
            title="Approved Today"
            value={qcStats?.approvedToday ?? 0}
            description="Verifications cleared"
            icon={CheckCircle2}
            trend={qcStats?.approvalChange !== undefined ? { value: qcStats.approvalChange, positive: qcStats.approvalChange >= 0 } : undefined}
            isLoading={qcLoading}
          />
          <StatCard
            title="Rejected Today"
            value={qcStats?.rejectedToday ?? 0}
            description="Sent back for rework"
            icon={AlertTriangle}
            isLoading={qcLoading}
          />
          <StatCard
            title="Avg Review Time"
            value="--"
            description="Per verification"
            icon={Clock}
            isLoading={qcLoading}
          />
        </div>
      )}

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Tasks</CardTitle>
            <CardDescription>Latest task updates in your queue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasksLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-4 w-4" />
                      <div>
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                    <Skeleton className="h-5 w-20" />
                  </div>
                ))
              ) : recentTasks && recentTasks.length > 0 ? (
                recentTasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex items-center gap-3">
                      <ClipboardList className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{task.task_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {task.client_name} • {task.verification_type.charAt(0).toUpperCase() + task.verification_type.slice(1)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusVariant(task.status)}>
                        {formatStatus(task.status)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">No recent tasks</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Team Activity (Admin/Ops Manager only) */}
        {showFullDashboard && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Team Activity</CardTitle>
              <CardDescription>Current team status overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-4 w-4" />
                        <div>
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                      <Skeleton className="h-4 w-12" />
                    </div>
                  ))
                ) : teamActivity && teamActivity.length > 0 ? (
                  teamActivity.map(team => (
                    <div key={team.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{team.name}</p>
                          <p className="text-xs text-muted-foreground">
                            <span className="text-green-600">{team.activeUsers}</span> / {team.totalUsers} active
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">{team.activeTasks}</p>
                        <p className="text-xs text-muted-foreground">Active tasks</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">No team data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* SLA Overview (if not showing team activity) */}
        {!showFullDashboard && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">SLA Overview</CardTitle>
              <CardDescription>Your verification timelines</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {slaLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <Skeleton className="h-4 w-20" />
                      <div className="flex gap-2">
                        <Skeleton className="h-5 w-8" />
                        <Skeleton className="h-5 w-8" />
                        <Skeleton className="h-5 w-8" />
                      </div>
                    </div>
                  ))
                ) : slaOverview && slaOverview.length > 0 ? (
                  slaOverview.map(sla => (
                    <div key={sla.type} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span className="font-medium text-sm">{sla.type}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="bg-green-600">{sla.healthy}</Badge>
                        <Badge variant="secondary" className="bg-yellow-500 text-yellow-950">{sla.warning}</Badge>
                        <Badge variant="destructive">{sla.breached}</Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">No SLA data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
