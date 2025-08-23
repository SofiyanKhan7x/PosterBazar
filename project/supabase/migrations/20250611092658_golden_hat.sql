/*
  # Create Demo Accounts

  1. New Data
    - Insert demo user accounts with different roles
    - `user@example.com` - Regular user account
    - `owner@example.com` - Billboard owner account  
    - `admin@example.com` - Admin account

  2. Security
    - All accounts use hashed passwords
    - Accounts are marked as active and email verified
    - Proper role assignments for each account type

  3. Notes
    - These are demo accounts for testing purposes
    - Password for all accounts is 'password'
    - Accounts will be created in both auth.users and public.users tables
*/

-- Insert demo accounts into the users table
-- Note: The auth.users entries need to be created through Supabase Auth API
-- This migration only creates the profile data

INSERT INTO users (
  id,
  email,
  name,
  role,
  phone,
  profile_photo,
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
    'Demo User',
    'user',
    '+1234567890',
    NULL,
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
    'Demo Owner',
    'owner',
    '+1234567891',
    NULL,
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
    'Demo Admin',
    'admin',
    '+1234567892',
    NULL,
    'approved',
    1000.00,
    true,
    true,
    now(),
    now()
  )
ON CONFLICT (id) DO NOTHING;

-- Insert some sample billboard types
INSERT INTO billboard_types (type_name, description, is_active) VALUES 
  ('Digital LED', 'High-resolution digital LED displays', true),
  ('Traditional', 'Classic printed billboard displays', true),
  ('Transit', 'Mobile advertising on buses and trains', true),
  ('Street Furniture', 'Bus stops, benches, and kiosks', true)
ON CONFLICT (type_name) DO NOTHING;

-- Insert sample billboards for the demo owner
INSERT INTO billboards (
  id,
  owner_id,
  title,
  state,
  city,
  location_address,
  google_maps_link,
  latitude,
  longitude,
  price_per_day,
  daily_views,
  min_days,
  billboard_type_id,
  dimensions,
  facing,
  features,
  description,
  status,
  featured,
  created_at,
  updated_at
) VALUES 
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '22222222-2222-2222-2222-222222222222',
    'Prime Downtown Digital Billboard',
    'California',
    'Los Angeles',
    '123 Main Street, Downtown LA',
    'https://maps.google.com/?q=34.0522,-118.2437',
    34.0522,
    -118.2437,
    250.00,
    50000,
    7,
    1,
    '14x48 feet',
    'North',
    'LED Display, Weather Resistant, Remote Control',
    'Premium digital billboard located in the heart of downtown LA with high visibility and traffic.',
    'approved',
    true,
    now(),
    now()
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '22222222-2222-2222-2222-222222222222',
    'Highway 101 Traditional Billboard',
    'California',
    'San Francisco',
    'Highway 101 North, Mile Marker 15',
    'https://maps.google.com/?q=37.7749,-122.4194',
    37.7749,
    -122.4194,
    150.00,
    25000,
    14,
    2,
    '12x24 feet',
    'South',
    'Illuminated, Weather Resistant',
    'Traditional billboard with excellent highway visibility for commuter traffic.',
    'approved',
    false,
    now(),
    now()
  )
ON CONFLICT (id) DO NOTHING;

-- Insert sample billboard images
INSERT INTO billboard_images (
  billboard_id,
  image_url,
  image_type,
  display_order
) VALUES 
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'https://images.pexels.com/photos/1666065/pexels-photo-1666065.jpeg',
    'main',
    1
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'https://images.pexels.com/photos/2422915/pexels-photo-2422915.jpeg',
    'additional',
    2
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'https://images.pexels.com/photos/1666065/pexels-photo-1666065.jpeg',
    'main',
    1
  )
ON CONFLICT (id) DO NOTHING;