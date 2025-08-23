/*
  # Fix assign_billboard_to_subadmin RPC function

  1. Updates
    - Fix the assign_billboard_to_subadmin RPC function to handle existing assignments
    - Check for existing assignments and update them instead of creating duplicates
    - Prevent unique constraint violations on billboard_assignments table

  2. Logic
    - First check if assignment exists (active or inactive)
    - If exists, update the existing record to reactivate it
    - If not exists, create new assignment record
    - Always return success/error status for frontend handling
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS assign_billboard_to_subadmin(uuid, uuid, uuid, assignment_priority, timestamptz, text);

-- Create the corrected function
CREATE OR REPLACE FUNCTION assign_billboard_to_subadmin(
  p_billboard_id uuid,
  p_sub_admin_id uuid,
  p_admin_id uuid,
  p_priority assignment_priority DEFAULT 'medium',
  p_due_date timestamptz DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_assignment_id uuid;
  new_assignment_id uuid;
BEGIN
  -- Check if an assignment already exists for this billboard and sub-admin combination
  SELECT id INTO existing_assignment_id
  FROM billboard_assignments
  WHERE billboard_id = p_billboard_id 
    AND sub_admin_id = p_sub_admin_id;

  IF existing_assignment_id IS NOT NULL THEN
    -- Update existing assignment to reactivate it
    UPDATE billboard_assignments
    SET 
      is_active = true,
      status = 'pending',
      priority = p_priority,
      due_date = p_due_date,
      notes = p_notes,
      assigned_by = p_admin_id,
      assigned_at = now(),
      updated_at = now()
    WHERE id = existing_assignment_id;

    RETURN jsonb_build_object(
      'success', true,
      'assignment_id', existing_assignment_id,
      'message', 'Assignment updated successfully'
    );
  ELSE
    -- Create new assignment
    INSERT INTO billboard_assignments (
      billboard_id,
      sub_admin_id,
      assigned_by,
      status,
      priority,
      due_date,
      notes,
      is_active
    ) VALUES (
      p_billboard_id,
      p_sub_admin_id,
      p_admin_id,
      'pending',
      p_priority,
      p_due_date,
      p_notes,
      true
    ) RETURNING id INTO new_assignment_id;

    RETURN jsonb_build_object(
      'success', true,
      'assignment_id', new_assignment_id,
      'message', 'Assignment created successfully'
    );
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Failed to assign billboard'
    );
END;
$$;