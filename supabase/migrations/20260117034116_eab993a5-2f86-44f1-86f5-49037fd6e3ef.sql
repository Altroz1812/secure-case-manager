-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email_enabled BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,
  whatsapp_enabled BOOLEAN DEFAULT false,
  sms_enabled BOOLEAN DEFAULT false,
  task_assignment_enabled BOOLEAN DEFAULT true,
  sla_warning_enabled BOOLEAN DEFAULT true,
  reassignment_enabled BOOLEAN DEFAULT true,
  qc_result_enabled BOOLEAN DEFAULT true,
  daily_digest_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create notification templates table for WhatsApp/SMS
CREATE TABLE public.notification_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'sms', 'email')),
  template_code TEXT, -- External template ID (e.g., WhatsApp Business API template ID)
  subject TEXT,
  body_template TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(template_name, channel)
);

-- Create message queue for delivery tracking
CREATE TABLE public.message_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID REFERENCES public.notifications(id) ON DELETE SET NULL,
  template_id UUID REFERENCES public.notification_templates(id) ON DELETE SET NULL,
  recipient_user_id UUID NOT NULL,
  recipient_phone TEXT,
  recipient_email TEXT,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'sms', 'email', 'in_app')),
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'read')),
  external_message_id TEXT,
  error_message TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_queue ENABLE ROW LEVEL SECURITY;

-- RLS for notification_preferences
CREATE POLICY "Users can view their own preferences"
  ON public.notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS for notification_templates (admin only)
CREATE POLICY "Admins can manage templates"
  ON public.notification_templates FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "All authenticated can view templates"
  ON public.notification_templates FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- RLS for message_queue
CREATE POLICY "Users can view their own messages"
  ON public.message_queue FOR SELECT
  USING (auth.uid() = recipient_user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage message queue"
  ON public.message_queue FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create indexes
CREATE INDEX idx_notification_preferences_user ON public.notification_preferences(user_id);
CREATE INDEX idx_message_queue_status ON public.message_queue(status);
CREATE INDEX idx_message_queue_recipient ON public.message_queue(recipient_user_id);
CREATE INDEX idx_message_queue_scheduled ON public.message_queue(scheduled_at) WHERE status = 'pending';

-- Update triggers
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at
  BEFORE UPDATE ON public.notification_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_message_queue_updated_at
  BEFORE UPDATE ON public.message_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default notification templates
INSERT INTO public.notification_templates (template_name, channel, subject, body_template, variables) VALUES
('task_assigned', 'whatsapp', NULL, 'New task {{task_number}} has been assigned to you. Applicant: {{applicant_name}}. Deadline: {{deadline}}', '["task_number", "applicant_name", "deadline"]'),
('task_assigned', 'email', 'New Task Assignment - {{task_number}}', 'Dear {{recipient_name}},\n\nA new verification task has been assigned to you.\n\nTask: {{task_number}}\nApplicant: {{applicant_name}}\nType: {{verification_type}}\nDeadline: {{deadline}}\n\nPlease complete the verification at your earliest convenience.\n\nRegards,\nRCU Platform', '["recipient_name", "task_number", "applicant_name", "verification_type", "deadline"]'),
('sla_warning', 'whatsapp', NULL, 'Warning: Task {{task_number}} is approaching SLA deadline. Time remaining: {{time_remaining}}', '["task_number", "time_remaining"]'),
('sla_warning', 'email', 'SLA Warning - {{task_number}}', 'Task {{task_number}} is approaching its SLA deadline.\n\nTime Remaining: {{time_remaining}}\nApplicant: {{applicant_name}}\n\nPlease prioritize this task.', '["task_number", "time_remaining", "applicant_name"]'),
('task_reassigned', 'whatsapp', NULL, 'Task {{task_number}} has been reassigned from you. Reason: {{reason}}', '["task_number", "reason"]'),
('qc_approved', 'whatsapp', NULL, 'Task {{task_number}} has been approved by QC. Great work!', '["task_number"]'),
('qc_rejected', 'whatsapp', NULL, 'Task {{task_number}} has been rejected by QC. Reason: {{remarks}}. Please review and resubmit.', '["task_number", "remarks"]');