import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

// Type definitions
export type ApplicantType = 'primary' | 'co_applicant' | 'guarantor';
export type AddressType = 'residence' | 'office' | 'permanent' | 'correspondence';
export type DocumentType = 'pan' | 'aadhar' | 'passport' | 'voter_id' | 'driving_license' | 
  'bank_statement' | 'itr' | 'salary_slip' | 'form_16' | 'property_docs' | 
  'business_registration' | 'gst_certificate' | 'utility_bill' | 'rent_agreement' | 'other';

export interface LeadApplicant {
  id: string;
  lead_id: string;
  applicant_type: ApplicantType;
  name: string;
  relation_to_primary: string | null;
  pan_number: string | null;
  aadhar_number: string | null;
  phone: string | null;
  email: string | null;
  date_of_birth: string | null;
  occupation: string | null;
  employer_name: string | null;
  monthly_income: number | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApplicantAddress {
  id: string;
  applicant_id: string;
  address_type: AddressType;
  address_line1: string;
  address_line2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  is_primary: boolean;
  years_at_address: number | null;
  ownership_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicantDocument {
  id: string;
  applicant_id: string;
  document_type: DocumentType;
  document_number: string | null;
  file_name: string;
  storage_path: string;
  file_size: number | null;
  file_type: string | null;
  is_verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  verification_remarks: string | null;
  uploaded_by: string;
  created_at: string;
}

export interface ApplicantWithDetails extends LeadApplicant {
  addresses: ApplicantAddress[];
  documents: ApplicantDocument[];
}

// Insert types
export interface LeadApplicantInsert {
  lead_id: string;
  applicant_type: ApplicantType;
  name: string;
  relation_to_primary?: string | null;
  pan_number?: string | null;
  aadhar_number?: string | null;
  phone?: string | null;
  email?: string | null;
  date_of_birth?: string | null;
  occupation?: string | null;
  employer_name?: string | null;
  monthly_income?: number | null;
  is_primary?: boolean;
}

export interface ApplicantAddressInsert {
  applicant_id: string;
  address_type: AddressType;
  address_line1: string;
  address_line2?: string | null;
  landmark?: string | null;
  city: string;
  state: string;
  pincode: string;
  latitude?: number | null;
  longitude?: number | null;
  is_primary?: boolean;
  years_at_address?: number | null;
  ownership_type?: string | null;
}

export interface ApplicantDocumentInsert {
  applicant_id: string;
  document_type: DocumentType;
  document_number?: string | null;
  file_name: string;
  storage_path: string;
  file_size?: number | null;
  file_type?: string | null;
  uploaded_by: string;
}

// Fetch applicants for a lead with their addresses and documents
export function useLeadApplicants(leadId: string | undefined) {
  return useQuery({
    queryKey: ['lead-applicants', leadId],
    queryFn: async () => {
      if (!leadId) return [];

      const { data: applicants, error } = await supabase
        .from('lead_applicants')
        .select('*')
        .eq('lead_id', leadId)
        .order('is_primary', { ascending: false })
        .order('applicant_type')
        .order('created_at');

      if (error) throw error;

      // Fetch addresses and documents for each applicant
      const applicantIds = applicants.map(a => a.id);
      
      const [addressesResult, documentsResult] = await Promise.all([
        supabase
          .from('applicant_addresses')
          .select('*')
          .in('applicant_id', applicantIds)
          .order('is_primary', { ascending: false }),
        supabase
          .from('applicant_documents')
          .select('*')
          .in('applicant_id', applicantIds)
          .order('created_at', { ascending: false })
      ]);

      if (addressesResult.error) throw addressesResult.error;
      if (documentsResult.error) throw documentsResult.error;

      // Map addresses and documents to their applicants
      const applicantsWithDetails: ApplicantWithDetails[] = applicants.map(applicant => ({
        ...applicant,
        applicant_type: applicant.applicant_type as ApplicantType,
        addresses: (addressesResult.data || [])
          .filter(addr => addr.applicant_id === applicant.id)
          .map(addr => ({ ...addr, address_type: addr.address_type as AddressType })),
        documents: (documentsResult.data || [])
          .filter(doc => doc.applicant_id === applicant.id)
          .map(doc => ({ ...doc, document_type: doc.document_type as DocumentType }))
      }));

      return applicantsWithDetails;
    },
    enabled: !!leadId,
  });
}

// Create applicant
export function useCreateApplicant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (applicant: LeadApplicantInsert) => {
      const { data, error } = await supabase
        .from('lead_applicants')
        .insert(applicant)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lead-applicants', variables.lead_id] });
      toast.success('Applicant added successfully');
    },
    onError: (error) => {
      console.error('Error creating applicant:', error);
      toast.error('Failed to add applicant');
    },
  });
}

// Update applicant
export function useUpdateApplicant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, leadId, ...updates }: Partial<LeadApplicant> & { id: string; leadId: string }) => {
      const { data, error } = await supabase
        .from('lead_applicants')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, leadId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['lead-applicants', result.leadId] });
      toast.success('Applicant updated successfully');
    },
    onError: (error) => {
      console.error('Error updating applicant:', error);
      toast.error('Failed to update applicant');
    },
  });
}

