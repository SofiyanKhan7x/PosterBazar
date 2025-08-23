/*
  # Billboard Assignment System for Sub-Admins

  1. New Tables
    - `billboard_assignments`
      - `id` (uuid, primary key)
      - `billboard_id` (uuid, foreign key to billboards)
      - `sub_admin_id` (uuid, foreign key to users)
      - `assigned_by` (uuid, foreign key to users - admin who assigned)
      - `assigned_at` (timestamp)
      - `status` (enum: pending, in_progress, completed, cancelled)
      - `priority` (enum: low, medium, high, urgent)
      - `due_date` (timestamp)
      - `notes` (text)
      - `completed_at` (timestamp)
      - `is_active` (boolean)

  2. Security
    - Enable RLS on `billboard_assignments` table
    - Add policies for admins to manage assignments
    - Add policies for sub-admins to view only their assignments

  3. Functions
    - Function to assign billboard to sub-admin
    - Function to get sub-admin assignments
    - Function to complete assignment
*/

-- Create enum for assignment status
CREATE TYPE assignment_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- Create enum for assignment priority
CREATE TYPE assignment_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Create billboard assignments table
CREATE TABLE IF NOT EXISTS billboard_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  billboard_id uuid NOT NULL REFERENCES billboards(id) ON DELETE CASCADE,
  sub_admin_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_by uuid NOT NULL REFERENCES users(id),
  assigned_at timestamptz DEFAULT now(),
  status assignment_status DEFAULT 'pending',
  priority assignment_priority DEFAULT 'medium',
  due_date timestamptz,
  notes text,
  completed_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(billboard_id, sub_admin_id, is_active)
);

-- Enable RLS
ALTER TABLE billboard_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage all assignments"
  ON billboard_assignments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Sub-admins can view their own assignments"
  ON billboard_assignments
  FOR SELECT
  TO authenticated
  USING (
    sub_admin_id = auth.uid() 
    AND is_active = true
  );

CREATE POLICY "Sub-admins can update their own assignments"
  ON billboard_assignments
  FOR UPDATE
  TO authenticated
  USING (
    sub_admin_id = auth.uid() 
    AND is_active = true
  )
  WITH CHECK (
    sub_admin_id = auth.uid()
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_billboard_assignments_sub_admin_id ON billboard_assignments(sub_admin_id);
CREATE INDEX IF NOT EXISTS idx_billboard_assignments_billboard_id ON billboard_assignments(billboard_id);
CREATE INDEX IF NOT EXISTS idx_billboard_assignments_status ON billboard_assignments(status);
CREATE INDEX IF NOT EXISTS idx_billboard_assignments_active ON billboard_assignments(is_active);

-- Function to assign billboard to sub-admin
CREATE OR REPLACE FUNCTION assign_billboard_to_subadmin(
  p_billboard_id uuid,
  p_sub_admin_id uuid,
  p_admin_id uuid,
  p_priority assignment_priority DEFAULT 'medium',
  p_due_date timestamptz DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_assignment_id uuid;
  v_billboard_title text;
  v_sub_admin_name text;
  v_admin_name text;
BEGIN
  -- Verify admin permissions
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = p_admin_id 
    AND role = 'admin' 
    AND is_active = true
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Only active administrators can assign billboards'
    );
  END IF;

  -- Verify billboard exists and is approved
  SELECT title INTO v_billboard_title
  FROM billboards 
  WHERE id = p_billboard_id 
  AND status = 'approved';
  
  IF v_billboard_title IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Billboard not found or not approved for verification'
    );
  END IF;

  -- Verify sub-admin exists and is active
  SELECT name INTO v_sub_admin_name
  FROM users 
  WHERE id = p_sub_admin_id 
  AND role = 'sub_admin' 
  AND is_active = true;
  
  IF v_sub_admin_name IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Sub-admin not found or inactive'
    );
  END IF;

  -- Get admin name
  SELECT name INTO v_admin_name
  FROM users 
  WHERE id = p_admin_id;

  -- Deactivate any existing assignments for this billboard
  UPDATE billboard_assignments 
  SET is_active = false, updated_at = now()
  WHERE billboard_id = p_billboard_id 
  AND is_active = true;

  -- Create new assignment
  INSERT INTO billboard_assignments (
    billboard_id,
    sub_admin_id,
    assigned_by,
    priority,
    due_date,
    notes,
    status
  ) VALUES (
    p_billboard_id,
    p_sub_admin_id,
    p_admin_id,
    p_priority,
    COALESCE(p_due_date, now() + interval '7 days'),
    p_notes,
    'pending'
  ) RETURNING id INTO v_assignment_id;

  -- Create notification for sub-admin
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    related_id,
    related_type
  ) VALUES (
    p_sub_admin_id,
    'New Billboard Assignment',
    format('You have been assigned to verify "%s". Priority: %s', v_billboard_title, p_priority),
    'info',
    p_billboard_id,
    'billboard_assignment'
  );

  RETURN json_build_object(
    'success', true,
    'assignment_id', v_assignment_id,
    'message', format('Billboard "%s" assigned to %s successfully', v_billboard_title, v_sub_admin_name)
  );
