import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Download, Users, Award, Target, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFEProductivity, getDefaultDateRange, DateRange } from '@/hooks/useReports';
import { useBranches } from '@/hooks/useBranches';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';

export default function ProductivityReportPage() {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const [branchId, setBranchId] = useState<string>('');

  const { data: productivity, isLoading } = useFEProductivity(dateRange, branchId || undefined);
  const { data: branches } = useBranches();

  // Calculate summary stats
  const summaryStats = productivity?.reduce(
    (acc, fe) => ({
      totalFEs: acc.totalFEs + 1,
      totalTasks: acc.totalTasks + fe.total_tasks,
      totalCompleted: acc.totalCompleted + fe.completed_tasks,
      totalApproved: acc.totalApproved + fe.approved_tasks,
    }),
    { totalFEs: 0, totalTasks: 0, totalCompleted: 0, totalApproved: 0 }
  );

  const avgProductivity = summaryStats?.totalFEs 
    ? Math.round(productivity!.reduce((sum, fe) => sum + fe.productivity_score, 0) / summaryStats.totalFEs)
    : 0;

  const chartConfig = {
    productivity_score: { label: 'Productivity Score', color: 'hsl(var(--chart-1))' },
    completed_tasks: { label: 'Completed Tasks', color: 'hsl(var(--chart-2))' },
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'hsl(var(--chart-2))'; // Green - Excellent
    if (score >= 60) return 'hsl(var(--chart-3))'; // Yellow - Good
    return 'hsl(var(--chart-5))'; // Red - Needs improvement
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">FE Productivity Report</h1>
          <p className="text-muted-foreground">
            Field executive performance and productivity metrics
          </p>
        </div>
        <Button variant="outline" className="w-fit">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn('w-[240px] justify-start text-left font-normal')}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      setDateRange({ from: range.from, to: range.to });
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Branches</SelectItem>
                {branches?.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active FEs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats?.totalFEs || 0}</div>
            <p className="text-xs text-muted-foreground">
              with assigned tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats?.totalTasks || 0}</div>
            <p className="text-xs text-muted-foreground">
              assigned in period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
            <Award className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summaryStats?.totalCompleted 
                ? Math.round((summaryStats.totalApproved / summaryStats.totalCompleted) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              of completed tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Productivity</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgProductivity}%</div>
            <p className="text-xs text-muted-foreground">
              average score
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Productivity Scores Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Productivity Scores</CardTitle>
            <CardDescription>Field executive productivity comparison</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-[300px] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : productivity?.length ? (
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productivity.slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" domain={[0, 100]} className="text-xs" />
                    <YAxis 
                      dataKey="fe_name" 
                      type="category" 
                      width={120} 
                      className="text-xs"
                      tick={{ fontSize: 11 }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="productivity_score" radius={4}>
                      {productivity.slice(0, 10).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getScoreColor(entry.productivity_score)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No data available for the selected period
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
          <CardDescription>Leading field executives by productivity</CardDescription>
        </CardHeader>
        <CardContent>
          {productivity?.length ? (
            <div className="grid gap-4 md:grid-cols-3">
              {productivity.slice(0, 3).map((fe, index) => (
                <Card key={fe.fe_id} className={cn(
                  "relative overflow-hidden",
                  index === 0 && "border-yellow-500/50 bg-yellow-500/5"
                )}>
                  {index === 0 && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-yellow-500 text-yellow-950">🏆 Top</Badge>
                    </div>
                  )}
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(fe.fe_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium">{fe.fe_name}</div>
                        <div className="text-sm text-muted-foreground">{fe.employee_code}</div>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Productivity</span>
                        <span className="font-medium">{fe.productivity_score}%</span>
                      </div>
                      <Progress value={fe.productivity_score} className="h-2" />
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Tasks</div>
                        <div className="font-medium">{fe.total_tasks}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Approved</div>
                        <div className="font-medium text-green-600">{fe.approved_tasks}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No performers data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Field Executives</CardTitle>
          <CardDescription>Complete productivity breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Field Executive</TableHead>
                <TableHead>Employee Code</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Completed</TableHead>
                <TableHead className="text-right">Approved</TableHead>
                <TableHead className="text-right">Rejected</TableHead>
                <TableHead className="text-right">Avg TAT</TableHead>
                <TableHead className="text-right">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productivity?.length ? (
                productivity.map((fe) => (
                  <TableRow key={fe.fe_id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(fe.fe_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{fe.fe_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{fe.employee_code}</TableCell>
                    <TableCell className="text-right">{fe.total_tasks}</TableCell>
                    <TableCell className="text-right">{fe.completed_tasks}</TableCell>
                    <TableCell className="text-right text-green-600">{fe.approved_tasks}</TableCell>
                    <TableCell className="text-right text-red-600">{fe.rejected_tasks}</TableCell>
                    <TableCell className="text-right">{fe.avg_tat_hours}h</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          fe.productivity_score >= 80 ? 'default' :
                          fe.productivity_score >= 60 ? 'secondary' : 'destructive'
                        }
                      >
                        {fe.productivity_score}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No data available for the selected period
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
