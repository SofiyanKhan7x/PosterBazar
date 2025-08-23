/*
  # Complete Demo Data Migration

  1. New Data
    - Billboard types (Digital LED, Static Vinyl, etc.)
    - Demo billboards with realistic data
    - Billboard images for each billboard
    - System settings for platform configuration

  2. Security
    - All data respects existing RLS policies
    - Proper relationships between tables
    - Realistic demo scenarios

  Note: Demo users must be created manually through Supabase Auth dashboard
  as they need to exist in auth.users table first.
*/

-- Insert billboard types only if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM billboard_types WHERE type_name = 'Digital LED') THEN
    INSERT INTO billboard_types (type_name, description, is_active) VALUES
      ('Digital LED', 'High-resolution digital LED displays with programmable content', true),
      ('Static Vinyl', 'Traditional static billboards with printed vinyl graphics', true),
      ('Backlit Display', 'Illuminated displays for enhanced visibility', true),
      ('Transit Advertising', 'Mobile advertising on buses, trains, and other transit', true),
      ('Street Furniture', 'Bus stops, kiosks, and other street-level advertising', true);
  END IF;
END $$;

-- Insert system settings using individual INSERT statements with ON CONFLICT
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) 
VALUES ('platform_commission', '10', 'number', 'Platform commission percentage')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO system_settings (setting_key, setting_value, setting_type, description) 
VALUES ('gst_rate', '18', 'number', 'GST rate percentage')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO system_settings (setting_key, setting_value, setting_type, description) 
VALUES ('min_booking_days', '1', 'number', 'Minimum booking days allowed')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO system_settings (setting_key, setting_value, setting_type, description) 
VALUES ('max_booking_days', '365', 'number', 'Maximum booking days allowed')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO system_settings (setting_key, setting_value, setting_type, description) 
VALUES ('auto_approval_enabled', 'false', 'boolean', 'Enable automatic booking approval')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO system_settings (setting_key, setting_value, setting_type, description) 
VALUES ('email_notifications', 'true', 'boolean', 'Enable email notifications')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO system_settings (setting_key, setting_value, setting_type, description) 
VALUES ('sms_notifications', 'false', 'boolean', 'Enable SMS notifications')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO system_settings (setting_key, setting_value, setting_type, description) 
VALUES ('maintenance_mode', 'false', 'boolean', 'Enable maintenance mode')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO system_settings (setting_key, setting_value, setting_type, description) 
VALUES ('default_currency', 'INR', 'string', 'Default platform currency')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO system_settings (setting_key, setting_value, setting_type, description) 
VALUES ('support_email', 'support@billboardhub.com', 'string', 'Support contact email')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO system_settings (setting_key, setting_value, setting_type, description) 
VALUES ('support_phone', '+91-1800-123-4567', 'string', 'Support contact phone')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO system_settings (setting_key, setting_value, setting_type, description) 
VALUES ('platform_name', 'BillboardHub', 'string', 'Platform display name')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO system_settings (setting_key, setting_value, setting_type, description) 
VALUES ('max_file_size', '10', 'number', 'Maximum file upload size in MB')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO system_settings (setting_key, setting_value, setting_type, description) 
VALUES ('allowed_file_types', 'jpg,jpeg,png,pdf', 'string', 'Allowed file upload types')
ON CONFLICT (setting_key) DO NOTHING;

-- Note: Demo users and related data (billboards, bookings, etc.) have been removed
-- from this migration as they require users to exist in auth.users first.
-- 
-- To set up demo data:
-- 1. Create demo users manually in Supabase Auth dashboard:
--    - admin@billboardhub.com (password: password)
--    - owner1@example.com (password: password)  
--    - owner2@example.com (password: password)
--    - user1@example.com (password: password)
--    - user2@example.com (password: password)
-- 
-- 2. After creating auth users, update their profiles in the users table:
--    UPDATE users SET role = 'admin', name = 'Admin User' WHERE email = 'admin@billboardhub.com';
--    UPDATE users SET role = 'owner', name = 'Rajesh Sharma' WHERE email = 'owner1@example.com';
--    UPDATE users SET role = 'owner', name = 'Priya Patel' WHERE email = 'owner2@example.com';
--    UPDATE users SET role = 'user', name = 'Sneha Reddy' WHERE email = 'user1@example.com';
--    UPDATE users SET role = 'user', name = 'Vikram Singh' WHERE email = 'user2@example.com';
--
-- 3. Then you can add demo billboards, bookings, and other related data manually
--    or through the application interface.