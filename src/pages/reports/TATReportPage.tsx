import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Download, Clock, TrendingDown, TrendingUp, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTATReport, useTATTrend, getDefaultDateRange, DateRange } from '@/hooks/useReports';
import { useBranches } from '@/hooks/useBranches';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, Legend, Cell } from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const verificationTypeLabels: Record<string, string> = {
  residence: 'Residence',
  office: 'Office',
  business: 'Business',
  document: 'Document',
  reference: 'Reference',
  asset: 'Asset',
};

export default function TATReportPage() {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const [branchId, setBranchId] = useState<string>('');

  const { data: tatData, isLoading: tatLoading } = useTATReport(dateRange, branchId || undefined);
  const { data: tatTrend, isLoading: trendLoading } = useTATTrend(dateRange);
  const { data: branches } = useBranches();

  const isLoading = tatLoading || trendLoading;

  // Calculate overall stats
  const overallStats = tatData?.reduce(
    (acc, item) => ({
      totalCount: acc.totalCount + item.count,
      totalTat: acc.totalTat + (item.avg_tat_hours * item.count),
      minTat: Math.min(acc.minTat, item.min_tat_hours),
      maxTat: Math.max(acc.maxTat, item.max_tat_hours),
    }),
    { totalCount: 0, totalTat: 0, minTat: Infinity, maxTat: 0 }
  );

  const avgTat = overallStats?.totalCount ? Math.round(overallStats.totalTat / overallStats.totalCount) : 0;

  const chartConfig = {
    avg_tat: { label: 'Average TAT (hrs)', color: 'hsl(var(--chart-1))' },
    avg_tat_hours: { label: 'Average TAT (hrs)', color: 'hsl(var(--chart-2))' },
  };

  const getBarColor = (hours: number) => {
    if (hours <= 24) return 'hsl(var(--chart-2))'; // Green - Excellent
    if (hours <= 48) return 'hsl(var(--chart-3))'; // Yellow - Good
    return 'hsl(var(--chart-5))'; // Red - Needs improvement
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">TAT Report</h1>
          <p className="text-muted-foreground">
            Turnaround time analysis by verification type
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
            <CardTitle className="text-sm font-medium">Average TAT</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgTat}h</div>
            <p className="text-xs text-muted-foreground">
              across all types
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best TAT</CardTitle>
            <TrendingDown className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {overallStats?.minTat === Infinity ? 0 : overallStats?.minTat}h
            </div>
            <p className="text-xs text-muted-foreground">
              minimum turnaround
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Max TAT</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {overallStats?.maxTat || 0}h
            </div>
            <p className="text-xs text-muted-foreground">
              maximum turnaround
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
            <Timer className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallStats?.totalCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              in selected period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* TAT by Type */}
        <Card>
          <CardHeader>
            <CardTitle>TAT by Verification Type</CardTitle>
            <CardDescription>Average turnaround time in hours</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-[300px] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : tatData?.length ? (
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tatData.map(d => ({ ...d, name: verificationTypeLabels[d.verification_type] || d.verification_type }))}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="avg_tat_hours" radius={4}>
                      {tatData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getBarColor(entry.avg_tat_hours)} />
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

        {/* TAT Trend */}
        <Card>
          <CardHeader>
            <CardTitle>TAT Trend</CardTitle>
            <CardDescription>Daily average turnaround time</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-[300px] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : tatTrend?.length ? (
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={tatTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                      className="text-xs"
                    />
                    <YAxis className="text-xs" label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line 
                      type="monotone" 
                      dataKey="avg_tat" 
                      stroke="hsl(var(--chart-1))" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
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

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>TAT Details by Type</CardTitle>
          <CardDescription>Detailed breakdown of turnaround times</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Verification Type</TableHead>
                <TableHead className="text-right">Count</TableHead>
                <TableHead className="text-right">Min TAT</TableHead>
                <TableHead className="text-right">Avg TAT</TableHead>
                <TableHead className="text-right">Max TAT</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tatData?.length ? (
                tatData.map((item) => (
                  <TableRow key={item.verification_type}>
                    <TableCell className="font-medium">
                      {verificationTypeLabels[item.verification_type] || item.verification_type}
                    </TableCell>
                    <TableCell className="text-right">{item.count}</TableCell>
                    <TableCell className="text-right">{item.min_tat_hours}h</TableCell>
                    <TableCell className="text-right font-medium">{item.avg_tat_hours}h</TableCell>
                    <TableCell className="text-right">{item.max_tat_hours}h</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          item.avg_tat_hours <= 24 ? 'default' :
                          item.avg_tat_hours <= 48 ? 'secondary' : 'destructive'
                        }
                      >
                        {item.avg_tat_hours <= 24 ? 'Excellent' :
                         item.avg_tat_hours <= 48 ? 'Good' : 'Slow'}
                      </Badge>
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
