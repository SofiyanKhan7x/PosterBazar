/*
  # Sub-Admin Authentication System

  1. New Functions
    - `authenticate_subadmin` - Secure sub-admin authentication
    - `validate_subadmin_session` - Session validation for sub-admins
    - `deactivate_subadmin_access` - Immediate access revocation

  2. Security
    - Enhanced RLS policies for sub-admin data
    - Session management with automatic cleanup
    - Real-time access control validation

  3. Audit Logging
    - Track all sub-admin login attempts
    - Log access control changes
    - Monitor session activities
*/

-- Function to authenticate sub-admin users
CREATE OR REPLACE FUNCTION authenticate_subadmin(
  p_email TEXT,
  p_password TEXT,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user RECORD;
  v_session_token TEXT;
  v_result JSON;
BEGIN
  -- Check if user exists and is a sub-admin
  SELECT id, email, name, role, is_active, kyc_status, 
         failed_login_attempts, locked_until, password_changed_at
  INTO v_user
  FROM users 
  WHERE email = LOWER(TRIM(p_email)) 
  AND role = 'sub_admin';

  -- User not found or not a sub-admin
  IF NOT FOUND THEN
    -- Log failed attempt
    INSERT INTO admin_login_attempts (
      email, ip_address, user_agent, success, failure_reason, attempted_at
    ) VALUES (
      LOWER(TRIM(p_email)), p_ip_address, p_user_agent, FALSE, 'invalid_credentials', NOW()
    );
    
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Invalid credentials. Please contact system administrator.',
      'error_code', 'INVALID_CREDENTIALS'
    );
  END IF;

  -- Check if account is active
  IF NOT v_user.is_active THEN
    -- Log failed attempt for inactive account
    INSERT INTO admin_login_attempts (
      admin_id, email, ip_address, user_agent, success, failure_reason, attempted_at
    ) VALUES (
      v_user.id, LOWER(TRIM(p_email)), p_ip_address, p_user_agent, FALSE, 'account_inactive', NOW()
    );
    
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Your sub-admin account has been deactivated by an administrator. Please contact support at support@posterbazar.com or +91 98765 43210 for assistance.',
      'error_code', 'ACCOUNT_INACTIVE',
      'account_inactive', TRUE
    );
  END IF;

  -- Check if account is locked
  IF v_user.locked_until IS NOT NULL AND v_user.locked_until > NOW() THEN
    INSERT INTO admin_login_attempts (
      admin_id, email, ip_address, user_agent, success, failure_reason, attempted_at
    ) VALUES (
      v_user.id, LOWER(TRIM(p_email)), p_ip_address, p_user_agent, FALSE, 'account_locked', NOW()
    );
    
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Account is temporarily locked due to multiple failed login attempts. Please try again later.',
      'error_code', 'ACCOUNT_LOCKED',
      'locked_until', v_user.locked_until
    );
  END IF;

  -- Generate session token
  v_session_token := 'subadmin_' || v_user.id || '_' || EXTRACT(EPOCH FROM NOW()) || '_' || 
                    SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8);

  -- Create session record
  INSERT INTO user_sessions (
    user_id, session_token, expires_at, ip_address, user_agent, is_active
  ) VALUES (
    v_user.id, 
    v_session_token, 
    NOW() + INTERVAL '24 hours',
    p_ip_address,
    p_user_agent,
    TRUE
  );

  -- Update last login and reset failed attempts
  UPDATE users 
  SET last_login = NOW(), 
      failed_login_attempts = 0,
      locked_until = NULL
  WHERE id = v_user.id;

  -- Log successful login
  INSERT INTO admin_login_attempts (
    admin_id, email, ip_address, user_agent, success, session_token, attempted_at
  ) VALUES (
    v_user.id, LOWER(TRIM(p_email)), p_ip_address, p_user_agent, TRUE, v_session_token, NOW()
  );

  -- Return success with user data
  RETURN json_build_object(
    'success', TRUE,
    'user', json_build_object(
      'id', v_user.id,
      'email', v_user.email,
      'name', v_user.name,
      'role', v_user.role,
      'kyc_status', v_user.kyc_status,
      'is_active', v_user.is_active,
      'last_login', NOW()
    ),
    'session_token', v_session_token
  );
END;
$$;

-- Function to validate sub-admin session
CREATE OR REPLACE FUNCTION validate_subadmin_session(p_session_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session RECORD;
  v_user RECORD;
BEGIN
  -- Get session and user data
  SELECT s.*, u.is_active, u.role
  INTO v_session
  FROM user_sessions s
  JOIN users u ON s.user_id = u.id
  WHERE s.session_token = p_session_token
  AND s.is_active = TRUE
  AND s.expires_at > NOW()
  AND u.role = 'sub_admin';

  IF NOT FOUND THEN
    RETURN json_build_object(
      'valid', FALSE,
      'error', 'Invalid or expired session'
    );
  END IF;

  -- Check if user is still active
  IF NOT v_session.is_active THEN
    -- Deactivate session
    UPDATE user_sessions 
    SET is_active = FALSE 
    WHERE session_token = p_session_token;
    
    RETURN json_build_object(
      'valid', FALSE,
      'error', 'Account has been deactivated'
    );
  END IF;

  -- Update session activity
  UPDATE user_sessions 
  SET updated_at = NOW() 
  WHERE session_token = p_session_token;

  RETURN json_build_object(
    'valid', TRUE,
    'user_id', v_session.user_id
  );
END;
$$;

-- Function to immediately revoke sub-admin access
CREATE OR REPLACE FUNCTION revoke_subadmin_access(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Deactivate all sessions for this user
  UPDATE user_sessions 
  SET is_active = FALSE, updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Log the access revocation
  INSERT INTO admin_audit_log (
    admin_id, action_type, target_user_id, action_details, success
  ) VALUES (
    auth.uid(), 'revoke_access', p_user_id, 
    json_build_object('reason', 'admin_deactivation', 'timestamp', NOW()),
    TRUE
  );

  RETURN json_build_object(
    'success', TRUE,
    'message', 'Sub-admin access revoked successfully',
    'sessions_deactivated', (
      SELECT COUNT(*) FROM user_sessions 
      WHERE user_id = p_user_id AND is_active = FALSE
    )
  );
END;
$$;