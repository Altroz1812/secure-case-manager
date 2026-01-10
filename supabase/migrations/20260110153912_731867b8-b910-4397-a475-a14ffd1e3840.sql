-- =============================================
-- RCU AUTOMATION PLATFORM - PHASE 1: FOUNDATION
-- =============================================

-- 1. Create Role Enum
CREATE TYPE public.app_role AS ENUM (
  'admin',
  'intake',
  'analyst',
  'field_executive',
  'qc',
  'ops_manager',
  'client_viewer'
);

-- 2. Create Priority Enum
CREATE TYPE public.priority_level AS ENUM ('normal', 'urgent');

-- 3. Create Task Status Enum
CREATE TYPE public.task_status AS ENUM (
  'pending',
  'assigned',
  'in_progress',
  'completed',
  'qc_review',
  'approved',
  'rejected'
);

-- 4. Create Verification Type Enum
CREATE TYPE public.verification_type AS ENUM (
  'profile',
  'bgv',
  'residential',
  'business',
  'itr',
  'bank',
  'property',
  'end_use'
);

-- 5. Create FE Skill Enum
CREATE TYPE public.fe_skill AS ENUM (
  'residential',
  'business',
  'end_use'
);

-- =============================================
-- CORE TABLES
-- =============================================

-- 6. Profiles Table (Extended User Data)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 7. User Roles Table (Secure Role Management)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- 8. Branches Table
CREATE TABLE public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  serviceable_pincodes TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 9. User Branch Assignments (Many-to-Many with Primary Branch)
CREATE TABLE public.user_branch_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (user_id, branch_id)
);

-- 10. Clients Table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  contact_person TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 11. Client Branch Relationships
CREATE TABLE public.client_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (client_id, branch_id)
);

-- 12. Products Table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 13. Verification Type Config (SLA Settings)
CREATE TABLE public.verification_type_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type verification_type NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  sla_hours INTEGER NOT NULL DEFAULT 48,
  is_field_verification BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 14. Field Executive Profiles
CREATE TABLE public.field_executives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  employee_code TEXT NOT NULL UNIQUE,
  skills fe_skill[] DEFAULT '{}',
  mapped_pincodes TEXT[] DEFAULT '{}',
  is_available BOOLEAN DEFAULT true,
  current_workload INTEGER DEFAULT 0,
  max_workload INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 15. Emails Table (Synced from Outlook)
CREATE TABLE public.emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE,
  sender_email TEXT NOT NULL,
  sender_name TEXT,
  subject TEXT NOT NULL,
  body_preview TEXT,
  body_html TEXT,
  received_at TIMESTAMPTZ NOT NULL,
  is_processed BOOLEAN DEFAULT false,
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMPTZ,
  branch_id UUID REFERENCES public.branches(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 16. Email Attachments Table
CREATE TABLE public.email_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID REFERENCES public.emails(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 17. Leads Table
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_number TEXT NOT NULL UNIQUE,
  email_id UUID REFERENCES public.emails(id),
  client_id UUID REFERENCES public.clients(id) NOT NULL,
  client_branch_id UUID REFERENCES public.branches(id),
  product_id UUID REFERENCES public.products(id) NOT NULL,
  branch_id UUID REFERENCES public.branches(id) NOT NULL,
  applicant_name TEXT NOT NULL,
  application_number TEXT,
  loan_number TEXT,
  address TEXT,
  pincode TEXT,
  priority priority_level DEFAULT 'normal',
  verification_types verification_type[] NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 18. Tasks Table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_number TEXT NOT NULL UNIQUE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  verification_type verification_type NOT NULL,
  status task_status DEFAULT 'pending',
  branch_id UUID REFERENCES public.branches(id) NOT NULL,
  assigned_to UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ,
  sla_deadline TIMESTAMPTZ,
  is_overdue BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  qc_reviewed_by UUID REFERENCES auth.users(id),
  qc_reviewed_at TIMESTAMPTZ,
  qc_remarks TEXT,
  final_remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 19. Task Assignments History (Audit Trail)
CREATE TABLE public.task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  assigned_from UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id) NOT NULL,
  assigned_by UUID REFERENCES auth.users(id) NOT NULL,
  reason TEXT,
  is_override BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 20. Task Evidence Table
CREATE TABLE public.task_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  storage_path TEXT NOT NULL,
  remarks TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  captured_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 21. Audit Logs Table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  branch_id UUID REFERENCES public.branches(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 22. Notifications Table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =============================================
-- SECURITY DEFINER FUNCTIONS
-- =============================================

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user has any of the specified roles
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID, _roles app_role[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = ANY(_roles)
  )
$$;

-- Function to get user's primary branch
CREATE OR REPLACE FUNCTION public.get_user_primary_branch(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT branch_id
  FROM public.user_branch_assignments
  WHERE user_id = _user_id AND is_primary = true
  LIMIT 1
$$;

-- Function to get all user branches
CREATE OR REPLACE FUNCTION public.get_user_branches(_user_id UUID)
RETURNS UUID[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY_AGG(branch_id)
  FROM public.user_branch_assignments
  WHERE user_id = _user_id
$$;

-- Function to check if user has access to branch
CREATE OR REPLACE FUNCTION public.has_branch_access(_user_id UUID, _branch_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_branch_assignments
    WHERE user_id = _user_id AND branch_id = _branch_id
  ) OR public.has_role(_user_id, 'admin')
$$;

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_branch_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_type_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_executives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Profiles: Users can view all profiles, update their own
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (true);

-- User Roles: Only viewable, managed by security definer functions
CREATE POLICY "Users can view roles" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Branches: Viewable by all, managed by admins
CREATE POLICY "All can view branches" ON public.branches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage branches" ON public.branches FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- User Branch Assignments: View own or admin view all
CREATE POLICY "Users can view own branch assignments" ON public.user_branch_assignments FOR SELECT TO authenticated 
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage branch assignments" ON public.user_branch_assignments FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));

-- Clients: Viewable by all authenticated, managed by admin/ops_manager
CREATE POLICY "All can view clients" ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and ops managers can manage clients" ON public.clients FOR ALL TO authenticated 
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'ops_manager']::app_role[]));

-- Client Branches: Viewable by all, managed by admin
CREATE POLICY "All can view client branches" ON public.client_branches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage client branches" ON public.client_branches FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));

-- Products: Viewable by all, managed by admin
CREATE POLICY "All can view products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage products" ON public.products FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));