// Delete applicant
export function useDeleteApplicant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, leadId }: { id: string; leadId: string }) => {
      const { error } = await supabase
        .from('lead_applicants')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { leadId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['lead-applicants', result.leadId] });
      toast.success('Applicant removed');
    },
    onError: (error) => {
      console.error('Error deleting applicant:', error);
      toast.error('Failed to remove applicant');
    },
  });
}

// Create address
export function useCreateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ address, leadId }: { address: ApplicantAddressInsert; leadId: string }) => {
      const { data, error } = await supabase
        .from('applicant_addresses')
        .insert(address)
        .select()
        .single();

      if (error) throw error;
      return { data, leadId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['lead-applicants', result.leadId] });
      toast.success('Address added');
    },
    onError: (error) => {
      console.error('Error creating address:', error);
      toast.error('Failed to add address');
    },
  });
}

// Update address
export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, leadId, ...updates }: Partial<ApplicantAddress> & { id: string; leadId: string }) => {
      const { data, error } = await supabase
        .from('applicant_addresses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, leadId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['lead-applicants', result.leadId] });
      toast.success('Address updated');
    },
    onError: (error) => {
      console.error('Error updating address:', error);
      toast.error('Failed to update address');
    },
  });
}

// Delete address
export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, leadId }: { id: string; leadId: string }) => {
      const { error } = await supabase
        .from('applicant_addresses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { leadId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['lead-applicants', result.leadId] });
      toast.success('Address removed');
    },
    onError: (error) => {
      console.error('Error deleting address:', error);
      toast.error('Failed to remove address');
    },
  });
}

// Upload document
export function useUploadApplicantDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      file, 
      applicantId, 
      documentType, 
      documentNumber,
      leadId,
      uploadedBy 
    }: { 
      file: File; 
      applicantId: string; 
      documentType: DocumentType; 
      documentNumber?: string;
      leadId: string;
      uploadedBy: string;
    }) => {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${applicantId}/${documentType}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('applicant-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { data, error } = await supabase
        .from('applicant_documents')
        .insert({
          applicant_id: applicantId,
          document_type: documentType,
          document_number: documentNumber || null,
          file_name: file.name,
          storage_path: fileName,
          file_size: file.size,
          file_type: file.type,
          uploaded_by: uploadedBy,
        })
        .select()
        .single();

      if (error) throw error;
      return { data, leadId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['lead-applicants', result.leadId] });
      toast.success('Document uploaded');
    },
    onError: (error) => {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    },
  });
}

// Delete document
export function useDeleteApplicantDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, storagePath, leadId }: { id: string; storagePath: string; leadId: string }) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('applicant-documents')
        .remove([storagePath]);

      if (storageError) console.warn('Failed to delete file from storage:', storageError);

      // Delete record
      const { error } = await supabase
        .from('applicant_documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { leadId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['lead-applicants', result.leadId] });
      toast.success('Document deleted');
    },
    onError: (error) => {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    },
  });
}

// Constants for dropdowns
export const APPLICANT_TYPES: { value: ApplicantType; label: string }[] = [
  { value: 'primary', label: 'Primary Applicant' },
  { value: 'co_applicant', label: 'Co-Applicant' },
  { value: 'guarantor', label: 'Guarantor' },
];

export const ADDRESS_TYPES: { value: AddressType; label: string }[] = [
  { value: 'residence', label: 'Residence' },
  { value: 'office', label: 'Office' },
  { value: 'permanent', label: 'Permanent' },
  { value: 'correspondence', label: 'Correspondence' },
];

export const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'pan', label: 'PAN Card' },
  { value: 'aadhar', label: 'Aadhar Card' },
  { value: 'passport', label: 'Passport' },
  { value: 'voter_id', label: 'Voter ID' },
  { value: 'driving_license', label: 'Driving License' },
  { value: 'bank_statement', label: 'Bank Statement' },
  { value: 'itr', label: 'ITR' },
  { value: 'salary_slip', label: 'Salary Slip' },
  { value: 'form_16', label: 'Form 16' },
  { value: 'property_docs', label: 'Property Documents' },
  { value: 'business_registration', label: 'Business Registration' },
  { value: 'gst_certificate', label: 'GST Certificate' },
  { value: 'utility_bill', label: 'Utility Bill' },
  { value: 'rent_agreement', label: 'Rent Agreement' },
  { value: 'other', label: 'Other' },
];

export const OWNERSHIP_TYPES = [
  { value: 'owned', label: 'Owned' },
  { value: 'rented', label: 'Rented' },
  { value: 'family', label: 'Family Owned' },
  { value: 'company_provided', label: 'Company Provided' },
];

export const RELATION_TYPES = [
  { value: 'spouse', label: 'Spouse' },
  { value: 'parent', label: 'Parent' },
  { value: 'child', label: 'Child' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'business_partner', label: 'Business Partner' },
  { value: 'employer', label: 'Employer' },
  { value: 'other', label: 'Other' },
];
