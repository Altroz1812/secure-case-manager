import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
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

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: { value: number; positive: boolean };
}

function StatCard({ title, value, description, icon: Icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-muted-foreground">{description}</p>
          {trend && (
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

export default function Dashboard() {
  const { profile, roles, hasAnyRole } = useAuth();

  const showFullDashboard = hasAnyRole(['admin', 'ops_manager']);
  const showIntakeDashboard = hasAnyRole(['intake']);
  const showFEDashboard = hasAnyRole(['field_executive']);
  const showAnalystDashboard = hasAnyRole(['analyst']);
  const showQCDashboard = hasAnyRole(['qc']);

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

      {/* Stats Grid */}
      {(showFullDashboard || showIntakeDashboard) && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Today's Leads"
            value="24"
            description="New leads created"
            icon={FileText}
            trend={{ value: 12, positive: true }}
          />
          <StatCard
            title="Pending Tasks"
            value="156"
            description="Awaiting action"
            icon={ClipboardList}
          />
          <StatCard
            title="SLA Breaches"
            value="3"
            description="Require immediate attention"
            icon={AlertTriangle}
          />
          <StatCard
            title="Completed Today"
            value="42"
            description="Tasks closed"
            icon={CheckCircle2}
            trend={{ value: 8, positive: true }}
          />
        </div>
      )}

      {/* FE Dashboard */}
      {showFEDashboard && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Assigned to Me"
            value="8"
            description="Field visits pending"
            icon={ClipboardList}
          />
          <StatCard
            title="Completed Today"
            value="4"
            description="Verifications done"
            icon={CheckCircle2}
          />
          <StatCard
            title="SLA Warning"
            value="2"
            description="Due within 4 hours"
            icon={Clock}
          />
          <StatCard
            title="This Week"
            value="23"
            description="Total completions"
            icon={TrendingUp}
            trend={{ value: 15, positive: true }}
          />
        </div>
      )}

      {/* Analyst Dashboard */}
      {showAnalystDashboard && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Pending Review"
            value="12"
            description="Documents to verify"
            icon={FileText}
          />
          <StatCard
            title="In Progress"
            value="3"
            description="Currently working on"
            icon={ClipboardList}
          />
          <StatCard
            title="Completed Today"
            value="7"
            description="Sent for QC"
            icon={CheckCircle2}
          />
          <StatCard
            title="SLA Alerts"
            value="1"
            description="Approaching deadline"
            icon={AlertTriangle}
          />
        </div>
      )}

      {/* QC Dashboard */}
      {showQCDashboard && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Pending QC"
            value="18"
            description="Awaiting review"
            icon={ClipboardList}
          />
          <StatCard
            title="Approved Today"
            value="12"
            description="Verifications cleared"
            icon={CheckCircle2}
            trend={{ value: 20, positive: true }}
          />
          <StatCard
            title="Rejected Today"
            value="2"
            description="Sent back for rework"
            icon={AlertTriangle}
          />
          <StatCard
            title="Avg Review Time"
            value="15m"
            description="Per verification"
            icon={Clock}
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
              {[
                { id: 'TASK-000123', type: 'Residential', status: 'In Progress', client: 'HDFC Bank', time: '2h ago' },
                { id: 'TASK-000122', type: 'Business', status: 'Pending', client: 'ICICI Bank', time: '3h ago' },
                { id: 'TASK-000121', type: 'ITR', status: 'QC Review', client: 'Axis Bank', time: '4h ago' },
                { id: 'TASK-000120', type: 'Property', status: 'Approved', client: 'HDFC Bank', time: '5h ago' },
              ].map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3">
                    <ClipboardList className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{task.id}</p>
                      <p className="text-xs text-muted-foreground">{task.client} • {task.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      task.status === 'Approved' ? 'default' :
                      task.status === 'In Progress' ? 'secondary' :
                      task.status === 'QC Review' ? 'outline' : 'secondary'
                    }>
                      {task.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{task.time}</span>
                  </div>
                </div>
              ))}
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
                {[
                  { name: 'Field Executives', online: 12, total: 15, tasks: 45 },
                  { name: 'Analysts', online: 8, total: 10, tasks: 28 },
                  { name: 'QC Team', online: 4, total: 5, tasks: 18 },
                  { name: 'Intake Team', online: 3, total: 4, tasks: 12 },
                ].map(team => (
                  <div key={team.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{team.name}</p>
                        <p className="text-xs text-muted-foreground">
                          <span className="text-success">{team.online}</span> / {team.total} online
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">{team.tasks}</p>
                      <p className="text-xs text-muted-foreground">Active tasks</p>
                    </div>
                  </div>
                ))}
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
                {[
                  { type: 'Residential', healthy: 12, warning: 3, breached: 0 },
                  { type: 'Business', healthy: 8, warning: 2, breached: 1 },
                  { type: 'Property', healthy: 5, warning: 1, breached: 0 },
                  { type: 'End Use', healthy: 4, warning: 0, breached: 0 },
                ].map(sla => (
                  <div key={sla.type} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="font-medium text-sm">{sla.type}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-success">{sla.healthy}</Badge>
                      <Badge variant="secondary" className="bg-warning text-warning-foreground">{sla.warning}</Badge>
                      <Badge variant="destructive">{sla.breached}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}