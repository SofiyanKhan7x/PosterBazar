/*
  # Create user session RPC function

  1. New Functions
    - `create_user_session` - Creates a new user session with proper token generation
    - `validate_session` - Validates an existing session token
    - `handle_failed_login` - Handles failed login attempts and account locking
    - `handle_successful_login` - Handles successful login attempts
    - `is_account_locked` - Checks if an account is locked

  2. Security
    - All functions use proper column qualification to avoid ambiguity
    - Session tokens are securely generated
    - Account lockout mechanism implemented
*/

-- Function to create a new user session
CREATE OR REPLACE FUNCTION create_user_session(
  user_id uuid,
  ip_addr inet DEFAULT NULL,
  user_agent_str text DEFAULT NULL
) RETURNS text AS $$
DECLARE
  session_token text;
  expires_at timestamptz;
BEGIN
  -- Generate a secure session token
  session_token := 'session_' || extract(epoch from now()) || '_' || encode(gen_random_bytes(16), 'hex');
  expires_at := now() + interval '24 hours';
  
  -- Insert the session
  INSERT INTO user_sessions (user_id, session_token, expires_at, ip_address, user_agent, is_active)
  VALUES (user_id, session_token, expires_at, ip_addr, user_agent_str, true);
  
  RETURN session_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate a session token
CREATE OR REPLACE FUNCTION validate_session(token text) RETURNS uuid AS $$
DECLARE
  session_user_id uuid;
BEGIN
  SELECT user_sessions.user_id INTO session_user_id
  FROM user_sessions
  WHERE user_sessions.session_token = token
    AND user_sessions.is_active = true
    AND user_sessions.expires_at > now();
  
  RETURN session_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle failed login attempts
CREATE OR REPLACE FUNCTION handle_failed_login(
  user_email text,
  ip_addr inet DEFAULT NULL,
  user_agent_str text DEFAULT NULL
) RETURNS void AS $$
DECLARE
  user_record users%ROWTYPE;
  new_attempt_count integer;
BEGIN
  -- Log the failed attempt
  INSERT INTO login_attempts (email, ip_address, user_agent, success, failure_reason)
  VALUES (user_email, ip_addr, user_agent_str, false, 'Invalid credentials');
  
  -- Get user record
  SELECT * INTO user_record FROM users WHERE users.email = user_email;
  
  IF FOUND THEN
    -- Increment failed attempts
    new_attempt_count := COALESCE(user_record.failed_login_attempts, 0) + 1;
    
    -- Lock account if too many attempts
    IF new_attempt_count >= 5 THEN
      UPDATE users 
      SET failed_login_attempts = new_attempt_count,
          locked_until = now() + interval '30 minutes'
      WHERE users.email = user_email;
    ELSE
      UPDATE users 
      SET failed_login_attempts = new_attempt_count
      WHERE users.email = user_email;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle successful login
CREATE OR REPLACE FUNCTION handle_successful_login(
  user_email text,
  ip_addr inet DEFAULT NULL,
  user_agent_str text DEFAULT NULL
) RETURNS void AS $$
BEGIN
  -- Log the successful attempt
  INSERT INTO login_attempts (email, ip_address, user_agent, success)
  VALUES (user_email, ip_addr, user_agent_str, true);
  
  -- Reset failed attempts and unlock account
  UPDATE users 
  SET failed_login_attempts = 0,
      locked_until = NULL,
      last_login = now()
  WHERE users.email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if account is locked
CREATE OR REPLACE FUNCTION is_account_locked(user_email text) RETURNS boolean AS $$
DECLARE
  user_record users%ROWTYPE;
BEGIN
  SELECT * INTO user_record FROM users WHERE users.email = user_email;
  
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
    WHERE users.email = user_email;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;