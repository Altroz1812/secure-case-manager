import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClientPortalTask, useClientLeadDocuments, useUploadClientDocument } from '@/hooks/useClientPortal';
import { format } from 'date-fns';
import { Upload, FileText, Download, Loader2, User, MapPin, Calendar, Hash } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LeadDetailDialogProps {
  task: ClientPortalTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DOCUMENT_TYPES = [
  { value: 'id_proof', label: 'ID Proof' },
  { value: 'address_proof', label: 'Address Proof' },
  { value: 'income_proof', label: 'Income Proof' },
  { value: 'bank_statement', label: 'Bank Statement' },
  { value: 'property_document', label: 'Property Document' },
  { value: 'other', label: 'Other' },
];

export function LeadDetailDialog({ task, open, onOpenChange }: LeadDetailDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>('');
  const [remarks, setRemarks] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const { data: documents, isLoading: documentsLoading, refetch: refetchDocuments } = useClientLeadDocuments(task?.lead.id);
  const uploadMutation = useUploadClientDocument();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentType || !task) {
      toast.error('Please select a file and document type');
      return;
    }

    setIsUploading(true);
    try {
      await uploadMutation.mutateAsync({
        leadId: task.lead.id,
        file: selectedFile,
        documentType,
        remarks: remarks || undefined,
      });
      
      toast.success('Document uploaded successfully');
      setSelectedFile(null);
      setDocumentType('');
      setRemarks('');
      refetchDocuments();
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (storagePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('client-documents')
        .download(storagePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error('Failed to download document');
    }
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Lead Details - {task.lead.lead_number}
          </DialogTitle>
          <DialogDescription>
            View lead information and upload supporting documents
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Lead Details</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Applicant Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Applicant Name</p>
                      <p className="font-medium">{task.lead.applicant_name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Application Number</p>
                      <p className="font-medium">{task.lead.application_number || '-'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Lead Number</p>
                      <p className="font-medium">{task.lead.lead_number}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Created</p>
                      <p className="font-medium">{format(new Date(task.created_at), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Verification Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Task Number</p>
                    <p className="font-medium">{task.task_number}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Verification Type</p>
                    <Badge variant="outline" className="capitalize mt-1">
                      {task.verification_type.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge 
                      variant="secondary" 
                      className={`mt-1 ${
                        task.status === 'approved' ? 'bg-green-100 text-green-700' :
                        task.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        task.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">SLA Deadline</p>
                    <p className={`font-medium ${task.is_overdue ? 'text-destructive' : ''}`}>
                      {task.sla_deadline 
                        ? format(new Date(task.sla_deadline), 'MMM dd, yyyy HH:mm')
                        : '-'
                      }
                      {task.is_overdue && ' (Overdue)'}
                    </p>
                  </div>

                  {task.completed_at && (
                    <div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <p className="font-medium">
                        {format(new Date(task.completed_at), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Client Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Client Name</p>
                    <p className="font-medium">{task.lead.client.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Client Code</p>
                    <p className="font-medium">{task.lead.client.code}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Upload New Document</CardTitle>
                <CardDescription>
                  Upload supporting documents for this lead
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="document-type">Document Type</Label>
                    <Select value={documentType} onValueChange={setDocumentType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        {DOCUMENT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="file">File</Label>
                    <Input
                      id="file"
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                    {selectedFile && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="remarks">Remarks (Optional)</Label>
                    <Textarea
                      id="remarks"
                      placeholder="Add any notes about this document..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                    />
                  </div>

                  <Button 
                    onClick={handleUpload} 
                    disabled={!selectedFile || !documentType || isUploading}
                    className="w-full"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Document
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Uploaded Documents</CardTitle>
                <CardDescription>
                  Documents uploaded for this lead
                </CardDescription>
              </CardHeader>
              <CardContent>
                {documentsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : documents && documents.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>File Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Uploaded</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documents.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            {doc.file_name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {DOCUMENT_TYPES.find(t => t.value === doc.document_type)?.label || doc.document_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(doc.created_at), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(doc.storage_path, doc.file_name)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No documents uploaded yet
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
