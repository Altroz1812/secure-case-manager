import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateLead, useProducts, useVerificationTypeConfig } from '@/hooks/useLeads';
import { useEmail, useMarkEmailProcessed } from '@/hooks/useEmails';
import { useClients } from '@/hooks/useClients';
import { useBranches } from '@/hooks/useBranches';
import { useAuth } from '@/hooks/useAuth';
import { useCheckLeadDuplicatesMutation } from '@/hooks/useLeadDuplicates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, FileText } from 'lucide-react';
import { EmailContentPanel } from '@/components/intake/EmailContentPanel';
import { DroppableInput, DroppableTextarea } from '@/components/intake/DroppableFormField';
import { DuplicateWarningDialog } from '@/components/intake/DuplicateWarningDialog';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type VerificationType = Database['public']['Enums']['verification_type'];
type PriorityLevel = Database['public']['Enums']['priority_level'];

const leadFormSchema = z.object({
  applicant_name: z.string().min(2, 'Applicant name is required').max(200),
  client_id: z.string().min(1, 'Client is required'),
  product_id: z.string().min(1, 'Product is required'),
  branch_id: z.string().min(1, 'Branch is required'),
  application_number: z.string().optional(),
  loan_number: z.string().optional(),
  address: z.string().optional(),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits').optional().or(z.literal('')),
  priority: z.enum(['low', 'normal', 'high', 'urgent'] as const),
  verification_types: z.array(z.string()).min(1, 'Select at least one verification type'),
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

interface ExtractedData {
  applicant_name?: string;
  application_number?: string;
  loan_number?: string;
  address?: string;
  pincode?: string;
}

export default function LeadFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailId = searchParams.get('emailId');
  
  const { user } = useAuth();
  const { data: email, isLoading: emailLoading } = useEmail(emailId || undefined);
  const { data: clients } = useClients();
  const { data: branches } = useBranches();
  const { data: products } = useProducts();
  const { data: verificationTypes } = useVerificationTypeConfig();
  
  const createLead = useCreateLead();
  const markEmailProcessed = useMarkEmailProcessed();
  const checkDuplicates = useCheckLeadDuplicatesMutation();

  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [pendingSubmission, setPendingSubmission] = useState<LeadFormValues | null>(null);
  const [draggedText, setDraggedText] = useState('');

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      applicant_name: '',
      client_id: '',
      product_id: '',
      branch_id: '',
      application_number: '',
      loan_number: '',
      address: '',
      pincode: '',
      priority: 'normal',
      verification_types: [],
    },
  });

  // Pre-fill branch from email if available
  useEffect(() => {
    if (email?.branch_id && !form.getValues('branch_id')) {
      form.setValue('branch_id', email.branch_id);
    }
  }, [email, form]);

  const activeClients = clients?.filter(c => c.is_active) || [];
  const activeBranches = branches?.filter(b => b.is_active) || [];
  const activeProducts = products?.filter(p => p.is_active) || [];
  const activeVerificationTypes = verificationTypes?.filter(v => v.is_active) || [];

  const selectedVerificationTypes = form.watch('verification_types');

  const handleExtractData = (data: ExtractedData) => {
    let fieldsUpdated = 0;
    
    if (data.applicant_name && !form.getValues('applicant_name')) {
      form.setValue('applicant_name', data.applicant_name);
      fieldsUpdated++;
    }
    if (data.application_number && !form.getValues('application_number')) {
      form.setValue('application_number', data.application_number);
      fieldsUpdated++;
    }
    if (data.loan_number && !form.getValues('loan_number')) {
      form.setValue('loan_number', data.loan_number);
      fieldsUpdated++;
    }
    if (data.address && !form.getValues('address')) {
      form.setValue('address', data.address);
      fieldsUpdated++;
    }
    if (data.pincode && !form.getValues('pincode')) {
      form.setValue('pincode', data.pincode);
      fieldsUpdated++;
    }
    
    if (fieldsUpdated > 0) {
      toast.success(`Extracted ${fieldsUpdated} field(s) from email`);
    } else {
      toast.info('No additional data could be extracted');
    }
  };

  const handleDragStart = (text: string) => {
    setDraggedText(text);
  };

  const submitLead = async (data: LeadFormValues, overrideReason?: string) => {
    if (!user) return;

    try {
      await createLead.mutateAsync({
        applicant_name: data.applicant_name,
        client_id: data.client_id,
        product_id: data.product_id,
        branch_id: data.branch_id,
        application_number: data.application_number || null,
        loan_number: data.loan_number || null,
        address: data.address || null,
        pincode: data.pincode || null,
        priority: data.priority as PriorityLevel,
        email_id: emailId || null,
        created_by: user.id,
        verification_types: data.verification_types as VerificationType[],
      });

      // Mark email as processed if creating from email
      if (emailId && user) {
        await markEmailProcessed.mutateAsync({ id: emailId, processedBy: user.id });
      }

      navigate('/leads');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const onSubmit = async (data: LeadFormValues) => {
    if (!user) return;

    try {
      // Check for duplicates
      const duplicateResults = await checkDuplicates.mutateAsync({
        client_id: data.client_id,
        applicant_name: data.applicant_name,
        application_number: data.application_number,
      });

      if (duplicateResults && duplicateResults.length > 0) {
        setDuplicates(duplicateResults);
        setPendingSubmission(data);
        setShowDuplicateDialog(true);
        return;
      }

      await submitLead(data);
    } catch (error) {
      // If duplicate check fails, proceed with creation
      await submitLead(data);
    }
  };

  const handleDuplicateOverride = async (reason: string) => {
    if (pendingSubmission) {
      await submitLead(pendingSubmission, reason);
    }
    setShowDuplicateDialog(false);
    setPendingSubmission(null);
    setDuplicates([]);
  };

  const handleDuplicateCancel = () => {
    setShowDuplicateDialog(false);
    setPendingSubmission(null);
    setDuplicates([]);
  };

  const handleVerificationTypeToggle = (type: string) => {
    const current = form.getValues('verification_types');
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    form.setValue('verification_types', updated, { shouldValidate: true });
  };

  // If we have an email, use side-by-side layout
  const hasEmail = !!emailId && !!email;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Create New Lead
          </h1>
          <p className="text-muted-foreground">
            {emailId ? 'Creating lead from email - drag content to fill fields' : 'Manual lead creation'}
          </p>
        </div>
      </div>

      <div className={hasEmail ? 'grid grid-cols-1 xl:grid-cols-2 gap-6' : ''}>
        {/* Email Content Panel - Left Side */}
        {hasEmail && !emailLoading && (
          <div className="xl:sticky xl:top-4 xl:self-start">
            <EmailContentPanel
              email={email}
              onExtractData={handleExtractData}
              onDragStart={handleDragStart}
            />
          </div>
        )}

        {/* Form - Right Side */}
        <div className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Applicant & Client Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Applicant Information</CardTitle>
                    <CardDescription>
                      {hasEmail ? 'Drag text from email or auto-extract' : 'Basic details about the verification request'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="applicant_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Applicant Name *</FormLabel>
                          <FormControl>
                            <DroppableInput
                              placeholder="Enter or drag applicant's name"
                              {...field}
                              onDropValue={(value) => form.setValue('applicant_name', value)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="client_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select client" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {activeClients.map(client => (
                                <SelectItem key={client.id} value={client.id}>
                                  {client.name} ({client.code})
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
                              {activeProducts.map(product => (
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
                            <FormLabel>Application No.</FormLabel>
                            <FormControl>
                              <DroppableInput
                                placeholder="e.g., APP123456"
                                {...field}
                                onDropValue={(value) => form.setValue('application_number', value)}
                              />
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
                              <DroppableInput
                                placeholder="e.g., LN789012"
                                {...field}
                                onDropValue={(value) => form.setValue('loan_number', value)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Right Column - Location & Assignment */}
                <Card>
                  <CardHeader>
                    <CardTitle>Location & Assignment</CardTitle>
                    <CardDescription>Branch and address information</CardDescription>
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
                              {activeBranches.map(branch => (
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
                            <DroppableTextarea
                              placeholder="Enter or drag verification address"
                              className="resize-none"
                              rows={3}
                              {...field}
                              onDropValue={(value) => form.setValue('address', value)}
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
                            <DroppableInput
                              placeholder="e.g., 400001"
                              maxLength={6}
                              {...field}
                              onDropValue={(value) => {
                                // Extract 6-digit pincode if present
                                const pinMatch = value.match(/\d{6}/);
                                form.setValue('pincode', pinMatch ? pinMatch[0] : value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
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
                  <CardDescription>Select the types of verification required for this lead</CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="verification_types"
                    render={() => (
                      <FormItem>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {activeVerificationTypes.map(vt => (
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
                                <p className="text-xs text-muted-foreground">
                                  SLA: {vt.sla_hours}h
                                  {vt.is_field_verification && ' • Field'}
                                </p>
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

              {/* Form Actions */}
              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createLead.isPending}>
                  {createLead.isPending ? 'Creating...' : 'Create Lead'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>

      {/* Duplicate Warning Dialog */}
      <DuplicateWarningDialog
        open={showDuplicateDialog}
        onOpenChange={setShowDuplicateDialog}
        duplicates={duplicates}
        onCancel={handleDuplicateCancel}
        onOverride={handleDuplicateOverride}
        onViewLead={(leadId) => navigate(`/leads/${leadId}`)}
      />
    </div>
  );
}
