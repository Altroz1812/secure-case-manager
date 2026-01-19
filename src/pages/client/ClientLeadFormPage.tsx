import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useBranches } from '@/hooks/useBranches';
import { useVerificationTypeConfig } from '@/hooks/useLeads';
import { useCheckLeadDuplicates } from '@/hooks/useLeadDuplicates';
import { DuplicateWarningDialog } from '@/components/intake/DuplicateWarningDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, FileText, Upload, X, Building, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { Database } from '@/integrations/supabase/types';

type VerificationType = Database['public']['Enums']['verification_type'];
type PriorityLevel = Database['public']['Enums']['priority_level'];

const clientLeadFormSchema = z.object({
  applicant_name: z.string().min(2, 'Applicant name is required').max(200),
  product_id: z.string().min(1, 'Product is required'),
  branch_id: z.string().min(1, 'Branch is required'),
  application_number: z.string().optional(),
  loan_number: z.string().optional(),
  address: z.string().optional(),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits').optional().or(z.literal('')),
  verification_types: z.array(z.string()).min(1, 'Select at least one verification type'),
});

type ClientLeadFormValues = z.infer<typeof clientLeadFormSchema>;

interface FileToUpload {
  file: File;
  documentType: string;
  remarks: string;
}

export default function ClientLeadFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string>('');
  const [availableProducts, setAvailableProducts] = useState<{ id: string; name: string; code: string }[]>([]);
  const [filesToUpload, setFilesToUpload] = useState<FileToUpload[]>([]);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<ClientLeadFormValues | null>(null);

  const { data: branches } = useBranches();
  const { data: verificationTypes } = useVerificationTypeConfig();

  const form = useForm<ClientLeadFormValues>({
    resolver: zodResolver(clientLeadFormSchema),
    defaultValues: {
      applicant_name: '',
      product_id: '',
      branch_id: '',
      application_number: '',
      loan_number: '',
      address: '',
      pincode: '',
      verification_types: [],
    },
  });

  const watchedApplicantName = form.watch('applicant_name');
  const watchedApplicationNumber = form.watch('application_number');

  const { data: duplicates } = useCheckLeadDuplicates(
    clientId || undefined,
    watchedApplicantName,
    watchedApplicationNumber
  );

  // Fetch client assignment and products for the user
  useEffect(() => {
    const fetchClientData = async () => {
      if (!user) return;

      // Get user's assigned client
      const { data: assignments } = await supabase
        .from('client_user_assignments')
        .select('client_id, clients(id, name, code)')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (assignments?.clients) {
        const client = assignments.clients as { id: string; name: string; code: string };
        setClientId(client.id);
        setClientName(client.name);

        // Fetch available products for this client
        const { data: clientProducts } = await supabase
          .from('client_products')
          .select('product_id, products(id, name, code)')
          .eq('client_id', client.id);

        if (clientProducts && clientProducts.length > 0) {
          const products = clientProducts
            .map((cp) => cp.products as { id: string; name: string; code: string } | null)
            .filter((p): p is { id: string; name: string; code: string } => p !== null);
          setAvailableProducts(products);
        } else {
          // If no specific products assigned, fetch all active products
          const { data: allProducts } = await supabase
            .from('products')
            .select('id, name, code')
            .eq('is_active', true)
            .order('name');
          setAvailableProducts(allProducts || []);
        }
      }
    };

    fetchClientData();
  }, [user]);

  // Get branches associated with client
  const clientBranches = branches?.filter((b) => b.is_active) || [];
  const activeVerificationTypes = verificationTypes?.filter((v) => v.is_active) || [];
  const selectedVerificationTypes = form.watch('verification_types');

  const handleVerificationTypeToggle = (type: string) => {
    const current = form.getValues('verification_types');
    const updated = current.includes(type) ? current.filter((t) => t !== type) : [...current, type];
    form.setValue('verification_types', updated, { shouldValidate: true });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files).map((file) => ({
      file,
      documentType: 'supporting_document',
      remarks: '',
    }));

    setFilesToUpload((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFilesToUpload((prev) => prev.filter((_, i) => i !== index));
  };

  const updateFileRemarks = (index: number, remarks: string) => {
    setFilesToUpload((prev) =>
      prev.map((f, i) => (i === index ? { ...f, remarks } : f))
    );
  };

  const createLeadAndTasks = async (data: ClientLeadFormValues, overrideReason?: string) => {
    if (!user || !clientId) return;

    setIsSubmitting(true);
    try {
      // Generate lead number
      const { data: leadNumberData, error: leadNumberError } = await supabase.rpc('generate_lead_number');
      if (leadNumberError) throw leadNumberError;

      // Create lead
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .insert({
          lead_number: leadNumberData,
          applicant_name: data.applicant_name,
          client_id: clientId,
          product_id: data.product_id,
          branch_id: data.branch_id,
          application_number: data.application_number || null,
          loan_number: data.loan_number || null,
          address: data.address || null,
          pincode: data.pincode || null,
          priority: 'normal' as PriorityLevel,
          created_by: user.id,
          verification_types: data.verification_types as VerificationType[],
        })
        .select()
        .single();

      if (leadError) throw leadError;

      // Log duplicate override if applicable
      if (overrideReason && duplicates && duplicates.length > 0) {
        await supabase.from('audit_logs').insert({
          action: 'lead_duplicate_override',
          entity_type: 'lead',
          entity_id: lead.id,
          user_id: user.id,
          old_values: { duplicates: duplicates.map((d) => d.lead_id) },
          new_values: { override_reason: overrideReason },
        });

        // Record in lead_duplicates table
        for (const dup of duplicates) {
          await supabase.from('lead_duplicates').insert({
            original_lead_id: dup.lead_id,
            duplicate_lead_id: lead.id,
            match_type: dup.match_type,
            match_score: dup.match_score,
            is_overridden: true,
            override_reason: overrideReason,
            overridden_by: user.id,
          });
        }
      }

      // Create tasks for each verification type
      for (const vType of data.verification_types) {
        const vtConfig = verificationTypes?.find((vt) => vt.type === vType);
        const slaHours = vtConfig?.sla_hours || 48;
        const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000);

        const { data: taskNumberData } = await supabase.rpc('generate_task_number');

        await supabase.from('tasks').insert({
          task_number: taskNumberData,
          lead_id: lead.id,
          branch_id: data.branch_id,
          verification_type: vType as VerificationType,
          status: 'pending',
          sla_deadline: slaDeadline.toISOString(),
        });
      }

      // Upload documents if any
      for (const fileData of filesToUpload) {
        const fileName = `${lead.id}/${Date.now()}-${fileData.file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('client-documents')
          .upload(fileName, fileData.file);

        if (!uploadError) {
          await supabase.from('client_documents').insert({
            lead_id: lead.id,
            uploaded_by: user.id,
            file_name: fileData.file.name,
            file_type: fileData.file.type,
            file_size: fileData.file.size,
            storage_path: fileName,
            document_type: fileData.documentType,
            remarks: fileData.remarks || null,
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: ['client-portal-tasks'] });
      toast.success(`Lead ${lead.lead_number} created successfully`);
      navigate('/client-portal');
    } catch (error: any) {
      toast.error('Failed to create lead', { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (data: ClientLeadFormValues) => {
    // Check for duplicates
    if (duplicates && duplicates.length > 0) {
      setPendingFormData(data);
      setShowDuplicateDialog(true);
      return;
    }

    await createLeadAndTasks(data);
  };

  const handleDuplicateOverride = async (reason: string) => {
    if (!pendingFormData) return;
    setShowDuplicateDialog(false);
    await createLeadAndTasks(pendingFormData, reason);
    setPendingFormData(null);
  };

  const handleDuplicateCancel = () => {
    setShowDuplicateDialog(false);
    setPendingFormData(null);
  };

  const handleViewDuplicateLead = (leadId: string) => {
    // Client viewers can't navigate to lead detail, just close dialog
    setShowDuplicateDialog(false);
    toast.info('Please review the duplicate lead before proceeding');
  };

  if (!clientId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading client information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/client-portal')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Submit Verification Request
          </h1>
          <p className="text-muted-foreground">Create a new verification lead for your organization</p>
        </div>
      </div>

      {/* Client Info */}
      <Alert>
        <Building className="h-4 w-4" />
        <AlertDescription className="flex items-center gap-2">
          <span>Submitting for:</span>
          <span className="font-medium">{clientName}</span>
        </AlertDescription>
      </Alert>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Applicant Info */}
            <Card>
              <CardHeader>
                <CardTitle>Applicant Information</CardTitle>
                <CardDescription>Details about the verification subject</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="applicant_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Applicant Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter applicant's full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="product_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableProducts.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} ({product.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="application_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Application Number</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., APP123456" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="loan_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Loan Number</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., LN789012" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Right Column - Location */}
            <Card>
              <CardHeader>
                <CardTitle>Location & Branch</CardTitle>
                <CardDescription>Address and branch assignment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="branch_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branch *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select branch" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clientBranches.map((branch) => (
                            <SelectItem key={branch.id} value={branch.id}>
                              {branch.name} ({branch.code}) - {branch.city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter verification address"
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pincode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pincode</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 400001" maxLength={6} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Verification Types */}
          <Card>
            <CardHeader>
              <CardTitle>Verification Types *</CardTitle>
              <CardDescription>Select the types of verification required</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="verification_types"
                render={() => (
                  <FormItem>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {activeVerificationTypes.map((vt) => (
                        <div
                          key={vt.id}
                          className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedVerificationTypes.includes(vt.type)
                              ? 'border-primary bg-primary/5'
                              : 'hover:bg-muted'
                          }`}
                          onClick={() => handleVerificationTypeToggle(vt.type)}
                        >
                          <Checkbox
                            checked={selectedVerificationTypes.includes(vt.type)}
                            onCheckedChange={() => handleVerificationTypeToggle(vt.type)}
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{vt.display_name}</p>
                            <p className="text-xs text-muted-foreground">SLA: {vt.sla_hours}h</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Document Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Supporting Documents
              </CardTitle>
              <CardDescription>Upload any supporting documents for this verification request</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Add Documents
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  Accepted formats: PDF, JPG, PNG, DOC, DOCX
                </p>
              </div>

              {filesToUpload.length > 0 && (
                <div className="space-y-2">
                  {filesToUpload.map((fileData, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{fileData.file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(fileData.file.size / 1024).toFixed(1)} KB
                        </p>
                        <Input
                          placeholder="Add remarks (optional)"
                          value={fileData.remarks}
                          onChange={(e) => updateFileRemarks(index, e.target.value)}
                          className="mt-2 text-sm"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Duplicate Warning Indicator */}
          {duplicates && duplicates.length > 0 && (
            <Alert variant="destructive">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> {duplicates.length} potential duplicate(s) found. 
                You will be asked to confirm before submission.
              </AlertDescription>
            </Alert>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate('/client-portal')}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </Form>

      {/* Duplicate Warning Dialog */}
      <DuplicateWarningDialog
        open={showDuplicateDialog}
        onOpenChange={setShowDuplicateDialog}
        duplicates={duplicates || []}
        onCancel={handleDuplicateCancel}
        onViewLead={handleViewDuplicateLead}
        onOverride={handleDuplicateOverride}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
