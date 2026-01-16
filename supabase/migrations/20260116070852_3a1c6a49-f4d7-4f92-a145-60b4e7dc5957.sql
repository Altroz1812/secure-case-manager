-- Create table for storing generated reports with version tracking
CREATE TABLE public.generated_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id),
  lead_id UUID REFERENCES public.leads(id),
  report_type TEXT NOT NULL CHECK (report_type IN ('task_verification', 'lead_consolidated')),
  version INTEGER NOT NULL DEFAULT 1,
  report_data JSONB NOT NULL,
  storage_path TEXT,
  generated_by UUID NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for client-specific report configurations
CREATE TABLE public.client_report_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('verification_report', 'consolidated_report', 'mis_report')),
  config_name TEXT NOT NULL,
  template_config JSONB NOT NULL DEFAULT '{}',
  header_config JSONB DEFAULT '{}',
  field_mappings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, report_type, config_name)
);

-- Enable RLS
ALTER TABLE public.generated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_report_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for generated_reports
CREATE POLICY "Users with branch access can view reports"
ON public.generated_reports
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_any_role(auth.uid(), ARRAY['ops_manager', 'qc', 'client_viewer']::public.app_role[])
);

CREATE POLICY "Authorized users can create reports"
ON public.generated_reports
FOR INSERT
WITH CHECK (
  auth.uid() = generated_by AND
  public.has_any_role(auth.uid(), ARRAY['admin', 'ops_manager', 'qc', 'analyst']::public.app_role[])
);

-- RLS Policies for client_report_configs
CREATE POLICY "Admin and ops_manager can view report configs"
ON public.client_report_configs
FOR SELECT
USING (
  public.has_any_role(auth.uid(), ARRAY['admin', 'ops_manager']::public.app_role[])
);

CREATE POLICY "Admin can manage report configs"
ON public.client_report_configs
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_client_report_configs_updated_at
BEFORE UPDATE ON public.client_report_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_generated_reports_task ON public.generated_reports(task_id);
CREATE INDEX idx_generated_reports_lead ON public.generated_reports(lead_id);
CREATE INDEX idx_client_report_configs_client ON public.client_report_configs(client_id);