-- Create table to store user screen/page permissions
CREATE TABLE public.user_screen_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  screen_path TEXT NOT NULL,
  screen_name TEXT NOT NULL,
  is_allowed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, screen_path)
);

-- Enable RLS
ALTER TABLE public.user_screen_permissions ENABLE ROW LEVEL SECURITY;

-- Admin can manage all permissions
CREATE POLICY "Admins can manage all screen permissions"
  ON public.user_screen_permissions
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Users can read their own permissions
CREATE POLICY "Users can read their own permissions"
  ON public.user_screen_permissions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_screen_permissions_updated_at
  BEFORE UPDATE ON public.user_screen_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create helper function to check screen access
CREATE OR REPLACE FUNCTION public.has_screen_access(_user_id UUID, _screen_path TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_allowed FROM public.user_screen_permissions 
     WHERE user_id = _user_id AND screen_path = _screen_path),
    true  -- Default to allowed if no specific permission exists
  )
$$;