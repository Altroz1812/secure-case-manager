
CREATE OR REPLACE FUNCTION public.notify_task_send_back()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  v_task_number TEXT;
  v_lead_applicant TEXT;
  v_fe_name TEXT;
  v_manager RECORD;
BEGIN
  -- Trigger when fe_response changes to 'sent_back'
  IF (TG_OP = 'UPDATE' AND NEW.fe_response = 'sent_back' AND 
      (OLD.fe_response IS NULL OR OLD.fe_response != 'sent_back')) THEN
    
    -- Get task details
    SELECT t.task_number, l.applicant_name
    INTO v_task_number, v_lead_applicant
    FROM tasks t
    JOIN leads l ON t.lead_id = l.id
    WHERE t.id = NEW.id;

    -- Get FE name
    SELECT full_name INTO v_fe_name
    FROM profiles WHERE user_id = OLD.assigned_to;

    -- Notify all admin and ops_manager users in the same branch
    FOR v_manager IN
      SELECT DISTINCT ur.user_id
      FROM user_roles ur
      INNER JOIN user_branch_assignments uba ON uba.user_id = ur.user_id AND uba.branch_id = NEW.branch_id
      WHERE ur.role IN ('admin', 'ops_manager')
    LOOP
      INSERT INTO notifications (user_id, title, message, type, action_url)
      VALUES (
        v_manager.user_id,
        'Task Sent Back by FE',
        'Task ' || v_task_number || ' for ' || COALESCE(v_lead_applicant, 'Unknown') || 
        ' was sent back by ' || COALESCE(v_fe_name, 'Field Executive') ||
        CASE WHEN NEW.send_back_reason IS NOT NULL THEN '. Reason: ' || LEFT(NEW.send_back_reason, 100) ELSE '' END,
        'reassignment',
        '/tasks/' || NEW.id
      );
    END LOOP;

    -- Also notify admins without branch assignment (global admins)
    FOR v_manager IN
      SELECT DISTINCT ur.user_id
      FROM user_roles ur
      WHERE ur.role = 'admin'
        AND NOT EXISTS (
          SELECT 1 FROM user_branch_assignments uba WHERE uba.user_id = ur.user_id
        )
    LOOP
      INSERT INTO notifications (user_id, title, message, type, action_url)
      VALUES (
        v_manager.user_id,
        'Task Sent Back by FE',
        'Task ' || v_task_number || ' for ' || COALESCE(v_lead_applicant, 'Unknown') || 
        ' was sent back by ' || COALESCE(v_fe_name, 'Field Executive') ||
        CASE WHEN NEW.send_back_reason IS NOT NULL THEN '. Reason: ' || LEFT(NEW.send_back_reason, 100) ELSE '' END,
        'reassignment',
        '/tasks/' || NEW.id
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_task_send_back
  AFTER UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_task_send_back();
