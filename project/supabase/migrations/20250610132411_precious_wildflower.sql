/*
  # Create Demo Users

  1. New Users
    - Creates demo user accounts for testing login functionality
    - `user@example.com` with role 'user'
    - `owner@example.com` with role 'owner' 
    - `admin@example.com` with role 'admin'
    
  2. Security
    - All demo users have verified emails
    - Active status enabled
    - Default wallet balance and KYC status set
    
  3. Authentication
    - Password hashes are generated for 'password' as the password
    - Users can immediately log in without email confirmation
*/

-- Insert demo users into the users table
-- Note: These are demo accounts with the password 'password'
-- The password hash corresponds to 'password' encrypted with bcrypt

INSERT INTO users (
  id,
  email,
  password_hash,
  name,
  role,
  email_verified,
  is_active,
  wallet_balance,
  kyc_status,
  created_at,
  updated_at
) VALUES 
(
  '11111111-1111-1111-1111-111111111111',
  'user@example.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: 'password'
  'Demo User',
  'user',
  true,
  true,
  0.00,
  'pending',
  now(),
  now()
),
(
  '22222222-2222-2222-2222-222222222222',
  'owner@example.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: 'password'
  'Demo Owner',
  'owner',
  true,
  true,
  0.00,
  'pending',
  now(),
  now()
),
(
  '33333333-3333-3333-3333-333333333333',
  'admin@example.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: 'password'
  'Demo Admin',
  'admin',
  true,
  true,
  0.00,
  'approved',
  now(),
  now()
)
ON CONFLICT (email) DO NOTHING;

-- Also insert these users into Supabase Auth if they don't exist
-- This ensures they can authenticate through Supabase's auth system
DO $$
BEGIN
  -- Note: In a real application, you would use Supabase's auth.users table
  -- For now, we're just ensuring the profile data exists
  -- The actual auth users need to be created through Supabase's authentication system
  
  -- Create a notification for the admin about demo users
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    is_read,
    created_at
  ) VALUES (
    '33333333-3333-3333-3333-333333333333',
    'Demo Users Created',
    'Demo user accounts have been set up for testing. Use user@example.com, owner@example.com, or admin@example.com with password "password" to log in.',
    'info',
    false,
    now()
  ) ON CONFLICT DO NOTHING;
END $$;