-- Function to create notification for task assignment
CREATE OR REPLACE FUNCTION public.notify_task_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task_number TEXT;
  v_lead_applicant TEXT;
  v_assignee_name TEXT;
BEGIN
  -- Only trigger when assigned_to changes and is not null
  IF (TG_OP = 'UPDATE' AND NEW.assigned_to IS NOT NULL AND 
      (OLD.assigned_to IS NULL OR OLD.assigned_to != NEW.assigned_to)) THEN
    
    -- Get task details
    SELECT t.task_number, l.applicant_name
    INTO v_task_number, v_lead_applicant
    FROM tasks t
    JOIN leads l ON t.lead_id = l.id
    WHERE t.id = NEW.id;

    -- Create notification for the assigned user
    INSERT INTO notifications (user_id, title, message, type, action_url)
    VALUES (
      NEW.assigned_to,
      'New Task Assigned',
      'You have been assigned task ' || v_task_number || ' for applicant ' || COALESCE(v_lead_applicant, 'Unknown'),
      'task_assignment',
      '/tasks/' || NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to create notification for SLA warning (when task becomes overdue)
CREATE OR REPLACE FUNCTION public.notify_sla_warning()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task_number TEXT;
  v_lead_applicant TEXT;
BEGIN
  -- Only trigger when is_overdue changes to true
  IF (TG_OP = 'UPDATE' AND NEW.is_overdue = true AND 
      (OLD.is_overdue IS NULL OR OLD.is_overdue = false) AND
      NEW.assigned_to IS NOT NULL) THEN
    
    -- Get task details
    SELECT t.task_number, l.applicant_name
    INTO v_task_number, v_lead_applicant
    FROM tasks t
    JOIN leads l ON t.lead_id = l.id
    WHERE t.id = NEW.id;

    -- Create notification for the assigned user
    INSERT INTO notifications (user_id, title, message, type, action_url)
    VALUES (
      NEW.assigned_to,
      'SLA Warning: Task Overdue',
      'Task ' || v_task_number || ' for ' || COALESCE(v_lead_applicant, 'Unknown') || ' has exceeded its SLA deadline',
      'sla_warning',
      '/tasks/' || NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to create notification for QC review completion
CREATE OR REPLACE FUNCTION public.notify_qc_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task_number TEXT;
  v_lead_applicant TEXT;
  v_status_text TEXT;
BEGIN
  -- Trigger when status changes to approved or rejected (QC review completed)
  IF (TG_OP = 'UPDATE' AND NEW.status IN ('approved', 'rejected') AND 
      OLD.status != NEW.status AND NEW.assigned_to IS NOT NULL) THEN
    
    -- Get task details
    SELECT t.task_number, l.applicant_name
    INTO v_task_number, v_lead_applicant
    FROM tasks t
    JOIN leads l ON t.lead_id = l.id
    WHERE t.id = NEW.id;

    -- Set status text
    v_status_text := CASE WHEN NEW.status = 'approved' THEN 'Approved' ELSE 'Rejected' END;

    -- Notify the assigned field executive
    INSERT INTO notifications (user_id, title, message, type, action_url)
    VALUES (
      NEW.assigned_to,
      'QC Review: Task ' || v_status_text,
      'Task ' || v_task_number || ' has been ' || LOWER(v_status_text) || ' by QC.' || 
      CASE WHEN NEW.qc_remarks IS NOT NULL THEN ' Remarks: ' || LEFT(NEW.qc_remarks, 100) ELSE '' END,
      'qc_result',
      '/tasks/' || NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to create notification for task reassignment
CREATE OR REPLACE FUNCTION public.notify_task_reassignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task_number TEXT;
  v_lead_applicant TEXT;
  v_new_assignee_name TEXT;
BEGIN
  -- Trigger on new assignment record where assigned_from is not null (reassignment)
  IF (TG_OP = 'INSERT' AND NEW.assigned_from IS NOT NULL) THEN
    
    -- Get task details
    SELECT t.task_number, l.applicant_name
    INTO v_task_number, v_lead_applicant
    FROM tasks t
    JOIN leads l ON t.lead_id = l.id
    WHERE t.id = NEW.task_id;

    -- Get new assignee name
    SELECT full_name INTO v_new_assignee_name
    FROM profiles WHERE user_id = NEW.assigned_to;

    -- Notify the previous assignee
    INSERT INTO notifications (user_id, title, message, type, action_url)
    VALUES (
      NEW.assigned_from,
      'Task Reassigned',
      'Task ' || v_task_number || ' has been reassigned to ' || COALESCE(v_new_assignee_name, 'another user') || 
      CASE WHEN NEW.reason IS NOT NULL THEN '. Reason: ' || LEFT(NEW.reason, 100) ELSE '' END,
      'reassignment',
      '/tasks/' || NEW.task_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_notify_task_assignment ON tasks;
CREATE TRIGGER trigger_notify_task_assignment
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_assignment();

DROP TRIGGER IF EXISTS trigger_notify_sla_warning ON tasks;
CREATE TRIGGER trigger_notify_sla_warning
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_sla_warning();

DROP TRIGGER IF EXISTS trigger_notify_qc_review ON tasks;
CREATE TRIGGER trigger_notify_qc_review
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_qc_review();

DROP TRIGGER IF EXISTS trigger_notify_task_reassignment ON task_assignments;
CREATE TRIGGER trigger_notify_task_reassignment
  AFTER INSERT ON task_assignments
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_reassignment();