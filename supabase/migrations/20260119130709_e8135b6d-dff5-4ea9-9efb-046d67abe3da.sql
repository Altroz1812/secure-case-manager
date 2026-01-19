
-- Fix the check_lead_duplicates function to return numeric instead of real
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
SET search_path = public
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
      WHEN _application_number IS NOT NULL AND l.application_number = _application_number THEN 1.0::numeric
      WHEN LOWER(TRIM(l.applicant_name)) = LOWER(TRIM(_applicant_name)) THEN 0.9::numeric
      ELSE similarity(LOWER(TRIM(l.applicant_name)), LOWER(TRIM(_applicant_name)))::numeric
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
