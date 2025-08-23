/*
  # Create Sub-Admin Account Function

  1. New Functions
    - `create_subadmin_account` - Securely creates sub-admin accounts with proper validation
    - `revoke_subadmin_access` - Revokes all active sessions for a sub-admin
    - `assign_subadmin_permissions` - Assigns default permissions to new sub-admins

  2. Security
    - Password hashing using pgcrypto extension
    - Input validation and sanitization
    - Admin-only access control
    - Automatic permission assignment

  3. Features
    - Secure password storage
    - Email uniqueness validation
    - Automatic session management
    - Audit logging
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to create sub-admin accounts securely
CREATE OR REPLACE FUNCTION create_subadmin_account(
  p_admin_id UUID,
  p_name TEXT,
  p_email TEXT,
  p_password TEXT,
  p_phone TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_password_hash TEXT;
  v_result JSON;
BEGIN
  -- Validate that the requesting user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = p_admin_id 
    AND role = 'admin' 
    AND is_active = true
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Only active administrators can create sub-admin accounts'
    );
  END IF;

  -- Validate input parameters
  IF p_name IS NULL OR trim(p_name) = '' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Name is required'
    );
  END IF;

  IF p_email IS NULL OR trim(p_email) = '' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Email is required'
    );
  END IF;

  IF p_password IS NULL OR length(p_password) < 8 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Password must be at least 8 characters long'
    );
  END IF;

  -- Check if email already exists
  IF EXISTS (
    SELECT 1 FROM users 
    WHERE email = lower(trim(p_email))
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'An account with this email already exists'
    );
  END IF;

  -- Generate secure password hash
  v_password_hash := crypt(p_password, gen_salt('bf', 12));

  -- Generate new user ID
  v_user_id := gen_random_uuid();

  -- Insert new sub-admin user
  INSERT INTO users (
    id,
    email,
    password_hash,
    name,
    role,
    phone,
    kyc_status,
    wallet_balance,
    is_active,
    email_verified,
    failed_login_attempts,
    password_changed_at,
    force_password_change
  ) VALUES (
    v_user_id,
    lower(trim(p_email)),
    v_password_hash,
    trim(p_name),
    'sub_admin',
    CASE WHEN p_phone IS NOT NULL AND trim(p_phone) != '' THEN trim(p_phone) ELSE NULL END,
    'approved',
    0.00,
    true,
    true,
    0,
    now(),
    false
  );

  -- Build success response with user data
  SELECT json_build_object(
    'success', true,
    'user', json_build_object(
      'id', id,
      'email', email,
      'name', name,
      'role', role,
      'phone', phone,
      'kyc_status', kyc_status,
      'wallet_balance', wallet_balance,
      'is_active', is_active,
      'email_verified', email_verified,
      'created_at', created_at,
      'updated_at', updated_at,
      'failed_login_attempts', failed_login_attempts,
      'locked_until', locked_until,
      'password_changed_at', password_changed_at,
      'force_password_change', force_password_change
    )
  ) INTO v_result
  FROM users 
  WHERE id = v_user_id;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Failed to create sub-admin account: ' || SQLERRM
    );
END;
$$;

-- Function to revoke sub-admin access
CREATE OR REPLACE FUNCTION revoke_subadmin_access(
  p_user_id UUID,
  p_admin_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Deactivate all user sessions
  UPDATE user_sessions 
  SET is_active = false 
  WHERE user_id = p_user_id;

  -- Log the revocation if admin ID provided
  IF p_admin_id IS NOT NULL THEN
    INSERT INTO admin_audit_log (
      admin_id,
      action_type,
      target_user_id,
      action_details,
      success
    ) VALUES (
      p_admin_id,
      'revoke_access',
      p_user_id,
      json_build_object('reason', 'Admin revoked sub-admin access'),
      true
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'message', 'Sub-admin access revoked successfully'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Failed to revoke access: ' || SQLERRM
    );
END;
$$;

-- Function to assign default permissions to sub-admins
CREATE OR REPLACE FUNCTION assign_subadmin_permissions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_permissions TEXT[] := ARRAY[
    'view_billboards',
    'verify_billboards',
    'upload_verification_photos',
    'submit_verification_reports',
    'view_site_visits',
    'manage_verification_history',
    'access_subadmin_dashboard',
    'conduct_site_visits',
    'manage_billboard_verification'
  ];
  v_permission TEXT;
BEGIN
  -- Only assign permissions for sub_admin role
  IF NEW.role = 'sub_admin' THEN
    -- Insert default permissions for the new sub-admin
    FOREACH v_permission IN ARRAY v_permissions
    LOOP
      INSERT INTO user_permissions (
        user_id,
        permission_name,
        granted_by,
        is_active
      ) VALUES (
        NEW.id,
        v_permission,
        NULL, -- System-assigned
        true
      ) ON CONFLICT (user_id, permission_name) DO NOTHING;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- Ensure the trigger exists for automatic permission assignment
DROP TRIGGER IF EXISTS assign_permissions_on_subadmin_creation ON users;
CREATE TRIGGER assign_permissions_on_subadmin_creation
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION assign_subadmin_permissions();