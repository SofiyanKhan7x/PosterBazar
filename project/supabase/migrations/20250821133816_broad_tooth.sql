/*
  # Billboard Assignment Health Checks and Monitoring

  1. New Functions
    - `check_assignment_health()` - System health check for assignments
    - `get_assignment_audit_trail()` - Audit trail for assignment changes
    - `validate_assignment_integrity()` - Data integrity validation

  2. Constraints
    - Enhanced assignment validity constraints
    - Data integrity checks

  3. Monitoring
    - Assignment audit logging
    - Health check functions
*/

-- Create assignment health check function
CREATE OR REPLACE FUNCTION check_assignment_health()
RETURNS TABLE (
  total_assignments bigint,
  active_assignments bigint,
  pending_assignments bigint,
  subadmins_with_assignments bigint,
  orphaned_assignments bigint,
  inactive_subadmin_assignments bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_assignments,
    COUNT(*) FILTER (WHERE ba.is_active = true) as active_assignments,
    COUNT(*) FILTER (WHERE ba.status = 'pending' AND ba.is_active = true) as pending_assignments,
    COUNT(DISTINCT ba.sub_admin_id) FILTER (WHERE ba.is_active = true) as subadmins_with_assignments,
    COUNT(*) FILTER (WHERE ba.is_active = true AND b.id IS NULL) as orphaned_assignments,
    COUNT(*) FILTER (WHERE ba.is_active = true AND u.is_active = false) as inactive_subadmin_assignments
  FROM billboard_assignments ba
  LEFT JOIN billboards b ON ba.billboard_id = b.id
  LEFT JOIN users u ON ba.sub_admin_id = u.id;
END;
$$ LANGUAGE plpgsql;

-- Create assignment audit trail function
CREATE OR REPLACE FUNCTION get_assignment_audit_trail(
  p_sub_admin_id uuid DEFAULT NULL,
  p_billboard_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  assignment_id uuid,
  billboard_id uuid,
  billboard_title text,
  sub_admin_id uuid,
  sub_admin_name text,
  assigned_by_name text,
  status assignment_status,
  priority assignment_priority,
  assigned_at timestamptz,
  completed_at timestamptz,
  is_active boolean,
  action_type text,
  action_timestamp timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ba.id as assignment_id,
    ba.billboard_id,
    b.title as billboard_title,
    ba.sub_admin_id,
    sa.name as sub_admin_name,
    admin.name as assigned_by_name,
    ba.status,
    ba.priority,
    ba.assigned_at,
    ba.completed_at,
    ba.is_active,
    'assignment' as action_type,
    ba.assigned_at as action_timestamp
  FROM billboard_assignments ba
  JOIN billboards b ON ba.billboard_id = b.id
  JOIN users sa ON ba.sub_admin_id = sa.id
  JOIN users admin ON ba.assigned_by = admin.id
  WHERE (p_sub_admin_id IS NULL OR ba.sub_admin_id = p_sub_admin_id)
    AND (p_billboard_id IS NULL OR ba.billboard_id = p_billboard_id)
  ORDER BY ba.assigned_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Create assignment integrity validation function
CREATE OR REPLACE FUNCTION validate_assignment_integrity()
RETURNS TABLE (
  issue_type text,
  issue_description text,
  affected_count bigint,
  suggested_action text
) AS $$
BEGIN
  -- Check for assignments with inactive sub-admins
  RETURN QUERY
  SELECT 
    'inactive_subadmin' as issue_type,
    'Active assignments assigned to inactive sub-admin accounts' as issue_description,
    COUNT(*) as affected_count,
    'Deactivate assignments or reactivate sub-admin accounts' as suggested_action
  FROM billboard_assignments ba
  JOIN users u ON ba.sub_admin_id = u.id
  WHERE ba.is_active = true 
    AND u.is_active = false
  HAVING COUNT(*) > 0;

  -- Check for assignments with non-existent billboards
  RETURN QUERY
  SELECT 
    'orphaned_assignments' as issue_type,
    'Assignments pointing to deleted billboards' as issue_description,
    COUNT(*) as affected_count,
    'Clean up orphaned assignment records' as suggested_action
  FROM billboard_assignments ba
  LEFT JOIN billboards b ON ba.billboard_id = b.id
  WHERE ba.is_active = true 
    AND b.id IS NULL
  HAVING COUNT(*) > 0;

  -- Check for duplicate active assignments
  RETURN QUERY
  SELECT 
    'duplicate_assignments' as issue_type,
    'Multiple active assignments for same billboard-subadmin pair' as issue_description,
    COUNT(*) as affected_count,
    'Consolidate duplicate assignments' as suggested_action
  FROM (
    SELECT billboard_id, sub_admin_id, COUNT(*) as assignment_count
    FROM billboard_assignments
    WHERE is_active = true
    GROUP BY billboard_id, sub_admin_id
    HAVING COUNT(*) > 1
  ) duplicates;
END;
$$ LANGUAGE plpgsql;

-- Add enhanced check constraint for assignment validity
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'check_assignment_validity'
  ) THEN
    ALTER TABLE billboard_assignments 
    ADD CONSTRAINT check_assignment_validity 
    CHECK (
      (is_active = true AND status IN ('pending', 'in_progress', 'completed')) OR
      (is_active = false)
    );
  END IF;
END $$;

-- Create assignment change logging trigger
CREATE OR REPLACE FUNCTION log_assignment_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log assignment status changes
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    INSERT INTO admin_audit_log (
      admin_id,
      action_type,
      target_user_id,
      action_details,
      success
    ) VALUES (
      COALESCE(NEW.assigned_by, OLD.assigned_by),
      'assignment_status_change',
      NEW.sub_admin_id,
      jsonb_build_object(
        'assignment_id', NEW.id,
        'billboard_id', NEW.billboard_id,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'is_active', NEW.is_active
      ),
      true
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'assignment_change_logger'
  ) THEN
    CREATE TRIGGER assignment_change_logger
      AFTER UPDATE ON billboard_assignments
      FOR EACH ROW
      EXECUTE FUNCTION log_assignment_changes();
  END IF;
END $$;