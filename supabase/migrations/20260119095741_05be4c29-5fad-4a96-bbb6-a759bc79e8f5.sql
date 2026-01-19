-- Phase 1: Multi-Applicant Data Model

-- Create enum for applicant types
CREATE TYPE public.applicant_type AS ENUM ('primary', 'co_applicant', 'guarantor');

-- Create enum for address types
CREATE TYPE public.address_type AS ENUM ('residence', 'office', 'permanent', 'correspondence');

-- Create enum for document types
CREATE TYPE public.document_type AS ENUM (
  'pan', 'aadhar', 'passport', 'voter_id', 'driving_license',
  'bank_statement', 'itr', 'salary_slip', 'form_16', 'property_docs',
  'business_registration', 'gst_certificate', 'utility_bill', 'rent_agreement', 'other'
);

-- Create lead_applicants table
CREATE TABLE public.lead_applicants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  applicant_type public.applicant_type NOT NULL DEFAULT 'primary',
  name TEXT NOT NULL,
  relation_to_primary TEXT,
  pan_number TEXT,
  aadhar_number TEXT,
  phone TEXT,
  email TEXT,
  date_of_birth DATE,
  occupation TEXT,
  employer_name TEXT,
  monthly_income NUMERIC,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create applicant_addresses table
CREATE TABLE public.applicant_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  applicant_id UUID NOT NULL REFERENCES public.lead_applicants(id) ON DELETE CASCADE,
  address_type public.address_type NOT NULL DEFAULT 'residence',
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  landmark TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  latitude NUMERIC,
  longitude NUMERIC,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  years_at_address NUMERIC,
  ownership_type TEXT, -- owned, rented, family, company provided
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create applicant_documents table
CREATE TABLE public.applicant_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  applicant_id UUID NOT NULL REFERENCES public.lead_applicants(id) ON DELETE CASCADE,
  document_type public.document_type NOT NULL,
  document_number TEXT,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID,
  verified_at TIMESTAMP WITH TIME ZONE,
  verification_remarks TEXT,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_lead_applicants_lead_id ON public.lead_applicants(lead_id);
CREATE INDEX idx_lead_applicants_type ON public.lead_applicants(applicant_type);
CREATE INDEX idx_applicant_addresses_applicant_id ON public.applicant_addresses(applicant_id);
CREATE INDEX idx_applicant_addresses_pincode ON public.applicant_addresses(pincode);
CREATE INDEX idx_applicant_documents_applicant_id ON public.applicant_documents(applicant_id);
CREATE INDEX idx_applicant_documents_type ON public.applicant_documents(document_type);

-- Add updated_at triggers
CREATE TRIGGER update_lead_applicants_updated_at
  BEFORE UPDATE ON public.lead_applicants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_applicant_addresses_updated_at
  BEFORE UPDATE ON public.applicant_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE public.lead_applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicant_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicant_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lead_applicants (branch-based access via leads table)
CREATE POLICY "Users can view applicants for leads in their branch"
  ON public.lead_applicants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = lead_applicants.lead_id
      AND public.has_branch_access(auth.uid(), l.branch_id)
    )
  );

CREATE POLICY "Users can insert applicants for leads in their branch"
  ON public.lead_applicants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = lead_applicants.lead_id
      AND public.has_branch_access(auth.uid(), l.branch_id)
    )
  );

CREATE POLICY "Users can update applicants for leads in their branch"
  ON public.lead_applicants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = lead_applicants.lead_id
      AND public.has_branch_access(auth.uid(), l.branch_id)
    )
  );

CREATE POLICY "Users can delete applicants for leads in their branch"
  ON public.lead_applicants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = lead_applicants.lead_id
      AND public.has_branch_access(auth.uid(), l.branch_id)
    )
  );

-- RLS Policies for applicant_addresses (via applicants -> leads -> branch)
CREATE POLICY "Users can view addresses for applicants in their branch"
  ON public.applicant_addresses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lead_applicants la
      JOIN public.leads l ON l.id = la.lead_id
      WHERE la.id = applicant_addresses.applicant_id
      AND public.has_branch_access(auth.uid(), l.branch_id)
    )
  );

CREATE POLICY "Users can insert addresses for applicants in their branch"
  ON public.applicant_addresses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lead_applicants la
      JOIN public.leads l ON l.id = la.lead_id
      WHERE la.id = applicant_addresses.applicant_id
      AND public.has_branch_access(auth.uid(), l.branch_id)
    )
  );

CREATE POLICY "Users can update addresses for applicants in their branch"
  ON public.applicant_addresses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.lead_applicants la
      JOIN public.leads l ON l.id = la.lead_id
      WHERE la.id = applicant_addresses.applicant_id
      AND public.has_branch_access(auth.uid(), l.branch_id)
    )
  );

CREATE POLICY "Users can delete addresses for applicants in their branch"
  ON public.applicant_addresses FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.lead_applicants la
      JOIN public.leads l ON l.id = la.lead_id
      WHERE la.id = applicant_addresses.applicant_id
      AND public.has_branch_access(auth.uid(), l.branch_id)
    )
  );

-- RLS Policies for applicant_documents (via applicants -> leads -> branch)
CREATE POLICY "Users can view documents for applicants in their branch"
  ON public.applicant_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lead_applicants la
      JOIN public.leads l ON l.id = la.lead_id
      WHERE la.id = applicant_documents.applicant_id
      AND public.has_branch_access(auth.uid(), l.branch_id)
    )
  );

CREATE POLICY "Users can insert documents for applicants in their branch"
  ON public.applicant_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lead_applicants la
      JOIN public.leads l ON l.id = la.lead_id
      WHERE la.id = applicant_documents.applicant_id
      AND public.has_branch_access(auth.uid(), l.branch_id)
    )
  );

CREATE POLICY "Users can update documents for applicants in their branch"
  ON public.applicant_documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.lead_applicants la
      JOIN public.leads l ON l.id = la.lead_id
      WHERE la.id = applicant_documents.applicant_id
      AND public.has_branch_access(auth.uid(), l.branch_id)
    )
  );

CREATE POLICY "Users can delete documents for applicants in their branch"
  ON public.applicant_documents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.lead_applicants la
      JOIN public.leads l ON l.id = la.lead_id
      WHERE la.id = applicant_documents.applicant_id
      AND public.has_branch_access(auth.uid(), l.branch_id)
    )
  );

-- Create storage bucket for applicant documents if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('applicant-documents', 'applicant-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for applicant documents bucket
CREATE POLICY "Users can view applicant documents in their branch"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'applicant-documents'
  AND EXISTS (
    SELECT 1 FROM public.applicant_documents ad
    JOIN public.lead_applicants la ON la.id = ad.applicant_id
    JOIN public.leads l ON l.id = la.lead_id
    WHERE ad.storage_path = name
    AND public.has_branch_access(auth.uid(), l.branch_id)
  )
);

CREATE POLICY "Users can upload applicant documents in their branch"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'applicant-documents'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete applicant documents in their branch"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'applicant-documents'
  AND EXISTS (
    SELECT 1 FROM public.applicant_documents ad
    JOIN public.lead_applicants la ON la.id = ad.applicant_id
    JOIN public.leads l ON l.id = la.lead_id
    WHERE ad.storage_path = name
    AND public.has_branch_access(auth.uid(), l.branch_id)
  )
);