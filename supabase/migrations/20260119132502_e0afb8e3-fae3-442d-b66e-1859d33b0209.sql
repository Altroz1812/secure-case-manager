
-- ============================================
-- TASK WORKFLOW ENGINE
-- Auto task generation, SLA timers, auto-assignment
-- ============================================

-- 1. Function to get SLA hours for a verification type
CREATE OR REPLACE FUNCTION public.get_sla_hours(p_verification_type verification_type)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sla_hours integer;
BEGIN
  SELECT sla_hours INTO v_sla_hours
  FROM verification_type_config
  WHERE type = p_verification_type AND is_active = true;
  
  RETURN COALESCE(v_sla_hours, 24); -- Default 24 hours if not configured
END;
$$;

-- 2. Function to find best matching field executive for auto-assignment
CREATE OR REPLACE FUNCTION public.find_best_field_executive(
  p_branch_id uuid,
  p_pincode text,
  p_verification_type verification_type
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fe_user_id uuid;
  v_skill fe_skill;
BEGIN
  -- Map verification type to skill
  v_skill := CASE p_verification_type
    WHEN 'residential' THEN 'residential'::fe_skill
    WHEN 'business' THEN 'business'::fe_skill
    WHEN 'end_use' THEN 'end_use'::fe_skill
    ELSE 'residential'::fe_skill  -- Default
  END;

  -- Find best match: 
  -- 1. FE must be available
  -- 2. FE must have capacity (current_workload < max_workload)
  -- 3. FE should be in same branch (via user_branch_assignments)
  -- 4. Prefer pincode match
  -- 5. Prefer skill match
  -- 6. Sort by lowest workload
  SELECT fe.user_id INTO v_fe_user_id
  FROM field_executives fe
  INNER JOIN user_branch_assignments uba ON uba.user_id = fe.user_id AND uba.branch_id = p_branch_id
  WHERE fe.is_available = true
    AND COALESCE(fe.current_workload, 0) < COALESCE(fe.max_workload, 10)
  ORDER BY
    -- Pincode match priority
    CASE WHEN p_pincode IS NOT NULL AND p_pincode = ANY(fe.mapped_pincodes) THEN 0 ELSE 1 END,
    -- Skill match priority
    CASE WHEN v_skill = ANY(fe.skills) THEN 0 ELSE 1 END,
    -- Lowest workload
    COALESCE(fe.current_workload, 0) ASC
  LIMIT 1;

  RETURN v_fe_user_id;
END;
$$;

-- 3. Function to create tasks automatically when a lead is created
CREATE OR REPLACE FUNCTION public.auto_create_tasks_for_lead()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    
    -- Create the task
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
      CASE WHEN v_assigned_to IS NOT NULL THEN 'assigned' ELSE 'pending' END,
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

-- 4. Create trigger for auto task generation
DROP TRIGGER IF EXISTS trigger_auto_create_tasks ON leads;
CREATE TRIGGER trigger_auto_create_tasks
  AFTER INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_tasks_for_lead();

-- 5. Function to update FE workload when task status changes
CREATE OR REPLACE FUNCTION public.update_fe_workload_on_task_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a task is completed, approved, or rejected, decrement workload
  IF OLD.status IN ('pending', 'assigned', 'in_progress', 'qc_review') 
     AND NEW.status IN ('completed', 'approved', 'rejected') THEN
    IF NEW.assigned_to IS NOT NULL THEN
      UPDATE field_executives
      SET current_workload = GREATEST(COALESCE(current_workload, 0) - 1, 0),
          updated_at = NOW()
      WHERE user_id = NEW.assigned_to;
    END IF;
  END IF;
  
  -- When task is reassigned (assigned_to changes)
  IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    -- Decrement old assignee's workload
    IF OLD.assigned_to IS NOT NULL AND OLD.status NOT IN ('completed', 'approved', 'rejected') THEN
      UPDATE field_executives
      SET current_workload = GREATEST(COALESCE(current_workload, 0) - 1, 0),
          updated_at = NOW()
      WHERE user_id = OLD.assigned_to;
    END IF;
    
    -- Increment new assignee's workload
    IF NEW.assigned_to IS NOT NULL AND NEW.status NOT IN ('completed', 'approved', 'rejected') THEN
      UPDATE field_executives
      SET current_workload = COALESCE(current_workload, 0) + 1,
          updated_at = NOW()
      WHERE user_id = NEW.assigned_to;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 6. Create trigger for workload management
DROP TRIGGER IF EXISTS trigger_update_fe_workload ON tasks;
CREATE TRIGGER trigger_update_fe_workload
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_fe_workload_on_task_change();

-- 7. Add constraint to require reason for reassignments
-- This is enforced in the application layer, but we add a comment for documentation
COMMENT ON COLUMN task_assignments.reason IS 'Required for reassignments (is_override = true)';

-- 8. Function to validate task assignment (checks if user can reassign)
CREATE OR REPLACE FUNCTION public.can_reassign_task(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN has_any_role(p_user_id, ARRAY['admin'::app_role, 'qc'::app_role, 'ops_manager'::app_role]);
END;
$$;
