-- Fix the auto_create_tasks_for_lead function to properly cast status to task_status enum
CREATE OR REPLACE FUNCTION public.auto_create_tasks_for_lead()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_verification_type verification_type;
  v_task_number text;
  v_sla_hours integer;
  v_assigned_to uuid;
BEGIN
  -- Loop through each verification type selected for the lead
  FOREACH v_verification_type IN ARRAY NEW.verification_types
  LOOP
    -- Generate task number
    SELECT generate_task_number() INTO v_task_number;
    
    -- Get SLA hours for this verification type
    v_sla_hours := get_sla_hours(v_verification_type);
    
    -- Try to find best field executive for auto-assignment
    v_assigned_to := find_best_field_executive(
      NEW.branch_id,
      NEW.pincode,
      v_verification_type
    );
    
    -- Create the task with proper enum casting
    INSERT INTO tasks (
      lead_id,
      branch_id,
      verification_type,
      task_number,
      status,
      sla_deadline,
      assigned_to,
      assigned_at
    ) VALUES (
      NEW.id,
      NEW.branch_id,
      v_verification_type,
      v_task_number,
      CASE WHEN v_assigned_to IS NOT NULL THEN 'assigned'::task_status ELSE 'pending'::task_status END,
      NOW() + (v_sla_hours || ' hours')::interval,
      v_assigned_to,
      CASE WHEN v_assigned_to IS NOT NULL THEN NOW() ELSE NULL END
    );
    
    -- If auto-assigned, increment FE workload and create assignment record
    IF v_assigned_to IS NOT NULL THEN
      UPDATE field_executives
      SET current_workload = COALESCE(current_workload, 0) + 1,
          updated_at = NOW()
      WHERE user_id = v_assigned_to;
      
      -- Create assignment record for audit trail
      INSERT INTO task_assignments (
        task_id,
        assigned_to,
        assigned_by,
        reason,
        is_override
      ) VALUES (
        (SELECT id FROM tasks WHERE task_number = v_task_number),
        v_assigned_to,
        NEW.created_by,
        'Auto-assigned by system',
        false
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;