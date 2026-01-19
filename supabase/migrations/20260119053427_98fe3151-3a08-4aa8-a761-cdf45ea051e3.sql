-- Phase 1: Email Intake Enhancements
-- Add recipient_email column to emails table for auto-mapping
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS recipient_email text;

-- Add branch_email column to branches table for email-to-branch mapping
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS branch_email text;

-- Create function to auto-map emails to branches by recipient address
CREATE OR REPLACE FUNCTION public.get_branch_by_email(_recipient_email text)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id FROM public.branches 
  WHERE branch_email = _recipient_email AND is_active = true
  LIMIT 1
$$;

-- Phase 3: Deduplication Logic
-- Create lead_duplicates table to track potential duplicates
CREATE TABLE IF NOT EXISTS public.lead_duplicates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  duplicate_lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  match_type text NOT NULL, -- 'application_number', 'applicant_name', 'time_window'
  match_score numeric DEFAULT 0,
  is_overridden boolean DEFAULT false,
  override_reason text,
  overridden_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on lead_duplicates
ALTER TABLE public.lead_duplicates ENABLE ROW LEVEL SECURITY;

-- RLS policies for lead_duplicates
CREATE POLICY "Intake and admin can view duplicates"
ON public.lead_duplicates FOR SELECT
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'intake'::app_role, 'ops_manager'::app_role]));

CREATE POLICY "Intake and admin can manage duplicates"
ON public.lead_duplicates FOR ALL
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'intake'::app_role]));

-- Create function to check for duplicate leads
CREATE OR REPLACE FUNCTION public.check_lead_duplicates(
  _client_id uuid,
  _applicant_name text,
  _application_number text DEFAULT NULL,
  _time_window_hours integer DEFAULT 24
)
RETURNS TABLE(
  lead_id uuid,
  lead_number text,
  applicant_name text,
  application_number text,
  match_type text,
  match_score numeric,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id as lead_id,
    l.lead_number,
    l.applicant_name,
    l.application_number,
    CASE 
      WHEN _application_number IS NOT NULL AND l.application_number = _application_number THEN 'application_number'
      WHEN LOWER(TRIM(l.applicant_name)) = LOWER(TRIM(_applicant_name)) THEN 'applicant_name'
      WHEN l.created_at >= (now() - (_time_window_hours || ' hours')::interval) 
           AND similarity(LOWER(TRIM(l.applicant_name)), LOWER(TRIM(_applicant_name))) > 0.6 THEN 'time_window'
      ELSE 'unknown'
    END as match_type,
    CASE 
      WHEN _application_number IS NOT NULL AND l.application_number = _application_number THEN 1.0
      WHEN LOWER(TRIM(l.applicant_name)) = LOWER(TRIM(_applicant_name)) THEN 0.9
      ELSE similarity(LOWER(TRIM(l.applicant_name)), LOWER(TRIM(_applicant_name)))
    END as match_score,
    l.created_at
  FROM public.leads l
  WHERE l.client_id = _client_id
    AND (
      -- Exact application number match
      (_application_number IS NOT NULL AND l.application_number = _application_number)
      -- Exact applicant name match
      OR LOWER(TRIM(l.applicant_name)) = LOWER(TRIM(_applicant_name))
      -- Fuzzy match within time window
      OR (
        l.created_at >= (now() - (_time_window_hours || ' hours')::interval)
        AND similarity(LOWER(TRIM(l.applicant_name)), LOWER(TRIM(_applicant_name))) > 0.6
      )
    )
  ORDER BY match_score DESC;
END;
$$;

-- Enable pg_trgm extension for fuzzy matching (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Phase 2: Client Portal Lead Creation - Update RLS policies
-- Allow client_viewer to create leads for their assigned clients
CREATE POLICY "Client viewers can create leads for assigned clients"
ON public.leads FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'client_viewer'::app_role) 
  AND has_client_access(auth.uid(), client_id)
  AND created_by = auth.uid()
);

-- Allow client_viewer to create tasks for leads they created
CREATE POLICY "Client viewers can create tasks for their leads"
ON public.tasks FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'client_viewer'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.leads l
    WHERE l.id = lead_id 
    AND l.created_by = auth.uid()
    AND has_client_access(auth.uid(), l.client_id)
  )
);

-- Create client_products table to restrict products for clients
CREATE TABLE IF NOT EXISTS public.client_products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(client_id, product_id)
);

-- Enable RLS on client_products
ALTER TABLE public.client_products ENABLE ROW LEVEL SECURITY;

-- RLS policies for client_products
CREATE POLICY "Admins can manage client products"
ON public.client_products FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "All can view client products"
ON public.client_products FOR SELECT
USING (true);