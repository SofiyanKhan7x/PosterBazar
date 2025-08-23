/*
  # Billboard Sample Data Migration

  1. Billboard Types
    - Adds standard billboard types for the platform
    
  2. Sample Billboards
    - Creates billboards in different workflow states (pending, approved, active)
    - Includes proper location data with GPS coordinates
    
  3. Billboard Images
    - Adds sample images for each billboard
    
  4. Workflow Notifications
    - Creates notifications for different user roles
    
  5. Site Visits
    - Adds verification records for approved billboards
    
  6. System Settings
    - Configures billboard workflow settings
*/

-- Ensure billboard_types table has proper structure
INSERT INTO billboard_types (type_name, description, is_active) VALUES 
  ('Digital LED', 'High-resolution digital LED displays with programmable content', true),
  ('Static Vinyl', 'Traditional printed vinyl billboards for long-term campaigns', true),
  ('Backlit Display', 'Illuminated displays for 24/7 visibility', true),
  ('Transit Advertising', 'Mobile advertising on buses, trains, and vehicles', true),
  ('Street Furniture', 'Bus stops, benches, kiosks, and urban furniture advertising', true),
  ('3D Billboard', 'Three-dimensional advertising displays with special effects', true),
  ('Interactive Display', 'Touch-enabled or motion-activated advertising displays', true),
  ('Projection Mapping', 'Large-scale projection advertising on buildings and surfaces', true)
ON CONFLICT (type_name) DO UPDATE SET
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- Add sample billboards in different workflow states
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
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    '22222222-2222-2222-2222-222222222222',
    'Digital Display - Connaught Place',
    'Delhi',
    'New Delhi',
    'Connaught Place, Central Delhi',
    'https://maps.google.com/?q=28.6315,77.2167',
    28.6315,
    77.2167,
    3500.00,
    75000,
    7,
    1,
    '16ft x 32ft',
    'North',
    'LED Display, Weather Resistant, Remote Control, High Brightness',
    'Premium digital billboard in the heart of Delhi with excellent visibility to both pedestrians and vehicles.',
    'pending',
    false,
    now() - interval '2 days',
    now() - interval '2 days'
  ),
  (
    'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    '22222222-2222-2222-2222-222222222222',
    'Highway Billboard - Mumbai-Pune Expressway',
    'Maharashtra',
    'Mumbai',
    'Mumbai-Pune Expressway, Km 25',
    'https://maps.google.com/?q=19.0760,72.8777',
    19.0760,
    72.8777,
    2800.00,
    100000,
    14,
    2,
    '20ft x 60ft',
    'East',
    'Illuminated, Weather Resistant, High Traffic Location',
    'Large format billboard on busy expressway with high vehicle traffic.',
    'approved',
    true,
    now() - interval '5 days',
    now() - interval '1 day'
  ),
  (
    'c3d4e5f6-a7b8-9012-cdef-345678901234',
    '22222222-2222-2222-2222-222222222222',
    'Shopping Mall Digital Screen - Phoenix MarketCity',
    'Karnataka',
    'Bangalore',
    'Phoenix MarketCity, Whitefield, Bangalore',
    'https://maps.google.com/?q=12.9716,77.5946',
    12.9716,
    77.5946,
    4200.00,
    85000,
    5,
    1,
    '12ft x 24ft',
    'South',
    'Indoor Display, High Resolution, Sound Capability, Climate Controlled',
    'Premium indoor digital display in one of Bangalore''s busiest shopping destinations.',
    'active',
    true,
    now() - interval '10 days',
    now() - interval '3 days'
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  status = EXCLUDED.status,
  updated_at = now();

-- Add billboard images for the sample billboards
INSERT INTO billboard_images (
  billboard_id,
  image_url,
  image_type,
  display_order
) VALUES 
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'https://images.pexels.com/photos/1666065/pexels-photo-1666065.jpeg',
    'main',
    1
  ),
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'https://images.pexels.com/photos/2422915/pexels-photo-2422915.jpeg',
    'additional',
    2
  ),
  (
    'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    'https://images.pexels.com/photos/3951355/pexels-photo-3951355.jpeg',
    'main',
    1
  ),
  (
    'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    'https://images.pexels.com/photos/1036657/pexels-photo-1036657.jpeg',
    'additional',
    2
  ),
  (
    'c3d4e5f6-a7b8-9012-cdef-345678901234',
    'https://images.pexels.com/photos/1738986/pexels-photo-1738986.jpeg',
    'main',
    1
  ),
  (
    'c3d4e5f6-a7b8-9012-cdef-345678901234',
    'https://images.pexels.com/photos/2422915/pexels-photo-2422915.jpeg',
    'additional',
    2
  )
