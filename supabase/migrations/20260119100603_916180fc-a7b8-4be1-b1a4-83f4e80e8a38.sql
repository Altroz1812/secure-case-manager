
-- Phase 2: Standardized Verification Execution Framework

-- Create enum for verification method types
CREATE TYPE public.verification_method_type AS ENUM (
  'physical_visit',
  'telephonic',
  'video_call',
  'document_based',
  'api_check',
  'neighbor_check',
  'employer_check'
);

-- Create enum for observation tag categories
CREATE TYPE public.observation_category AS ENUM (
  'positive',
  'negative',
  'neutral',
  'discrepancy',
  'unverifiable'
);

-- Create enum for remark types
CREATE TYPE public.remark_type AS ENUM (
  'positive_confirmed',
  'negative_not_found',
  'negative_discrepancy',
  'negative_uncontactable',
  'refer_for_review',
  'partial_verification'
);

-- Create verification_methods master table
CREATE TABLE public.verification_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  method_type verification_method_type NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  applicable_verification_types verification_type[] NOT NULL DEFAULT '{}',
  is_field_method BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create verification_checklist_items table
CREATE TABLE public.verification_checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  verification_type verification_type NOT NULL,
  item_code TEXT NOT NULL,
  item_label TEXT NOT NULL,
  item_description TEXT,
  is_mandatory BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(verification_type, item_code)
);

-- Create observation_tags master table
CREATE TABLE public.observation_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tag_code TEXT NOT NULL UNIQUE,
  tag_label TEXT NOT NULL,
  category observation_category NOT NULL,
  applicable_verification_types verification_type[] NOT NULL DEFAULT '{}',
  severity_weight INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create remark_templates table
CREATE TABLE public.remark_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  verification_type verification_type NOT NULL,
  remark_type remark_type NOT NULL,
  template_text TEXT NOT NULL,
  requires_free_text BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create task_verification_data table to store structured verification findings
CREATE TABLE public.task_verification_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  verification_methods verification_method_type[] NOT NULL DEFAULT '{}',
  checklist_responses JSONB NOT NULL DEFAULT '{}',
  observation_tag_ids UUID[] NOT NULL DEFAULT '{}',
  remark_type remark_type,
  remark_template_id UUID REFERENCES public.remark_templates(id),
  structured_remark TEXT,
  free_text_remark TEXT,
  target_applicant_id UUID REFERENCES public.lead_applicants(id),
  target_address_id UUID REFERENCES public.applicant_addresses(id),
  verified_by UUID,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(task_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.verification_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.observation_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remark_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_verification_data ENABLE ROW LEVEL SECURITY;

-- RLS policies for verification_methods (read-only for all, admin manages)
CREATE POLICY "All can view verification methods"
  ON public.verification_methods FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage verification methods"
  ON public.verification_methods FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for verification_checklist_items
CREATE POLICY "All can view checklist items"
  ON public.verification_checklist_items FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage checklist items"
  ON public.verification_checklist_items FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for observation_tags
CREATE POLICY "All can view observation tags"
  ON public.observation_tags FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage observation tags"
  ON public.observation_tags FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for remark_templates
CREATE POLICY "All can view remark templates"
  ON public.remark_templates FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage remark templates"
  ON public.remark_templates FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for task_verification_data
CREATE POLICY "Users can view verification data for accessible tasks"
  ON public.task_verification_data FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_verification_data.task_id
      AND (
        has_branch_access(auth.uid(), t.branch_id)
        OR t.assigned_to = auth.uid()
        OR has_role(auth.uid(), 'admin'::app_role)
      )
    )
  );

CREATE POLICY "Assigned users and authorized roles can insert verification data"
  ON public.task_verification_data FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_verification_data.task_id
      AND (
        t.assigned_to = auth.uid()
        OR has_any_role(auth.uid(), ARRAY['admin'::app_role, 'qc'::app_role, 'ops_manager'::app_role])
      )
    )
  );

CREATE POLICY "Assigned users and authorized roles can update verification data"
  ON public.task_verification_data FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_verification_data.task_id
      AND (
        t.assigned_to = auth.uid()
        OR has_any_role(auth.uid(), ARRAY['admin'::app_role, 'qc'::app_role, 'ops_manager'::app_role])
      )
    )
  );