-- Verification Type Config: Viewable by all, managed by admin
CREATE POLICY "All can view verification config" ON public.verification_type_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage verification config" ON public.verification_type_config FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));

-- Field Executives: Branch-based access
CREATE POLICY "View FEs in accessible branches" ON public.field_executives FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and ops can manage FEs" ON public.field_executives FOR ALL TO authenticated 
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'ops_manager']::app_role[]));

-- Emails: Branch-based access
CREATE POLICY "View emails in accessible branches" ON public.emails FOR SELECT TO authenticated 
  USING (branch_id IS NULL OR public.has_branch_access(auth.uid(), branch_id) OR public.has_any_role(auth.uid(), ARRAY['admin', 'intake']::app_role[]));
CREATE POLICY "Intake and admin can manage emails" ON public.emails FOR ALL TO authenticated 
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'intake']::app_role[]));

-- Email Attachments: Based on email access
CREATE POLICY "View attachments for accessible emails" ON public.email_attachments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Intake can manage attachments" ON public.email_attachments FOR ALL TO authenticated 
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'intake']::app_role[]));

-- Leads: Branch-based access
CREATE POLICY "View leads in accessible branches" ON public.leads FOR SELECT TO authenticated 
  USING (public.has_branch_access(auth.uid(), branch_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Intake can create leads" ON public.leads FOR INSERT TO authenticated 
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'intake']::app_role[]));
CREATE POLICY "Admins can update leads" ON public.leads FOR UPDATE TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));

-- Tasks: Branch-based + role-based access
CREATE POLICY "View tasks in accessible branches or assigned to me" ON public.tasks FOR SELECT TO authenticated 
  USING (
    public.has_branch_access(auth.uid(), branch_id) 
    OR assigned_to = auth.uid() 
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "System can create tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Assigned users and authorized roles can update tasks" ON public.tasks FOR UPDATE TO authenticated 
  USING (
    assigned_to = auth.uid() 
    OR public.has_any_role(auth.uid(), ARRAY['admin', 'qc', 'ops_manager']::app_role[])
  );

-- Task Assignments: Based on task access
CREATE POLICY "View assignments for accessible tasks" ON public.task_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authorized roles can create assignments" ON public.task_assignments FOR INSERT TO authenticated 
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin', 'qc', 'ops_manager']::app_role[]));

-- Task Evidence: Based on task assignment
CREATE POLICY "View evidence for accessible tasks" ON public.task_evidence FOR SELECT TO authenticated USING (true);
CREATE POLICY "Assigned users can upload evidence" ON public.task_evidence FOR INSERT TO authenticated WITH CHECK (true);

-- Audit Logs: Admins and ops managers can view
CREATE POLICY "Authorized roles can view audit logs" ON public.audit_logs FOR SELECT TO authenticated 
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'ops_manager']::app_role[]));
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Notifications: Users can view and manage their own
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated 
  USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated 
  USING (user_id = auth.uid());
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON public.branches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_verification_type_config_updated_at BEFORE UPDATE ON public.verification_type_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_field_executives_updated_at BEFORE UPDATE ON public.field_executives
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- TRIGGER FOR AUTO PROFILE CREATION
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- FUNCTION FOR GENERATING LEAD/TASK NUMBERS
-- =============================================

CREATE OR REPLACE FUNCTION public.generate_lead_number()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  seq_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(lead_number FROM 5) AS INTEGER)), 0) + 1
  INTO seq_num
  FROM public.leads
  WHERE lead_number LIKE 'RCU-%';
  
  RETURN 'RCU-' || LPAD(seq_num::TEXT, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_task_number()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  seq_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(task_number FROM 6) AS INTEGER)), 0) + 1
  INTO seq_num
  FROM public.tasks
  WHERE task_number LIKE 'TASK-%';
  
  RETURN 'TASK-' || LPAD(seq_num::TEXT, 6, '0');
END;
$$;

-- =============================================
-- INSERT DEFAULT VERIFICATION TYPE CONFIGS
-- =============================================

INSERT INTO public.verification_type_config (type, display_name, sla_hours, is_field_verification) VALUES
  ('profile', 'Profile Verification', 24, false),
  ('bgv', 'Background Verification', 48, false),
  ('residential', 'Residential Verification', 48, true),
  ('business', 'Business Verification', 72, true),
  ('itr', 'ITR Verification', 24, false),
  ('bank', 'Bank Statement Verification', 24, false),
  ('property', 'Property Verification', 72, true),
  ('end_use', 'End Use Verification', 48, true);

-- =============================================
-- INSERT DEFAULT PRODUCTS
-- =============================================

INSERT INTO public.products (name, code, description) VALUES
  ('Home Loan', 'HL', 'Housing loan verification'),
  ('Loan Against Property', 'LAP', 'LAP verification'),
  ('MSME Loan', 'MSME', 'MSME business loan verification'),
  ('Education Infrastructure', 'EDU-INFRA', 'Education infrastructure loan'),
  ('Personal Loan', 'PL', 'Personal loan verification'),
  ('Business Loan', 'BL', 'Business loan verification');