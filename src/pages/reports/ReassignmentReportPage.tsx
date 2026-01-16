import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Download, RefreshCw, ArrowRightLeft, AlertTriangle, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDefaultDateRange, DateRange } from '@/hooks/useReports';
import { useBranches } from '@/hooks/useBranches';
import {
  useReassignmentStats,
  useReassignmentByReason,
  useReassignmentByBranch,
  useReassignmentTrend,
} from '@/hooks/useReassignmentAnalytics';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const chartConfig = {
  assignments: { label: 'Assignments', color: 'hsl(var(--chart-1))' },
  reassignments: { label: 'Reassignments', color: 'hsl(var(--chart-2))' },
  rate: { label: 'Rate %', color: 'hsl(var(--chart-3))' },
};

export default function ReassignmentReportPage() {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());

  const { data: stats, isLoading: statsLoading } = useReassignmentStats(dateRange);
  const { data: byReason, isLoading: reasonLoading } = useReassignmentByReason(dateRange);
  const { data: byBranch, isLoading: branchLoading } = useReassignmentByBranch(dateRange);
  const { data: trend, isLoading: trendLoading } = useReassignmentTrend(dateRange);

  const isLoading = statsLoading || reasonLoading || branchLoading || trendLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reassignment Analytics</h1>
          <p className="text-muted-foreground">
            Track task reassignment patterns and identify optimization opportunities
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
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_assignments || 0}</div>
            <p className="text-xs text-muted-foreground">in selected period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reassignments</CardTitle>
            <RefreshCw className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats?.total_reassignments || 0}</div>
            <p className="text-xs text-muted-foreground">
              tasks reassigned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reassignment Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.reassignment_percentage || 0}%</div>
            <p className="text-xs text-muted-foreground">
              of total assignments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Override Count</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.override_count || 0}</div>
            <p className="text-xs text-muted-foreground">
              manual overrides
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Trend Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Reassignment Trend</CardTitle>
            <CardDescription>Daily assignment and reassignment counts</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-[300px] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : trend?.length ? (
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                      className="text-xs"
                    />
                    <YAxis className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="assignments" 
                      stroke="hsl(var(--chart-1))" 
                      strokeWidth={2}
                      name="Assignments"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="reassignments" 
                      stroke="hsl(var(--chart-2))" 
                      strokeWidth={2}
                      name="Reassignments"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No data available for the selected period
              </div>
            )}
          </CardContent>
        </Card>

        {/* By Reason */}
        <Card>
          <CardHeader>
            <CardTitle>Top Reassignment Reasons</CardTitle>
            <CardDescription>Most common reasons for reassignment</CardDescription>
          </CardHeader>
          <CardContent>
            {byReason?.length ? (
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={byReason.slice(0, 5)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name.substring(0, 15)}... (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="reason"
                    >
                      {byReason.slice(0, 5).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No reassignment data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* By Branch */}
        <Card>
          <CardHeader>
            <CardTitle>Reassignment Rate by Branch</CardTitle>
            <CardDescription>Branch-wise reassignment percentages</CardDescription>
          </CardHeader>
          <CardContent>
            {byBranch?.length ? (
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byBranch} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" domain={[0, 100]} unit="%" className="text-xs" />
                    <YAxis dataKey="branch_name" type="category" width={100} className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar 
                      dataKey="reassignment_rate" 
                      fill="hsl(var(--chart-2))" 
                      radius={4}
                      name="Rate %"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No branch data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Branch Details</CardTitle>
          <CardDescription>Detailed reassignment statistics per branch</CardDescription>
        </CardHeader>
        <CardContent>
          {byBranch?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-3 px-4 text-left font-medium">Branch</th>
                    <th className="py-3 px-4 text-right font-medium">Total Tasks</th>
                    <th className="py-3 px-4 text-right font-medium">Reassignments</th>
                    <th className="py-3 px-4 text-right font-medium">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {byBranch.map((branch) => (
                    <tr key={branch.branch_id} className="border-b">
                      <td className="py-3 px-4">{branch.branch_name}</td>
                      <td className="py-3 px-4 text-right">{branch.total_tasks}</td>
                      <td className="py-3 px-4 text-right">{branch.reassignments}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={cn(
                          'font-medium',
                          branch.reassignment_rate > 30 ? 'text-red-600' :
                          branch.reassignment_rate > 15 ? 'text-amber-600' : 'text-green-600'
                        )}>
                          {branch.reassignment_rate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No branch data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
