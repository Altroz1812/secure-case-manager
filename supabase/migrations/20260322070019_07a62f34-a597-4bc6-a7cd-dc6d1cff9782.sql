
-- Create fe_response enum
CREATE TYPE public.fe_response_type AS ENUM ('accepted', 'sent_back');

-- Add columns to tasks table
ALTER TABLE public.tasks 
  ADD COLUMN IF NOT EXISTS fe_response public.fe_response_type,
  ADD COLUMN IF NOT EXISTS send_back_reason text,
  ADD COLUMN IF NOT EXISTS geo_limit text,
  ADD COLUMN IF NOT EXISTS fe_code text;

-- Add category to leads table
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS category text;

-- Create bulk_uploads table
CREATE TABLE public.bulk_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by uuid NOT NULL,
  file_name text NOT NULL,
  total_rows integer NOT NULL DEFAULT 0,
  processed_rows integer NOT NULL DEFAULT 0,
  failed_rows integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  error_log jsonb DEFAULT '[]'::jsonb,
  branch_id uuid REFERENCES public.branches(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bulk_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and ops can manage bulk uploads"
  ON public.bulk_uploads FOR ALL TO authenticated
  USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'ops_manager'::app_role]));

CREATE POLICY "Users can view own bulk uploads"
  ON public.bulk_uploads FOR SELECT TO authenticated
  USING (uploaded_by = auth.uid());

-- Create case_field_data table
CREATE TABLE public.case_field_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  field_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  form_type text NOT NULL DEFAULT 'BV',
  submitted_at timestamptz,
  submitted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(task_id)
);

ALTER TABLE public.case_field_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Assigned users can manage their case field data"
  ON public.case_field_data FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks t 
      WHERE t.id = case_field_data.task_id 
      AND (t.assigned_to = auth.uid() OR has_any_role(auth.uid(), ARRAY['admin'::app_role, 'qc'::app_role, 'ops_manager'::app_role]))
    )
  );

CREATE POLICY "View case field data for accessible tasks"
  ON public.case_field_data FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks t 
      WHERE t.id = case_field_data.task_id 
      AND (has_branch_access(auth.uid(), t.branch_id) OR t.assigned_to = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

-- Trigger for updated_at on case_field_data
CREATE TRIGGER update_case_field_data_updated_at
  BEFORE UPDATE ON public.case_field_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
