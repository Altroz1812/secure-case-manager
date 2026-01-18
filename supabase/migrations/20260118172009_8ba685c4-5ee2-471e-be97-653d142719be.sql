-- Create storage bucket for client documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-documents', 'client-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create table to track client uploaded documents
CREATE TABLE IF NOT EXISTS public.client_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  storage_path TEXT NOT NULL,
  document_type TEXT, -- e.g., 'id_proof', 'address_proof', 'income_proof', 'other'
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Users with client_viewer role can view documents for leads belonging to their assigned clients
CREATE POLICY "Client viewers can view their client documents"
ON public.client_documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.leads l
    JOIN public.client_user_assignments cua ON cua.client_id = l.client_id
    WHERE l.id = client_documents.lead_id
    AND cua.user_id = auth.uid()
  )
);

-- Policy: Users with client_viewer role can upload documents for leads belonging to their assigned clients
CREATE POLICY "Client viewers can upload documents for their clients"
ON public.client_documents
FOR INSERT
WITH CHECK (
  auth.uid() = uploaded_by
  AND EXISTS (
    SELECT 1 FROM public.leads l
    JOIN public.client_user_assignments cua ON cua.client_id = l.client_id
    WHERE l.id = client_documents.lead_id
    AND cua.user_id = auth.uid()
  )
);

-- Storage policies for client-documents bucket
CREATE POLICY "Client viewers can upload to client-documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'client-documents'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Client viewers can view their client documents in storage"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'client-documents'
  AND auth.role() = 'authenticated'
);

-- Add index for faster lookups
CREATE INDEX idx_client_documents_lead_id ON public.client_documents(lead_id);