END;
$$;

-- Function to get sub-admin assignments
CREATE OR REPLACE FUNCTION get_subadmin_assignments(p_sub_admin_id uuid)
RETURNS TABLE (
  assignment_id uuid,
  billboard_id uuid,
  billboard_title text,
  billboard_location text,
  billboard_owner_name text,
  assignment_status assignment_status,
  priority assignment_priority,
  assigned_at timestamptz,
  due_date timestamptz,
  notes text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ba.id,
    ba.billboard_id,
    b.title,
    b.location_address,
    u.name,
    ba.status,
    ba.priority,
    ba.assigned_at,
    ba.due_date,
    ba.notes
  FROM billboard_assignments ba
  JOIN billboards b ON ba.billboard_id = b.id
  JOIN users u ON b.owner_id = u.id
  WHERE ba.sub_admin_id = p_sub_admin_id
  AND ba.is_active = true
  ORDER BY ba.priority DESC, ba.assigned_at ASC;
END;
$$;

-- Function to complete assignment
CREATE OR REPLACE FUNCTION complete_billboard_assignment(
  p_assignment_id uuid,
  p_sub_admin_id uuid,
  p_verification_result boolean,
  p_completion_notes text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_billboard_id uuid;
  v_billboard_title text;
BEGIN
  -- Verify assignment belongs to sub-admin
  SELECT billboard_id INTO v_billboard_id
  FROM billboard_assignments 
  WHERE id = p_assignment_id 
  AND sub_admin_id = p_sub_admin_id 
  AND is_active = true;
  
  IF v_billboard_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Assignment not found or not assigned to you'
    );
  END IF;

  -- Get billboard title
  SELECT title INTO v_billboard_title
  FROM billboards 
  WHERE id = v_billboard_id;

  -- Update assignment status
  UPDATE billboard_assignments 
  SET 
    status = 'completed',
    completed_at = now(),
    notes = COALESCE(p_completion_notes, notes),
    updated_at = now()
  WHERE id = p_assignment_id;

  -- Update billboard status based on verification result
  UPDATE billboards 
  SET 
    status = CASE 
      WHEN p_verification_result THEN 'active'::billboard_status 
      ELSE 'rejected'::billboard_status 
    END,
    updated_at = now()
  WHERE id = v_billboard_id;

  RETURN json_build_object(
    'success', true,
    'message', format('Assignment for "%s" completed successfully', v_billboard_title)
  );
END;
$$;

-- Update trigger for billboard_assignments
CREATE OR REPLACE FUNCTION update_billboard_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_billboard_assignments_updated_at
  BEFORE UPDATE ON billboard_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_billboard_assignments_updated_at();