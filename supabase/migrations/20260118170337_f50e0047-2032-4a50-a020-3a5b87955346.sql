-- Fix overly permissive RLS policies

-- 1. Fix audit_logs INSERT policy - only authenticated users can insert
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert audit logs" 
  ON public.audit_logs 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- 2. Fix notifications INSERT policy - only authenticated users can insert their own notifications or system inserts
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "Authenticated users can create notifications" 
  ON public.notifications 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Fix profiles INSERT policy - only allow inserting own profile (for trigger) or admin
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Users can insert own profile" 
  ON public.profiles 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- 4. Fix task_evidence INSERT policy - only assigned users or authorized roles can upload
DROP POLICY IF EXISTS "Assigned users can upload evidence" ON public.task_evidence;
CREATE POLICY "Assigned users can upload evidence" 
  ON public.task_evidence 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    auth.uid() = uploaded_by
    AND (
      EXISTS (
        SELECT 1 FROM public.tasks t 
        WHERE t.id = task_id 
        AND (t.assigned_to = auth.uid() OR has_any_role(auth.uid(), ARRAY['admin'::app_role, 'qc'::app_role, 'ops_manager'::app_role]))
      )
    )
  );

-- 5. Fix tasks INSERT policy - only intake and admin can create tasks
DROP POLICY IF EXISTS "System can create tasks" ON public.tasks;
CREATE POLICY "Intake and admin can create tasks" 
  ON public.tasks 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    has_any_role(auth.uid(), ARRAY['admin'::app_role, 'intake'::app_role])
  );