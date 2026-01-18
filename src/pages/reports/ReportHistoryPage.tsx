import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { CalendarIcon, Download, FileText, Eye, History, Loader2, FileDown, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAllReports, ReportWithDetails } from '@/hooks/useGeneratedReports';
import { getDefaultDateRange, DateRange } from '@/hooks/useReports';
import { usePdfGeneration } from '@/hooks/usePdfGeneration';

export default function ReportHistoryPage() {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const [reportType, setReportType] = useState<string>('');
  const [previewReport, setPreviewReport] = useState<ReportWithDetails | null>(null);

  const { generatePdf, downloadAsHtml, isGenerating } = usePdfGeneration();

  const { data: reports, isLoading } = useAllReports({
    reportType: reportType || undefined,
    dateFrom: dateRange.from,
    dateTo: dateRange.to,
  });

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'task_verification':
        return 'Task Verification';
      case 'lead_consolidated':
        return 'Lead Consolidated';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Report History</h1>
          <p className="text-muted-foreground">
            View and download previously generated reports with version tracking
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Reports</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports?.filter(r => r.report_type === 'task_verification').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lead Reports</CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports?.filter(r => r.report_type === 'lead_consolidated').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Version</CardTitle>
            <History className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              v{Math.max(...(reports?.map(r => r.version) || [0]))}
            </div>
          </CardContent>
        </Card>
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

            <Select 
              value={reportType || "all"} 
              onValueChange={(value) => setReportType(value === "all" ? "" : value)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Report Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="task_verification">Task Verification</SelectItem>
                <SelectItem value="lead_consolidated">Lead Consolidated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Reports</CardTitle>
          <CardDescription>
            {reports?.length || 0} reports found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : reports?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-3 px-4 text-left font-medium">Report</th>
                    <th className="py-3 px-4 text-left font-medium">Type</th>
                    <th className="py-3 px-4 text-left font-medium">Reference</th>
                    <th className="py-3 px-4 text-left font-medium">Version</th>
                    <th className="py-3 px-4 text-left font-medium">Generated By</th>
                    <th className="py-3 px-4 text-left font-medium">Date</th>
                    <th className="py-3 px-4 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-xs">
                            {report.id.substring(0, 8)}...
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">
                          {getReportTypeLabel(report.report_type)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {report.task?.task_number || report.lead?.lead_number || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge>v{report.version}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        {report.generated_by_user?.full_name || 'Unknown'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {format(new Date(report.generated_at), 'MMM dd, yyyy HH:mm')}
                      </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setPreviewReport(report)}
                              title="Preview report data"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  disabled={isGenerating}
                                  title="Download options"
                                >
                                  {isGenerating ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Download className="h-4 w-4" />
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => generatePdf(report.id)}>
                                  <Printer className="h-4 w-4 mr-2" />
                                  Print / Save as PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => downloadAsHtml(report.id)}>
                                  <FileDown className="h-4 w-4 mr-2" />
                                  Download HTML
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No reports found</h3>
              <p className="text-muted-foreground text-sm">
                Generate reports from task or lead details pages
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewReport} onOpenChange={(open) => !open && setPreviewReport(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Report Preview
            </DialogTitle>
            <DialogDescription>
              {previewReport?.report_type === 'task_verification' ? 'Task Verification' : 'Lead Consolidated'} Report 
              - Version {previewReport?.version}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 pr-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Report ID:</span>
                  <p className="font-mono">{previewReport?.id}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Reference:</span>
                  <p className="font-medium">{previewReport?.task?.task_number || previewReport?.lead?.lead_number || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Generated By:</span>
                  <p>{previewReport?.generated_by_user?.full_name || 'Unknown'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Generated At:</span>
                  <p>{previewReport?.generated_at ? format(new Date(previewReport.generated_at), 'MMM dd, yyyy HH:mm') : 'N/A'}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Report Data</h4>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(previewReport?.report_data, null, 2)}
                </pre>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => previewReport && downloadAsHtml(previewReport.id)}
                  disabled={isGenerating}
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Download HTML
                </Button>
                <Button
                  onClick={() => previewReport && generatePdf(previewReport.id)}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Printer className="h-4 w-4 mr-2" />
                  )}
                  Print / Save as PDF
                </Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
