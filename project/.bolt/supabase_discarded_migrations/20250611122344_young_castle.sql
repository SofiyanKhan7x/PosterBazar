/*
  # Add Sub-Admin Management Support

  1. New Functions
    - Add function to create sub-admin users
    - Add function to reset sub-admin passwords
    - Add function to manage sub-admin permissions
  
  2. Security
    - Add RLS policies for sub-admin access
    - Ensure proper role-based access control
*/

-- Add additional fields to site_visits table for better verification data
ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS location_accuracy TEXT;
ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS structural_condition TEXT;
ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS visibility_rating INTEGER;
ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS issues_found TEXT[];
ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS recommendations TEXT;
ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS accessibility_notes TEXT;

-- Create a function to update wallet balance
CREATE OR REPLACE FUNCTION update_wallet_balance(
  p_user_id UUID,
  p_amount NUMERIC,
  p_type transaction_type
)
RETURNS VOID AS $$
BEGIN
  IF p_type = 'credit' OR p_type = 'refund' THEN
    UPDATE users SET wallet_balance = wallet_balance + p_amount WHERE id = p_user_id;
  ELSIF p_type = 'debit' OR p_type = 'commission' THEN
    UPDATE users SET wallet_balance = wallet_balance - ABS(p_amount) WHERE id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a function to generate a random password
CREATE OR REPLACE FUNCTION generate_random_password(length INTEGER DEFAULT 12)
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  result TEXT := '';
  i INTEGER := 0;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars))::integer + 1, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create a function to create a sub-admin user
CREATE OR REPLACE FUNCTION create_sub_admin(
  p_name TEXT,
  p_email TEXT,
  p_password TEXT,
  p_phone TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_password TEXT;
BEGIN
  -- Generate a password if not provided
  IF p_password IS NULL THEN
    v_password := generate_random_password();
  ELSE
    v_password := p_password;
  END IF;
  
  -- Insert the new sub-admin user
  INSERT INTO users (
    email,
    password_hash,
    name,
    role,
    phone,
    kyc_status,
    is_active,
    email_verified
  ) VALUES (
    p_email,
    crypt(v_password, gen_salt('bf')), -- In a real app, use proper password hashing
    p_name,
    'sub_admin',
    p_phone,
    'approved',
    TRUE,
    TRUE
  ) RETURNING id INTO v_user_id;
  
  -- Create a notification for the admin
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    related_id,
    related_type
  ) VALUES (
    '44444444-4444-4444-4444-444444444444', -- Admin user ID
    'New Sub-Admin Added',
    'A new sub-admin account has been created for ' || p_name,
    'info',
    v_user_id,
    'user'
  );
  
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- Create a function to reset a sub-admin's password
CREATE OR REPLACE FUNCTION reset_sub_admin_password(
  p_user_id UUID,
  p_new_password TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  v_password TEXT;
BEGIN
  -- Generate a new password if not provided
  IF p_new_password IS NULL THEN
    v_password := generate_random_password();
  ELSE
    v_password := p_new_password;
  END IF;
  
  -- Update the user's password
  UPDATE users
  SET password_hash = crypt(v_password, gen_salt('bf'))
  WHERE id = p_user_id AND role = 'sub_admin';
  
  -- Create a notification for the sub-admin
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    related_id,
    related_type
  ) VALUES (
    p_user_id,
    'Password Reset',
    'Your password has been reset by an administrator. Please log in with your new password.',
    'warning',
    p_user_id,
    'user'
  );
  
  RETURN v_password;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies for sub-admin access
ALTER TABLE billboards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do anything with billboards"
  ON billboards
  FOR ALL
  TO admin
  USING (true);

CREATE POLICY "Sub-admins can view billboards"
  ON billboards
  FOR SELECT
  TO sub_admin
  USING (status = 'approved' OR status = 'active');

CREATE POLICY "Sub-admins can update verified billboards"
  ON billboards
  FOR UPDATE
  TO sub_admin
  USING (status = 'approved')
  WITH CHECK (status IN ('active', 'rejected'));

-- Add RLS policies for site visits
ALTER TABLE site_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do anything with site visits"
  ON site_visits
  FOR ALL
  TO admin
  USING (true);

CREATE POLICY "Sub-admins can view their own site visits"
  ON site_visits
  FOR SELECT
  TO sub_admin
  USING (sub_admin_id = auth.uid());

CREATE POLICY "Sub-admins can create site visits"
  ON site_visits
  FOR INSERT
  TO sub_admin
  WITH CHECK (sub_admin_id = auth.uid());

-- Add RLS policies for users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do anything with users"
  ON users
  FOR ALL
  TO admin
  USING (true);

CREATE POLICY "Sub-admins can view their own profile"
  ON users
  FOR SELECT
  TO sub_admin
  USING (id = auth.uid() OR role = 'owner');

CREATE POLICY "Sub-admins can update their own profile"
  ON users
  FOR UPDATE
  TO sub_admin
  USING (id = auth.uid())
  WITH CHECK (role = 'sub_admin' AND id = auth.uid());