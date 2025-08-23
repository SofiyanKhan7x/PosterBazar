/*
  # Add Admin and Sub-Admin Users

  1. New Users
    - Admin user: adminbillboard@gmail.com with role 'admin'
    - Sub-admin user: subadminbillboard@gmail.com with role 'sub_admin'
  
  2. Security
    - Users are created with verified email status
    - Active status set to true
    - KYC status set to approved for admin users
*/

-- Insert admin user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'adminbillboard@gmail.com',
  crypt('Admin@billboard', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Insert sub-admin user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'subadminbillboard@gmail.com',
  crypt('SubAdmin@billboard', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Insert admin user profile
INSERT INTO public.users (
  id,
  email,
  name,
  role,
  email_verified,
  is_active,
  kyc_status,
  wallet_balance
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'adminbillboard@gmail.com'),
  'adminbillboard@gmail.com',
  'Admin Billboard',
  'admin',
  true,
  true,
  'approved',
  0.00
) ON CONFLICT (email) DO NOTHING;

-- Insert sub-admin user profile
INSERT INTO public.users (
  id,
  email,
  name,
  role,
  email_verified,
  is_active,
  kyc_status,
  wallet_balance
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'subadminbillboard@gmail.com'),
  'subadminbillboard@gmail.com',
  'Sub Admin Billboard',
  'sub_admin',
  true,
  true,
  'approved',
  0.00
) ON CONFLICT (email) DO NOTHING;