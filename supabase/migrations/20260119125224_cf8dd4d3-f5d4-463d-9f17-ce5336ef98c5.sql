-- Create storage bucket for task evidence if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task-evidence', 
  'task-evidence', 
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for task-evidence bucket
CREATE POLICY "Assigned users can upload evidence"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'task-evidence' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE (storage.foldername(name))[1] = t.id::text
    AND (t.assigned_to = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'qc'::public.app_role, 'ops_manager'::public.app_role]))
  )
);

CREATE POLICY "Users can view evidence for accessible tasks"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'task-evidence' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Admin and QC can delete evidence"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'task-evidence' AND
  public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'qc'::public.app_role, 'ops_manager'::public.app_role])
);

-- Add UPDATE policy for task_evidence table
CREATE POLICY "Admins and QC can update evidence validation"
ON public.task_evidence
FOR UPDATE
USING (
  public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'qc'::public.app_role, 'ops_manager'::public.app_role])
);

-- Add DELETE policy for task_evidence table
CREATE POLICY "Admins and QC can delete evidence"
ON public.task_evidence
FOR DELETE
USING (
  public.has_any_role(auth.uid(), ARRAY['admin'::public.app_role, 'qc'::public.app_role, 'ops_manager'::public.app_role])
);