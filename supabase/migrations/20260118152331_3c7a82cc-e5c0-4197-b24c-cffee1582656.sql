-- Create table to link client_viewer users to their clients
CREATE TABLE public.client_user_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, client_id)
);

-- Enable RLS
ALTER TABLE public.client_user_assignments ENABLE ROW LEVEL SECURITY;

-- Admins can manage all assignments
CREATE POLICY "Admins can manage client user assignments"
ON public.client_user_assignments
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Users can see their own assignments
CREATE POLICY "Users can view their own client assignments"
ON public.client_user_assignments
FOR SELECT
USING (auth.uid() = user_id);

-- Create function to get user's assigned clients
CREATE OR REPLACE FUNCTION public.get_user_clients(_user_id UUID)
RETURNS UUID[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY_AGG(client_id)
  FROM public.client_user_assignments
  WHERE user_id = _user_id
$$;

-- Create function to check if user has access to a client
CREATE OR REPLACE FUNCTION public.has_client_access(_user_id UUID, _client_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.client_user_assignments
    WHERE user_id = _user_id AND client_id = _client_id
  ) OR public.has_role(_user_id, 'admin')
$$;

-- Add RLS policy for clients table - client viewers can see their assigned clients
CREATE POLICY "Client viewers can view assigned clients"
ON public.clients
FOR SELECT
USING (
  public.has_role(auth.uid(), 'client_viewer') 
  AND public.has_client_access(auth.uid(), id)
);

-- Add RLS policy for leads - client viewers can see leads for their clients
CREATE POLICY "Client viewers can view leads for assigned clients"
ON public.leads
FOR SELECT
USING (
  public.has_role(auth.uid(), 'client_viewer') 
  AND public.has_client_access(auth.uid(), client_id)
);

-- Add RLS policy for tasks - client viewers can see tasks for their client's leads
CREATE POLICY "Client viewers can view tasks for assigned clients"
ON public.tasks
FOR SELECT
USING (
  public.has_role(auth.uid(), 'client_viewer') 
  AND EXISTS (
    SELECT 1 FROM public.leads l 
    WHERE l.id = lead_id 
    AND public.has_client_access(auth.uid(), l.client_id)
  )
);

-- Add RLS policy for generated_reports - client viewers can see reports for their client's leads
CREATE POLICY "Client viewers can view reports for assigned clients"
ON public.generated_reports
FOR SELECT
USING (
  public.has_role(auth.uid(), 'client_viewer') 
  AND EXISTS (
    SELECT 1 FROM public.leads l 
    WHERE l.id = lead_id 
    AND public.has_client_access(auth.uid(), l.client_id)
  )
);