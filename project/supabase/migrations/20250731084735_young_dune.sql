/*
  # Enhanced SubAdmin Authentication & Authorization System

  1. Security Enhancements
    - Add password complexity validation
    - Implement account lockout mechanism
    - Add session management
    - Enhanced role-based access control

  2. New Tables
    - `user_sessions` - Track active sessions
    - `login_attempts` - Monitor failed login attempts
    - `user_permissions` - Granular permission system

  3. Security Policies
    - Row Level Security for all tables
    - Proper access controls for subadmins
    - Session validation policies

  4. Functions
    - Password validation
    - Account lockout logic
    - Session management
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create user_sessions table for session management
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  ip_address inet,
  user_agent text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create login_attempts table for security monitoring
CREATE TABLE IF NOT EXISTS login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address inet,
  user_agent text,
  success boolean DEFAULT false,
  failure_reason text,
  attempted_at timestamptz DEFAULT now()
);

-- Create user_permissions table for granular access control
CREATE TABLE IF NOT EXISTS user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_name text NOT NULL,
  granted_by uuid REFERENCES users(id),
  granted_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  UNIQUE(user_id, permission_name)
);

-- Add account lockout fields to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'failed_login_attempts'
  ) THEN
    ALTER TABLE users ADD COLUMN failed_login_attempts integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'locked_until'
  ) THEN
    ALTER TABLE users ADD COLUMN locked_until timestamptz;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'password_changed_at'
  ) THEN
    ALTER TABLE users ADD COLUMN password_changed_at timestamptz DEFAULT now();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'force_password_change'
  ) THEN
    ALTER TABLE users ADD COLUMN force_password_change boolean DEFAULT false;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email_active ON users(email, is_active);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Enable RLS on new tables
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_sessions
CREATE POLICY "Users can view own sessions"
  ON user_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON user_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON user_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions"
  ON user_sessions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policies for login_attempts
CREATE POLICY "Admins can view all login attempts"
  ON login_attempts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Anyone can insert login attempts"
  ON login_attempts
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- RLS Policies for user_permissions
CREATE POLICY "Users can view own permissions"
  ON user_permissions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all permissions"
  ON user_permissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Function to validate password complexity
CREATE OR REPLACE FUNCTION validate_password(password text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  -- Password must be at least 8 characters
  IF length(password) < 8 THEN
    RETURN false;
  END IF;
  
  -- Must contain at least one uppercase letter
  IF password !~ '[A-Z]' THEN
    RETURN false;
  END IF;
  
  -- Must contain at least one lowercase letter
  IF password !~ '[a-z]' THEN
    RETURN false;
  END IF;
  
  -- Must contain at least one digit
  IF password !~ '[0-9]' THEN
    RETURN false;
  END IF;
  
  -- Must contain at least one special character
  IF password !~ '[^A-Za-z0-9]' THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Function to check if account is locked
CREATE OR REPLACE FUNCTION is_account_locked(user_email text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  user_record users%ROWTYPE;
BEGIN
  SELECT * INTO user_record
  FROM users
  WHERE email = user_email;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check if account is locked and lock period hasn't expired
  IF user_record.locked_until IS NOT NULL AND user_record.locked_until > now() THEN
    RETURN true;
  END IF;
  
  -- If lock period has expired, unlock the account
  IF user_record.locked_until IS NOT NULL AND user_record.locked_until <= now() THEN
    UPDATE users
    SET locked_until = NULL, failed_login_attempts = 0
    WHERE email = user_email;
  END IF;
  
  RETURN false;
END;
$$;

-- Function to handle failed login attempt
CREATE OR REPLACE FUNCTION handle_failed_login(user_email text, ip_addr inet DEFAULT NULL, user_agent_str text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  current_attempts integer;
  max_attempts integer := 5;
  lockout_duration interval := '30 minutes';
BEGIN
  -- Log the failed attempt
  INSERT INTO login_attempts (email, ip_address, user_agent, success, failure_reason, attempted_at)
  VALUES (user_email, ip_addr, user_agent_str, false, 'Invalid credentials', now());
  
  -- Update failed attempts counter
  UPDATE users
  SET failed_login_attempts = failed_login_attempts + 1
  WHERE email = user_email;
  
  -- Get current attempts count
  SELECT failed_login_attempts INTO current_attempts
  FROM users
  WHERE email = user_email;
  
  -- Lock account if max attempts reached
  IF current_attempts >= max_attempts THEN
    UPDATE users
    SET locked_until = now() + lockout_duration
    WHERE email = user_email;
  END IF;
END;
$$;

-- Function to handle successful login
CREATE OR REPLACE FUNCTION handle_successful_login(user_email text, ip_addr inet DEFAULT NULL, user_agent_str text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Log the successful attempt
  INSERT INTO login_attempts (email, ip_address, user_agent, success, attempted_at)
  VALUES (user_email, ip_addr, user_agent_str, true, now());
  
  -- Reset failed attempts and unlock account
  UPDATE users
  SET 
    failed_login_attempts = 0,
    locked_until = NULL,
    last_login = now()
  WHERE email = user_email;
END;
$$;

-- Function to create session
CREATE OR REPLACE FUNCTION create_user_session(user_id uuid, ip_addr inet DEFAULT NULL, user_agent_str text DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  session_token text;
  expires_at timestamptz;
BEGIN
  -- Generate secure session token
  session_token := encode(gen_random_bytes(32), 'base64');
  expires_at := now() + interval '24 hours';
  
  -- Invalidate old sessions for this user
  UPDATE user_sessions
  SET is_active = false
  WHERE user_id = create_user_session.user_id;
  
  -- Create new session
  INSERT INTO user_sessions (user_id, session_token, expires_at, ip_address, user_agent)
  VALUES (create_user_session.user_id, session_token, expires_at, ip_addr, user_agent_str);
  
  RETURN session_token;
END;
$$;

-- Function to validate session
CREATE OR REPLACE FUNCTION validate_session(token text)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  session_user_id uuid;
BEGIN
  SELECT user_id INTO session_user_id
  FROM user_sessions
  WHERE session_token = token
    AND is_active = true
    AND expires_at > now();
  
  IF session_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Update session activity
  UPDATE user_sessions
  SET updated_at = now()
  WHERE session_token = token;
  
  RETURN session_user_id;
END;
$$;

-- Insert default permissions for subadmins
INSERT INTO user_permissions (user_id, permission_name, granted_by)
SELECT 
  u.id,
  perm.permission_name,
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
FROM users u
CROSS JOIN (
  VALUES 
    ('view_billboards'),
    ('verify_billboards'),
    ('upload_verification_photos'),
    ('submit_verification_reports'),
    ('view_site_visits'),
    ('manage_verification_history')
) AS perm(permission_name)
WHERE u.role = 'sub_admin'
  AND NOT EXISTS (
    SELECT 1 FROM user_permissions up
    WHERE up.user_id = u.id AND up.permission_name = perm.permission_name
  );

-- Create trigger to automatically assign permissions to new subadmins
CREATE OR REPLACE FUNCTION assign_subadmin_permissions()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  admin_user_id uuid;
  perm text;
BEGIN
  IF NEW.role = 'sub_admin' THEN
    -- Get an admin user to assign permissions
    SELECT id INTO admin_user_id
    FROM users
    WHERE role = 'admin'
    LIMIT 1;
    
    -- Assign default permissions
    FOR perm IN 
      SELECT unnest(ARRAY[
        'view_billboards',
        'verify_billboards', 
        'upload_verification_photos',
        'submit_verification_reports',
        'view_site_visits',
        'manage_verification_history'
      ])
    LOOP
      INSERT INTO user_permissions (user_id, permission_name, granted_by)
      VALUES (NEW.id, perm, admin_user_id)
      ON CONFLICT (user_id, permission_name) DO NOTHING;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new subadmin permission assignment
DROP TRIGGER IF EXISTS assign_permissions_on_subadmin_creation ON users;
CREATE TRIGGER assign_permissions_on_subadmin_creation
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION assign_subadmin_permissions();

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM user_sessions
  WHERE expires_at < now() - interval '1 day';
END;
$$;

-- Create a scheduled job to clean up expired sessions (if pg_cron is available)
-- This would typically be set up separately in production
-- SELECT cron.schedule('cleanup-sessions', '0 2 * * *', 'SELECT cleanup_expired_sessions();');

-- Update existing users to have proper password change tracking
UPDATE users 
SET password_changed_at = created_at 
WHERE password_changed_at IS NULL;

-- Ensure all existing subadmins have proper permissions
DO $$
DECLARE
  subadmin_record users%ROWTYPE;
  admin_user_id uuid;
  perm text;
BEGIN
  -- Get an admin user
  SELECT id INTO admin_user_id
  FROM users
  WHERE role = 'admin'
  LIMIT 1;
  
  -- Loop through all existing subadmins
  FOR subadmin_record IN 
    SELECT * FROM users WHERE role = 'sub_admin'
  LOOP
    -- Assign permissions if they don't exist
    FOR perm IN 
      SELECT unnest(ARRAY[
        'view_billboards',
        'verify_billboards',
        'upload_verification_photos', 
        'submit_verification_reports',
        'view_site_visits',
        'manage_verification_history'
      ])
    LOOP
      INSERT INTO user_permissions (user_id, permission_name, granted_by)
      VALUES (subadmin_record.id, perm, admin_user_id)
      ON CONFLICT (user_id, permission_name) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;