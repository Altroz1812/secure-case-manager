import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Download, CheckCircle, XCircle, AlertTriangle, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSLAReport, useSLASummary, getDefaultDateRange, DateRange } from '@/hooks/useReports';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const COLORS = {
  onTime: 'hsl(var(--chart-2))',
  breached: 'hsl(var(--chart-5))',
  atRisk: 'hsl(var(--chart-3))',
};

export default function SLAReportPage() {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());

  const { data: slaData, isLoading: slaLoading } = useSLAReport(dateRange);
  const { data: summary, isLoading: summaryLoading } = useSLASummary(dateRange);

  const isLoading = slaLoading || summaryLoading;

  const chartConfig = {
    on_time: { label: 'On Time', color: COLORS.onTime },
    breached: { label: 'Breached', color: COLORS.breached },
    sla_percentage: { label: 'SLA %', color: 'hsl(var(--chart-1))' },
  };

  const pieData = summary ? [
    { name: 'On Time', value: summary.onTime, fill: COLORS.onTime },
    { name: 'Breached', value: summary.breached, fill: COLORS.breached },
    { name: 'At Risk', value: summary.atRisk, fill: COLORS.atRisk },
  ].filter(d => d.value > 0) : [];

  const getSLABadge = (percentage: number) => {
    if (percentage >= 90) return <Badge className="bg-green-500">Excellent</Badge>;
    if (percentage >= 75) return <Badge className="bg-yellow-500 text-yellow-950">Good</Badge>;
    if (percentage >= 50) return <Badge variant="secondary">Fair</Badge>;
    return <Badge variant="destructive">Critical</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SLA Monitoring</h1>
          <p className="text-muted-foreground">
            Service level agreement compliance and breach analysis
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

      {/* SLA Gauge */}
      <Card className="bg-gradient-to-br from-card to-muted/20">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <div className="relative">
              <Gauge className="h-20 w-20 text-muted-foreground/30" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={cn(
                  "text-4xl font-bold",
                  (summary?.slaPercentage || 0) >= 90 ? "text-green-600" :
                  (summary?.slaPercentage || 0) >= 75 ? "text-yellow-600" : "text-red-600"
                )}>
                  {summary?.slaPercentage || 0}%
                </span>
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold">Overall SLA Compliance</h2>
              <p className="text-muted-foreground">
                {summary?.onTime || 0} of {summary?.total || 0} tasks completed on time
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              in selected period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Time</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary?.onTime || 0}</div>
            <p className="text-xs text-muted-foreground">
              completed within SLA
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Breached</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary?.breached || 0}</div>
            <p className="text-xs text-muted-foreground">
              SLA breaches
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{summary?.atRisk || 0}</div>
            <p className="text-xs text-muted-foreground">
              nearing deadline
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* SLA Distribution Pie */}
        <Card>
          <CardHeader>
            <CardTitle>SLA Distribution</CardTitle>
            <CardDescription>Task status breakdown by SLA compliance</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-[300px] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : pieData.length ? (
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Legend />
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* SLA by Branch */}
        <Card>
          <CardHeader>
            <CardTitle>SLA by Branch</CardTitle>
            <CardDescription>Compliance percentage per branch</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-[300px] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : slaData?.length ? (
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={slaData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" domain={[0, 100]} className="text-xs" />
                    <YAxis 
                      dataKey="branch_name" 
                      type="category" 
                      width={100} 
                      className="text-xs"
                      tick={{ fontSize: 11 }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar 
                      dataKey="sla_percentage" 
                      fill="hsl(var(--chart-2))" 
                      radius={4}
                    >
                      {slaData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            entry.sla_percentage >= 90 ? COLORS.onTime :
                            entry.sla_percentage >= 75 ? COLORS.atRisk : COLORS.breached
                          } 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Branch Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Branch SLA Details</CardTitle>
          <CardDescription>Detailed SLA compliance by branch</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Branch</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">On Time</TableHead>
                <TableHead className="text-right">Breached</TableHead>
                <TableHead>Compliance</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slaData?.length ? (
                slaData.map((branch) => (
                  <TableRow key={branch.branch_id}>
                    <TableCell className="font-medium">{branch.branch_name}</TableCell>
                    <TableCell className="text-right">{branch.total_tasks}</TableCell>
                    <TableCell className="text-right text-green-600">{branch.on_time}</TableCell>
                    <TableCell className="text-right text-red-600">{branch.breached}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={branch.sla_percentage} 
                          className="h-2 w-24"
                        />
                        <span className="text-sm font-medium">{branch.sla_percentage}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {getSLABadge(branch.sla_percentage)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
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