-- Insert default verification methods
INSERT INTO public.verification_methods (method_type, display_name, description, applicable_verification_types, is_field_method) VALUES
  ('physical_visit', 'Physical Visit', 'In-person verification at the location', ARRAY['residential', 'business', 'property', 'end_use']::verification_type[], true),
  ('telephonic', 'Telephonic Verification', 'Verification via phone call', ARRAY['profile', 'bgv', 'residential', 'business', 'bank', 'itr']::verification_type[], false),
  ('video_call', 'Video Call', 'Verification via video conference', ARRAY['profile', 'residential', 'business']::verification_type[], false),
  ('document_based', 'Document Based', 'Verification through document review', ARRAY['profile', 'bgv', 'itr', 'bank', 'property']::verification_type[], false),
  ('api_check', 'API/Database Check', 'Automated verification through external APIs', ARRAY['profile', 'bgv', 'bank', 'itr']::verification_type[], false),
  ('neighbor_check', 'Neighbor Check', 'Verification from neighbors', ARRAY['residential', 'business']::verification_type[], true),
  ('employer_check', 'Employer Check', 'Verification from employer/office', ARRAY['bgv', 'business']::verification_type[], true);

-- Insert default checklist items for residential verification
INSERT INTO public.verification_checklist_items (verification_type, item_code, item_label, item_description, is_mandatory, display_order) VALUES
  ('residential', 'RES_ADDR_MATCH', 'Address Matched', 'Verified address matches provided address', true, 1),
  ('residential', 'RES_OWNERSHIP', 'Ownership Verified', 'Property ownership or rental status confirmed', true, 2),
  ('residential', 'RES_OCCUPANCY', 'Occupancy Confirmed', 'Applicant residing at the address', true, 3),
  ('residential', 'RES_NEIGHBOR', 'Neighbor Confirmation', 'Neighbors confirm applicant residence', false, 4),
  ('residential', 'RES_UTILITY', 'Utility Bills Verified', 'Electricity/water bills in applicant name', false, 5),
  ('residential', 'RES_DURATION', 'Duration of Stay', 'Verified years of stay at address', false, 6);

-- Insert default checklist items for business verification
INSERT INTO public.verification_checklist_items (verification_type, item_code, item_label, item_description, is_mandatory, display_order) VALUES
  ('business', 'BUS_ADDR_MATCH', 'Business Address Matched', 'Verified address matches provided address', true, 1),
  ('business', 'BUS_EXISTENCE', 'Business Existence', 'Business is operational at location', true, 2),
  ('business', 'BUS_SIGNAGE', 'Signage/Board Present', 'Business name board visible', false, 3),
  ('business', 'BUS_ACTIVITY', 'Business Activity', 'Nature of business verified', true, 4),
  ('business', 'BUS_EMPLOYEES', 'Employees Present', 'Staff/employees observed at location', false, 5),
  ('business', 'BUS_STOCK', 'Stock/Inventory', 'Business stock/inventory verified', false, 6);

-- Insert default checklist items for property verification
INSERT INTO public.verification_checklist_items (verification_type, item_code, item_label, item_description, is_mandatory, display_order) VALUES
  ('property', 'PROP_LOCATION', 'Property Location', 'Property located as per documents', true, 1),
  ('property', 'PROP_BOUNDARY', 'Boundary Verification', 'Property boundaries match documents', true, 2),
  ('property', 'PROP_CONSTRUCTION', 'Construction Status', 'Current construction stage verified', true, 3),
  ('property', 'PROP_ENCUMBRANCE', 'Encumbrance Check', 'No visible encumbrances on property', false, 4),
  ('property', 'PROP_ACCESS', 'Access Road', 'Proper road access to property', false, 5);

-- Insert default checklist items for BGV
INSERT INTO public.verification_checklist_items (verification_type, item_code, item_label, item_description, is_mandatory, display_order) VALUES
  ('bgv', 'BGV_IDENTITY', 'Identity Verified', 'Identity documents verified', true, 1),
  ('bgv', 'BGV_EDUCATION', 'Education Verified', 'Educational qualifications verified', false, 2),
  ('bgv', 'BGV_EMPLOYMENT', 'Employment Verified', 'Current/previous employment verified', true, 3),
  ('bgv', 'BGV_CRIMINAL', 'Criminal Check', 'No criminal records found', false, 4),
  ('bgv', 'BGV_REFERENCE', 'Reference Check', 'References contacted and verified', false, 5);

