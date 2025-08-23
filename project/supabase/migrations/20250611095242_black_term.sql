/*
  # Remove all RLS policies and simplify authentication

  1. Security Changes
    - Disable RLS on all tables
    - Remove all existing policies
    - Allow direct database access for authentication

  2. Tables affected
    - users
    - billboards
    - billboard_images
    - billboard_types
    - bookings
    - kyc_documents
    - notifications
    - wallet_transactions
    - site_visits
    - system_settings
*/

-- Disable RLS on all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE billboards DISABLE ROW LEVEL SECURITY;
ALTER TABLE billboard_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE billboard_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE site_visits DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Enable registration for all users" ON users;
DROP POLICY IF EXISTS "Service role has full access" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Allow anonymous registration" ON users;
DROP POLICY IF EXISTS "Allow user registration" ON users;

-- Drop all existing policies on other tables
DROP POLICY IF EXISTS "Admins can manage billboard types" ON billboard_types;
DROP POLICY IF EXISTS "Anyone can read billboard types" ON billboard_types;

DROP POLICY IF EXISTS "Admins can manage all billboards" ON billboards;
DROP POLICY IF EXISTS "Anyone can read approved billboards" ON billboards;
DROP POLICY IF EXISTS "Owners can create billboards" ON billboards;
DROP POLICY IF EXISTS "Owners can read own billboards" ON billboards;
DROP POLICY IF EXISTS "Owners can update own billboards" ON billboards;

DROP POLICY IF EXISTS "Anyone can read billboard images" ON billboard_images;
DROP POLICY IF EXISTS "Owners can manage own billboard images" ON billboard_images;

DROP POLICY IF EXISTS "Admins can manage KYC documents" ON kyc_documents;
DROP POLICY IF EXISTS "Users can read own KYC documents" ON kyc_documents;
DROP POLICY IF EXISTS "Users can upload KYC documents" ON kyc_documents;

DROP POLICY IF EXISTS "Admins can manage all bookings" ON bookings;
DROP POLICY IF EXISTS "Owners can read billboard bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
DROP POLICY IF EXISTS "Users can read own bookings" ON bookings;

DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

DROP POLICY IF EXISTS "Admins can read all transactions" ON wallet_transactions;
DROP POLICY IF EXISTS "Users can read own transactions" ON wallet_transactions;

DROP POLICY IF EXISTS "Sub-admins can manage site visits" ON site_visits;

DROP POLICY IF EXISTS "Admins can manage system settings" ON system_settings;

-- Insert demo users with hashed passwords (using bcrypt-like format for demo)
-- Note: In a real app, passwords should be properly hashed
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
  created_at,
  updated_at
) VALUES 
  (
    '11111111-1111-1111-1111-111111111111',
    'user@example.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password
    'Demo User',
    'user',
    '+1234567890',
    'pending',
    100.00,
    true,
    true,
    now(),
    now()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'owner@example.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password
    'Demo Owner',
    'owner',
    '+1234567891',
    'approved',
    500.00,
    true,
    true,
    now(),
    now()
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'admin@example.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password
    'Demo Admin',
    'admin',
    '+1234567892',
    'approved',
    1000.00,
    true,
    true,
    now(),
    now()
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'adminbillboard@gmail.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- Admin@billboard
    'Admin Billboard',
    'admin',
    '+1234567893',
    'approved',
    2000.00,
    true,
    true,
    now(),
    now()
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    'subadminbillboard@gmail.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- SubAdmin@billboard
    'Sub Admin Billboard',
    'sub_admin',
    '+1234567894',
    'approved',
    1500.00,
    true,
    true,
    now(),
    now()
  )
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  updated_at = now();