ON CONFLICT (billboard_id, image_url) DO NOTHING;

-- Add sample notifications for the workflow
INSERT INTO notifications (
  user_id,
  title,
  message,
  type,
  is_read,
  related_id,
  related_type,
  created_at
) VALUES 
  (
    '44444444-4444-4444-4444-444444444444', -- Admin user
    'New Billboard Submission',
    'A new billboard "Digital Display - Connaught Place" has been submitted for approval by Demo Owner.',
    'info',
    false,
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'billboard',
    now() - interval '2 days'
  ),
  (
    '55555555-5555-5555-5555-555555555555', -- Sub-admin user
    'Billboard Ready for Verification',
    'Billboard "Highway Billboard - Mumbai-Pune Expressway" has been approved and needs physical verification.',
    'info',
    false,
    'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    'billboard',
    now() - interval '1 day'
  ),
  (
    '22222222-2222-2222-2222-222222222222', -- Owner user
    'Billboard Approved',
    'Your billboard "Highway Billboard - Mumbai-Pune Expressway" has been approved by admin and is now pending physical verification.',
    'success',
    false,
    'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    'billboard',
    now() - interval '1 day'
  ),
  (
    '22222222-2222-2222-2222-222222222222', -- Owner user
    'Billboard Activated',
    'Your billboard "Shopping Mall Digital Screen - Phoenix MarketCity" has been verified and is now live on the platform!',
    'success',
    true,
    'c3d4e5f6-a7b8-9012-cdef-345678901234',
    'billboard',
    now() - interval '3 days'
  )
ON CONFLICT (id) DO NOTHING;

-- Add sample site visit for the approved billboard
INSERT INTO site_visits (
  id,
  billboard_id,
  sub_admin_id,
  visit_date,
  owner_selfie_url,
  billboard_photo_url,
  verification_notes,
  is_verified,
  created_at
) VALUES 
  (
    'd4e5f6a7-b8c9-0123-defb-456789012345',
    'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    '55555555-5555-5555-5555-555555555555',
    now() - interval '6 hours',
    'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
    'https://images.pexels.com/photos/3951355/pexels-photo-3951355.jpeg',
    'Billboard verified successfully. Location matches description, structure is in good condition, and visibility is excellent.',
    true,
    now() - interval '6 hours'
  ),
  (
    'e5f6a7b8-c9d0-1234-efab-567890123456',
    'c3d4e5f6-a7b8-9012-cdef-345678901234',
    '55555555-5555-5555-5555-555555555555',
    now() - interval '4 days',
    'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
    'https://images.pexels.com/photos/1738986/pexels-photo-1738986.jpeg',
    'Excellent indoor location with high footfall. Display quality is outstanding and location is as described.',
    true,
    now() - interval '4 days'
  )
ON CONFLICT (id) DO NOTHING;

-- Update system settings for billboard workflow
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES 
  ('billboard_approval_required', 'true', 'boolean', 'Whether billboards require admin approval before going live'),
  ('site_verification_required', 'true', 'boolean', 'Whether billboards require physical site verification'),
  ('auto_approve_verified_owners', 'false', 'boolean', 'Auto-approve billboards from verified owners'),
  ('max_billboard_images', '5', 'number', 'Maximum number of images allowed per billboard'),
  ('min_billboard_price', '500', 'number', 'Minimum price per day for billboards in INR')
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  description = EXCLUDED.description,
  updated_at = now();