import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  useCreateApplicant,
  useUpdateApplicant,
  ApplicantWithDetails,
  APPLICANT_TYPES,
  RELATION_TYPES,
  ApplicantType
} from '@/hooks/useLeadApplicants';

const applicantSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  applicant_type: z.enum(['primary', 'co_applicant', 'guarantor'] as const),
  relation_to_primary: z.string().optional(),
  pan_number: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format').optional().or(z.literal('')),
  aadhar_number: z.string().regex(/^\d{12}$/, 'Aadhar must be 12 digits').optional().or(z.literal('')),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits').optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  date_of_birth: z.string().optional(),
  occupation: z.string().optional(),
  employer_name: z.string().optional(),
  monthly_income: z.string().optional(),
  is_primary: z.boolean().default(false),
});

type ApplicantFormValues = z.infer<typeof applicantSchema>;

interface ApplicantFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  applicant: ApplicantWithDetails | null;
  hasPrimary: boolean;
}

export function ApplicantFormDialog({
  open,
  onOpenChange,
  leadId,
  applicant,
  hasPrimary,
}: ApplicantFormDialogProps) {
  const createApplicant = useCreateApplicant();
  const updateApplicant = useUpdateApplicant();
  const isEditing = !!applicant;

  const form = useForm<ApplicantFormValues>({
    resolver: zodResolver(applicantSchema),
    defaultValues: {
      name: '',
      applicant_type: 'primary',
      relation_to_primary: '',
      pan_number: '',
      aadhar_number: '',
      phone: '',
      email: '',
      date_of_birth: '',
      occupation: '',
      employer_name: '',
      monthly_income: '',
      is_primary: false,
    },
  });

  const applicantType = form.watch('applicant_type');
  const showRelation = applicantType !== 'primary';

  useEffect(() => {
    if (open && applicant) {
      form.reset({
        name: applicant.name,
        applicant_type: applicant.applicant_type,
        relation_to_primary: applicant.relation_to_primary || '',
        pan_number: applicant.pan_number || '',
        aadhar_number: applicant.aadhar_number || '',
        phone: applicant.phone || '',
        email: applicant.email || '',
        date_of_birth: applicant.date_of_birth || '',
        occupation: applicant.occupation || '',
        employer_name: applicant.employer_name || '',
        monthly_income: applicant.monthly_income?.toString() || '',
        is_primary: applicant.is_primary,
      });
    } else if (open && !applicant) {
      form.reset({
        name: '',
        applicant_type: hasPrimary ? 'co_applicant' : 'primary',
        relation_to_primary: '',
        pan_number: '',
        aadhar_number: '',
        phone: '',
        email: '',
        date_of_birth: '',
        occupation: '',
        employer_name: '',
        monthly_income: '',
        is_primary: !hasPrimary,
      });
    }
  }, [open, applicant, hasPrimary, form]);

  const onSubmit = async (data: ApplicantFormValues) => {
    try {
      const payload = {
        lead_id: leadId,
        name: data.name,
        applicant_type: data.applicant_type as ApplicantType,
        relation_to_primary: data.relation_to_primary || null,
        pan_number: data.pan_number || null,
        aadhar_number: data.aadhar_number || null,
        phone: data.phone || null,
        email: data.email || null,
        date_of_birth: data.date_of_birth || null,
        occupation: data.occupation || null,
        employer_name: data.employer_name || null,
        monthly_income: data.monthly_income ? parseFloat(data.monthly_income) : null,
        is_primary: data.is_primary || data.applicant_type === 'primary',
      };

      if (isEditing) {
        await updateApplicant.mutateAsync({ id: applicant.id, leadId, ...payload });
      } else {
        await createApplicant.mutateAsync(payload);
      }

      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Applicant' : 'Add Applicant'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the applicant details below' 
              : 'Enter the details of the new applicant'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="applicant_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Applicant Type *</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={isEditing && applicant?.is_primary}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {APPLICANT_TYPES.map(type => (
                          <SelectItem 
                            key={type.value} 
                            value={type.value}
                            disabled={type.value === 'primary' && hasPrimary && !applicant?.is_primary}
                          >
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {showRelation && (
                <FormField
                  control={form.control}
                  name="relation_to_primary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relation to Primary</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select relation" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {RELATION_TYPES.map(rel => (
                            <SelectItem key={rel.value} value={rel.value}>
                              {rel.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="10 digit number" maxLength={10} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pan_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PAN Number</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="ABCDE1234F" 
                        maxLength={10}
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="aadhar_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aadhar Number</FormLabel>
                    <FormControl>
                      <Input placeholder="12 digit Aadhar" maxLength={12} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date_of_birth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="occupation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Occupation</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Salaried, Self-employed" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="employer_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employer / Business Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Company or business name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="monthly_income"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Income (₹)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="e.g., 50000" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createApplicant.isPending || updateApplicant.isPending}
              >
                {createApplicant.isPending || updateApplicant.isPending 
                  ? 'Saving...' 
                  : isEditing ? 'Update' : 'Add Applicant'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