-- Insert default observation tags
INSERT INTO public.observation_tags (tag_code, tag_label, category, applicable_verification_types, severity_weight) VALUES
  ('POSITIVE_CONFIRMED', 'Verified & Confirmed', 'positive', ARRAY['residential', 'business', 'property', 'bgv', 'profile', 'itr', 'bank', 'end_use']::verification_type[], 0),
  ('POSITIVE_COOPERATIVE', 'Applicant Cooperative', 'positive', ARRAY['residential', 'business', 'bgv']::verification_type[], 0),
  ('NEGATIVE_NOT_FOUND', 'Address Not Found', 'negative', ARRAY['residential', 'business', 'property']::verification_type[], 80),
  ('NEGATIVE_LOCKED', 'Premises Locked', 'negative', ARRAY['residential', 'business']::verification_type[], 40),
  ('NEGATIVE_REFUSED', 'Verification Refused', 'negative', ARRAY['residential', 'business', 'bgv']::verification_type[], 70),
  ('DISCREPANCY_ADDRESS', 'Address Mismatch', 'discrepancy', ARRAY['residential', 'business', 'property']::verification_type[], 60),
  ('DISCREPANCY_NAME', 'Name Mismatch', 'discrepancy', ARRAY['residential', 'business', 'bgv']::verification_type[], 50),
  ('DISCREPANCY_DOCS', 'Document Discrepancy', 'discrepancy', ARRAY['bgv', 'itr', 'bank', 'property']::verification_type[], 55),
  ('UNVERIFIABLE_ACCESS', 'Location Inaccessible', 'unverifiable', ARRAY['residential', 'business', 'property']::verification_type[], 45),
  ('UNVERIFIABLE_CONTACT', 'Not Contactable', 'unverifiable', ARRAY['residential', 'business', 'bgv']::verification_type[], 50),
  ('NEUTRAL_TENANT', 'Tenant Verification', 'neutral', ARRAY['residential']::verification_type[], 10),
  ('NEUTRAL_RENTED', 'Rented Premises', 'neutral', ARRAY['business']::verification_type[], 10);

-- Insert default remark templates
INSERT INTO public.remark_templates (verification_type, remark_type, template_text, requires_free_text) VALUES
  ('residential', 'positive_confirmed', 'Residential address verified. Applicant residing at the given address. All checks positive.', false),
  ('residential', 'negative_not_found', 'Address not found or does not exist. Unable to verify residence.', true),
  ('residential', 'negative_discrepancy', 'Discrepancy found during verification. Details require attention.', true),
  ('residential', 'negative_uncontactable', 'Applicant not available/contactable at the given address after multiple attempts.', true),
  ('residential', 'refer_for_review', 'Verification completed with observations. Refer for senior review.', true),
  ('business', 'positive_confirmed', 'Business address verified. Business operational at the given address.', false),
  ('business', 'negative_not_found', 'Business not found at the given address.', true),
  ('business', 'negative_discrepancy', 'Business exists but discrepancies found in provided information.', true),
  ('property', 'positive_confirmed', 'Property verified as per documents. Location and boundaries confirmed.', false),
  ('property', 'negative_discrepancy', 'Property verification shows discrepancies with provided documents.', true),
  ('bgv', 'positive_confirmed', 'Background verification completed. All checks positive.', false),
  ('bgv', 'negative_discrepancy', 'Discrepancies found in background information.', true);

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION public.update_verification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_verification_methods_updated_at
  BEFORE UPDATE ON public.verification_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_verification_updated_at();

CREATE TRIGGER update_verification_checklist_items_updated_at
  BEFORE UPDATE ON public.verification_checklist_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_verification_updated_at();

CREATE TRIGGER update_observation_tags_updated_at
  BEFORE UPDATE ON public.observation_tags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_verification_updated_at();

CREATE TRIGGER update_remark_templates_updated_at
  BEFORE UPDATE ON public.remark_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_verification_updated_at();

CREATE TRIGGER update_task_verification_data_updated_at
  BEFORE UPDATE ON public.task_verification_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_verification_updated_at();
