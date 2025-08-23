/*
  # Complete Demo Data Migration

  1. New Data
    - Billboard types (Digital LED, Static Vinyl, etc.)
    - Demo users with different roles and statuses
    - Demo billboards with realistic data
    - Billboard images for each billboard
    - KYC documents for billboard owners
    - Demo bookings with different statuses
    - Wallet transactions showing payments and commissions
    - Notifications for all user interactions
    - Site visit records for verification
    - System settings for platform configuration

  2. Security
    - All data respects existing RLS policies
    - Proper relationships between tables
    - Realistic demo scenarios
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

-- Insert demo users only if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@billboardhub.com') THEN
    INSERT INTO users (email, password_hash, name, role, phone, kyc_status, wallet_balance, email_verified) VALUES
      ('admin@billboardhub.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin User', 'admin'::user_role, '+91-9876543210', 'approved'::kyc_status, 0.00, true),
      ('subadmin@billboardhub.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sub Admin', 'sub_admin'::user_role, '+91-9876543211', 'approved'::kyc_status, 0.00, true),
      ('owner1@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Rajesh Sharma', 'owner'::user_role, '+91-9876543212', 'approved'::kyc_status, 25000.00, true),
      ('owner2@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Priya Patel', 'owner'::user_role, '+91-9876543213', 'approved'::kyc_status, 18500.00, true),
      ('owner3@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Amit Kumar', 'owner'::user_role, '+91-9876543214', 'submitted'::kyc_status, 0.00, true),
      ('user1@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sneha Reddy', 'user'::user_role, '+91-9876543215', 'pending'::kyc_status, 5000.00, true),
      ('user2@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Vikram Singh', 'user'::user_role, '+91-9876543216', 'pending'::kyc_status, 12000.00, true),
      ('owner4@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Deepika Nair', 'owner'::user_role, '+91-9876543217', 'pending'::kyc_status, 0.00, true);
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

-- Insert related data using a DO block to handle relationships
DO $$
DECLARE
  admin_id uuid;
  subadmin_id uuid;
  owner1_id uuid;
  owner2_id uuid;
  owner3_id uuid;
  user1_id uuid;
  user2_id uuid;
  owner4_id uuid;
  billboard1_id uuid;
  billboard2_id uuid;
  billboard3_id uuid;
  billboard4_id uuid;
  billboard5_id uuid;
  booking1_id uuid;
  booking2_id uuid;
  booking3_id uuid;
  digital_type_id integer;
  static_type_id integer;
BEGIN
  -- Get user IDs
  SELECT id INTO admin_id FROM users WHERE email = 'admin@billboardhub.com';
  SELECT id INTO subadmin_id FROM users WHERE email = 'subadmin@billboardhub.com';
  SELECT id INTO owner1_id FROM users WHERE email = 'owner1@example.com';
  SELECT id INTO owner2_id FROM users WHERE email = 'owner2@example.com';
  SELECT id INTO owner3_id FROM users WHERE email = 'owner3@example.com';
  SELECT id INTO user1_id FROM users WHERE email = 'user1@example.com';
  SELECT id INTO user2_id FROM users WHERE email = 'user2@example.com';
  SELECT id INTO owner4_id FROM users WHERE email = 'owner4@example.com';

  -- Get billboard type IDs
  SELECT id INTO digital_type_id FROM billboard_types WHERE type_name = 'Digital LED';
  SELECT id INTO static_type_id FROM billboard_types WHERE type_name = 'Static Vinyl';

  -- Insert demo billboards only if they don't exist
  IF NOT EXISTS (SELECT 1 FROM billboards WHERE title = 'Premium Digital Billboard - Bandra Kurla Complex') THEN
    INSERT INTO billboards (owner_id, title, state, city, location_address, google_maps_link, latitude, longitude, price_per_day, daily_views, min_days, billboard_type_id, dimensions, facing, features, description, status, featured, approved_by, approved_at) VALUES
      (owner1_id, 'Premium Digital Billboard - Bandra Kurla Complex', 'Maharashtra', 'Mumbai', 'Bandra Kurla Complex, Near MMRDA Grounds, Mumbai', 'https://maps.google.com/?q=19.0596,72.8656', 19.0596, 72.8656, 25000.00, 50000, 7, digital_type_id, '14ft x 48ft', 'North', 'High-resolution LED display, 24/7 visibility, Weather-resistant, Remote content management', 'Premium digital billboard located in the heart of Mumbai business district. Perfect for reaching corporate professionals and high-income demographics.', 'approved'::billboard_status, true, admin_id, now()),
      (owner2_id, 'Highway Billboard - Pune-Mumbai Expressway', 'Maharashtra', 'Pune', 'Pune-Mumbai Expressway, Near Lonavala Exit', 'https://maps.google.com/?q=18.7537,73.4371', 18.7537, 73.4371, 18000.00, 75000, 10, static_type_id, '20ft x 60ft', 'East', 'High-traffic location, Illuminated at night, Weather-resistant vinyl, Easy installation', 'Massive highway billboard on the busy Pune-Mumbai expressway. Ideal for reaching travelers and commuters.', 'approved'::billboard_status, true, admin_id, now()),
      (owner1_id, 'Shopping Mall Digital Display - Forum Mall', 'Karnataka', 'Bangalore', 'Forum Mall, Koramangala, Bangalore', 'https://maps.google.com/?q=12.9352,77.6245', 12.9352, 77.6245, 15000.00, 30000, 5, digital_type_id, '10ft x 20ft', 'South', 'Indoor location, High footfall area, HD display, Sound capability', 'Digital display inside one of Bangalore most popular shopping destinations.', 'approved'::billboard_status, true, admin_id, now()),
      (owner2_id, 'Metro Station Billboard - Rajiv Chowk', 'Delhi', 'New Delhi', 'Rajiv Chowk Metro Station, Connaught Place', 'https://maps.google.com/?q=28.6328,77.2197', 28.6328, 77.2197, 22000.00, 80000, 7, static_type_id, '12ft x 40ft', 'West', 'Metro station location, High commuter traffic, Backlit display, Prime positioning', 'Strategic billboard placement at one of Delhi busiest metro stations.', 'approved'::billboard_status, false, admin_id, now()),
      (owner3_id, 'IT Park Digital Screen - HITEC City', 'Telangana', 'Hyderabad', 'HITEC City, Madhapur, Hyderabad', 'https://maps.google.com/?q=17.4485,78.3908', 17.4485, 78.3908, 20000.00, 40000, 14, digital_type_id, '16ft x 32ft', 'North', 'Tech hub location, Professional audience, 4K display, Programmable content', 'Premium digital billboard in Hyderabad major IT corridor.', 'pending'::billboard_status, false, null, null);
  END IF;

  -- Get billboard IDs
  SELECT id INTO billboard1_id FROM billboards WHERE title = 'Premium Digital Billboard - Bandra Kurla Complex';
  SELECT id INTO billboard2_id FROM billboards WHERE title = 'Highway Billboard - Pune-Mumbai Expressway';
  SELECT id INTO billboard3_id FROM billboards WHERE title = 'Shopping Mall Digital Display - Forum Mall';
  SELECT id INTO billboard4_id FROM billboards WHERE title = 'Metro Station Billboard - Rajiv Chowk';
  SELECT id INTO billboard5_id FROM billboards WHERE title = 'IT Park Digital Screen - HITEC City';

  -- Insert billboard images only if they don't exist
  IF NOT EXISTS (SELECT 1 FROM billboard_images WHERE billboard_id = billboard1_id) THEN
    INSERT INTO billboard_images (billboard_id, image_url, image_type, display_order) VALUES
      (billboard1_id, 'https://images.pexels.com/photos/1036657/pexels-photo-1036657.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', 'main', 1),
      (billboard1_id, 'https://images.pexels.com/photos/3951355/pexels-photo-3951355.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', 'additional', 2),
      (billboard1_id, 'https://images.pexels.com/photos/1738986/pexels-photo-1738986.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', 'additional', 3);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM billboard_images WHERE billboard_id = billboard2_id) THEN
    INSERT INTO billboard_images (billboard_id, image_url, image_type, display_order) VALUES
      (billboard2_id, 'https://images.pexels.com/photos/3951355/pexels-photo-3951355.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', 'main', 1),
      (billboard2_id, 'https://images.pexels.com/photos/1036657/pexels-photo-1036657.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', 'additional', 2),
      (billboard2_id, 'https://images.pexels.com/photos/2422915/pexels-photo-2422915.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', 'additional', 3);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM billboard_images WHERE billboard_id = billboard3_id) THEN
    INSERT INTO billboard_images (billboard_id, image_url, image_type, display_order) VALUES
      (billboard3_id, 'https://images.pexels.com/photos/1738986/pexels-photo-1738986.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', 'main', 1),
      (billboard3_id, 'https://images.pexels.com/photos/3951355/pexels-photo-3951355.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', 'additional', 2),
      (billboard3_id, 'https://images.pexels.com/photos/1036657/pexels-photo-1036657.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', 'additional', 3);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM billboard_images WHERE billboard_id = billboard4_id) THEN
    INSERT INTO billboard_images (billboard_id, image_url, image_type, display_order) VALUES
      (billboard4_id, 'https://images.pexels.com/photos/2422915/pexels-photo-2422915.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', 'main', 1),
      (billboard4_id, 'https://images.pexels.com/photos/1036657/pexels-photo-1036657.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', 'additional', 2),
      (billboard4_id, 'https://images.pexels.com/photos/3951355/pexels-photo-3951355.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', 'additional', 3);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM billboard_images WHERE billboard_id = billboard5_id) THEN
    INSERT INTO billboard_images (billboard_id, image_url, image_type, display_order) VALUES
      (billboard5_id, 'https://images.pexels.com/photos/1036657/pexels-photo-1036657.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', 'main', 1),
      (billboard5_id, 'https://images.pexels.com/photos/1738986/pexels-photo-1738986.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', 'additional', 2),
      (billboard5_id, 'https://images.pexels.com/photos/2422915/pexels-photo-2422915.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', 'additional', 3);
  END IF;

  -- Insert KYC documents only if they don't exist
  IF NOT EXISTS (SELECT 1 FROM kyc_documents WHERE user_id = owner1_id) THEN
    INSERT INTO kyc_documents (user_id, document_type, document_url, status, reviewed_by, reviewed_at) VALUES
      (owner1_id, 'profile_photo', 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', 'approved'::document_status, admin_id, now()),
      (owner1_id, 'aadhar_card', '/uploads/kyc/aadhar_rajesh.pdf', 'approved'::document_status, admin_id, now()),
      (owner1_id, 'pan_card', '/uploads/kyc/pan_rajesh.pdf', 'approved'::document_status, admin_id, now()),
      (owner1_id, 'bank_document', '/uploads/kyc/bank_rajesh.pdf', 'approved'::document_status, admin_id, now());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM kyc_documents WHERE user_id = owner2_id) THEN
    INSERT INTO kyc_documents (user_id, document_type, document_url, status, reviewed_by, reviewed_at) VALUES
      (owner2_id, 'profile_photo', 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', 'approved'::document_status, admin_id, now()),
      (owner2_id, 'aadhar_card', '/uploads/kyc/aadhar_priya.pdf', 'approved'::document_status, admin_id, now()),
      (owner2_id, 'pan_card', '/uploads/kyc/pan_priya.pdf', 'approved'::document_status, admin_id, now()),
      (owner2_id, 'bank_document', '/uploads/kyc/bank_priya.pdf', 'approved'::document_status, admin_id, now());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM kyc_documents WHERE user_id = owner3_id) THEN
    INSERT INTO kyc_documents (user_id, document_type, document_url, status, reviewed_by, reviewed_at) VALUES
      (owner3_id, 'profile_photo', 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', 'pending'::document_status, null, null),
      (owner3_id, 'aadhar_card', '/uploads/kyc/aadhar_amit.pdf', 'pending'::document_status, null, null),
      (owner3_id, 'pan_card', '/uploads/kyc/pan_amit.pdf', 'pending'::document_status, null, null),
      (owner3_id, 'bank_document', '/uploads/kyc/bank_amit.pdf', 'pending'::document_status, null, null);
  END IF;

  -- Insert demo bookings only if they don't exist
  IF NOT EXISTS (SELECT 1 FROM bookings WHERE payment_id = 'pay_123456789') THEN
    INSERT INTO bookings (billboard_id, user_id, start_date, end_date, total_days, price_per_day, total_amount, gst_amount, final_amount, ad_content, ad_type, status, payment_status, payment_id) VALUES
      (billboard1_id, user1_id, '2025-02-01', '2025-02-15', 14, 25000.00, 350000.00, 63000.00, 413000.00, 'Tech startup product launch campaign', 'digital', 'active'::booking_status, 'completed', 'pay_123456789'),
      (billboard2_id, user2_id, '2025-02-10', '2025-02-20', 10, 18000.00, 180000.00, 32400.00, 212400.00, 'Fashion brand awareness campaign', 'static', 'approved'::booking_status, 'completed', 'pay_987654321'),
      (billboard3_id, user1_id, '2025-02-15', '2025-02-20', 5, 15000.00, 75000.00, 13500.00, 88500.00, 'Restaurant chain promotion', 'digital', 'pending'::booking_status, 'pending', null);
  END IF;

  -- Get booking IDs
  SELECT id INTO booking1_id FROM bookings WHERE payment_id = 'pay_123456789';
  SELECT id INTO booking2_id FROM bookings WHERE payment_id = 'pay_987654321';
  SELECT id INTO booking3_id FROM bookings WHERE ad_content = 'Restaurant chain promotion';

  -- Insert wallet transactions only if they don't exist
  IF NOT EXISTS (SELECT 1 FROM wallet_transactions WHERE reference_id = 'pay_123456789') THEN
    INSERT INTO wallet_transactions (user_id, amount, type, description, reference_id, booking_id, status) VALUES
      (owner1_id, 315000.00, 'credit'::transaction_type, 'Payment received for billboard booking', 'pay_123456789', booking1_id, 'completed'),
      (owner1_id, -31500.00, 'commission'::transaction_type, 'Platform commission (10%)', 'comm_123456789', booking1_id, 'completed'),
      (owner2_id, 191160.00, 'credit'::transaction_type, 'Payment received for billboard booking', 'pay_987654321', booking2_id, 'completed'),
      (owner2_id, -19116.00, 'commission'::transaction_type, 'Platform commission (10%)', 'comm_987654321', booking2_id, 'completed'),
      (user1_id, 5000.00, 'credit'::transaction_type, 'Wallet top-up', 'topup_001', null, 'completed'),
      (user2_id, 12000.00, 'credit'::transaction_type, 'Wallet top-up', 'topup_002', null, 'completed');
  END IF;

  -- Insert notifications only if they don't exist (fixed UUID casting issue)
  IF NOT EXISTS (SELECT 1 FROM notifications WHERE title = 'New Billboard Submission' AND user_id = admin_id) THEN
    INSERT INTO notifications (user_id, title, message, type, related_id, related_type) VALUES
      (admin_id, 'New Billboard Submission', 'A new billboard "IT Park Digital Screen - HITEC City" has been submitted for approval.', 'info'::notification_type, billboard5_id, 'billboard'),
      (admin_id, 'KYC Documents Submitted', 'KYC documents submitted by Amit Kumar for review.', 'info'::notification_type, owner3_id, 'kyc'),
      (subadmin_id, 'Site Visit Required', 'Please visit and verify the billboard at HITEC City, Hyderabad.', 'warning'::notification_type, billboard5_id, 'billboard'),
      (owner1_id, 'Booking Confirmed', 'Your billboard has been booked for 14 days starting Feb 1, 2025.', 'success'::notification_type, booking1_id, 'booking'),
      (owner1_id, 'Payment Received', 'Payment of ₹3,15,000 has been credited to your wallet.', 'success'::notification_type, booking1_id, 'payment'),
      (owner2_id, 'Booking Confirmed', 'Your billboard has been booked for 10 days starting Feb 10, 2025.', 'success'::notification_type, booking2_id, 'booking'),
      (owner3_id, 'KYC Under Review', 'Your KYC documents are being reviewed by our team.', 'info'::notification_type, owner3_id, 'kyc'),
      (user1_id, 'Booking Pending Approval', 'Your booking request is pending approval from the billboard owner.', 'warning'::notification_type, booking3_id, 'booking'),
      (user2_id, 'Payment Successful', 'Your payment of ₹2,12,400 has been processed successfully.', 'success'::notification_type, booking2_id, 'payment');
  END IF;

  -- Insert site visits only if they don't exist
  IF NOT EXISTS (SELECT 1 FROM site_visits WHERE billboard_id = billboard1_id) THEN
    INSERT INTO site_visits (billboard_id, sub_admin_id, visit_date, owner_selfie_url, billboard_photo_url, verification_notes, is_verified) VALUES
      (billboard1_id, subadmin_id, now() - interval '30 days', '/uploads/visits/selfie_rajesh_bkc.jpg', '/uploads/visits/billboard_bkc.jpg', 'Billboard verified successfully. Location and specifications match the submitted details.', true),
      (billboard2_id, subadmin_id, now() - interval '25 days', '/uploads/visits/selfie_priya_highway.jpg', '/uploads/visits/billboard_highway.jpg', 'Highway billboard verified. Excellent visibility and strategic location.', true),
      (billboard3_id, subadmin_id, now() - interval '20 days', '/uploads/visits/selfie_rajesh_forum.jpg', '/uploads/visits/billboard_forum.jpg', 'Mall display verified. High footfall area with good positioning.', true),
      (billboard4_id, subadmin_id, now() - interval '15 days', '/uploads/visits/selfie_priya_metro.jpg', '/uploads/visits/billboard_metro.jpg', 'Metro station billboard verified. Prime location with excellent commuter visibility.', true);
  END IF;

END $$;