-- Add validation fields to task_evidence table
ALTER TABLE public.task_evidence 
ADD COLUMN IF NOT EXISTS is_validated boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS validation_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS validation_errors text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS exif_data jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS address_watermark text,
ADD COLUMN IF NOT EXISTS geo_deviation_meters numeric,
ADD COLUMN IF NOT EXISTS expected_latitude numeric,
ADD COLUMN IF NOT EXISTS expected_longitude numeric,
ADD COLUMN IF NOT EXISTS geo_deviation_flagged boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS validated_at timestamptz,
ADD COLUMN IF NOT EXISTS validated_by uuid;

-- Create evidence validation audit table
CREATE TABLE IF NOT EXISTS public.evidence_validation_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  evidence_id uuid NOT NULL REFERENCES public.task_evidence(id) ON DELETE CASCADE,
  validation_type text NOT NULL,
  passed boolean NOT NULL,
  details jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on evidence_validation_logs
ALTER TABLE public.evidence_validation_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for evidence_validation_logs
CREATE POLICY "Users can view evidence validation logs for accessible tasks"
ON public.evidence_validation_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.task_evidence te
    JOIN public.tasks t ON te.task_id = t.id
    WHERE te.id = evidence_validation_logs.evidence_id
    AND public.has_branch_access(t.branch_id, auth.uid())
  )
);

CREATE POLICY "Authenticated users can create validation logs"
ON public.evidence_validation_logs
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_task_evidence_task_id ON public.task_evidence(task_id);
CREATE INDEX IF NOT EXISTS idx_task_evidence_validation_status ON public.task_evidence(validation_status);
CREATE INDEX IF NOT EXISTS idx_evidence_validation_logs_evidence_id ON public.evidence_validation_logs(evidence_id);