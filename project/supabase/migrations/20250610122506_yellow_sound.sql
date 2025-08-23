/*
  # Billboard Platform Database Schema

  1. New Tables
    - `users` - User accounts (advertisers, owners, admins, sub-admins)
    - `billboard_types` - Types of billboards (digital, static, etc.)
    - `billboards` - Billboard listings with all details
    - `billboard_images` - Multiple images per billboard
    - `kyc_documents` - KYC verification documents
    - `bookings` - Advertisement bookings
    - `notifications` - System notifications
    - `wallet_transactions` - Financial transactions
    - `site_visits` - Sub-admin site verification visits
    - `system_settings` - Platform configuration

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each user role
    - Secure file uploads and document handling

  3. Features
    - Multi-role user system
    - Complete KYC workflow
    - Billboard verification process
    - Booking and payment system
    - Notification system
    - Analytics and reporting
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('user', 'owner', 'admin', 'sub_admin');
CREATE TYPE kyc_status AS ENUM ('pending', 'submitted', 'approved', 'rejected');
CREATE TYPE billboard_status AS ENUM ('draft', 'pending', 'approved', 'rejected', 'active', 'inactive');
CREATE TYPE booking_status AS ENUM ('pending', 'approved', 'rejected', 'active', 'completed', 'cancelled');
CREATE TYPE document_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE transaction_type AS ENUM ('credit', 'debit', 'refund', 'commission');
CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'error');

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name text NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  phone text,
  profile_photo text,
  kyc_status kyc_status DEFAULT 'pending',
  wallet_balance decimal(10,2) DEFAULT 0.00,
  is_active boolean DEFAULT true,
  email_verified boolean DEFAULT false,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Billboard types table
CREATE TABLE IF NOT EXISTS billboard_types (
  id serial PRIMARY KEY,
  type_name text NOT NULL UNIQUE,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Billboards table
CREATE TABLE IF NOT EXISTS billboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  state text NOT NULL,
  city text NOT NULL,
  location_address text NOT NULL,
  google_maps_link text,
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  price_per_day decimal(10,2) NOT NULL,
  daily_views integer NOT NULL DEFAULT 0,
  min_days integer NOT NULL DEFAULT 1,
  billboard_type_id integer REFERENCES billboard_types(id),
  dimensions text NOT NULL,
  facing text NOT NULL,
  features text NOT NULL,
  description text NOT NULL,
  status billboard_status DEFAULT 'draft',
  featured boolean DEFAULT false,
  admin_notes text,
  rejection_reason text,
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Billboard images table
CREATE TABLE IF NOT EXISTS billboard_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  billboard_id uuid NOT NULL REFERENCES billboards(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  image_type text DEFAULT 'additional' CHECK (image_type IN ('main', 'additional')),
  display_order integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- KYC documents table
CREATE TABLE IF NOT EXISTS kyc_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('profile_photo', 'aadhar_card', 'pan_card', 'bank_document')),
  document_url text NOT NULL,
  status document_status DEFAULT 'pending',
  admin_notes text,
  uploaded_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES users(id)
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  billboard_id uuid NOT NULL REFERENCES billboards(id),
  user_id uuid NOT NULL REFERENCES users(id),
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_days integer NOT NULL,
  price_per_day decimal(10,2) NOT NULL,
  total_amount decimal(10,2) NOT NULL,
  gst_amount decimal(10,2) NOT NULL,
  final_amount decimal(10,2) NOT NULL,
  ad_content text,
  ad_type text DEFAULT 'static',
  status booking_status DEFAULT 'pending',
  payment_status text DEFAULT 'pending',
  payment_id text,
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type notification_type DEFAULT 'info',
  is_read boolean DEFAULT false,
  related_id uuid,
  related_type text,
  created_at timestamptz DEFAULT now()
);

-- Wallet transactions table
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  amount decimal(10,2) NOT NULL,
  type transaction_type NOT NULL,
  description text NOT NULL,
  reference_id text,
  booking_id uuid REFERENCES bookings(id),
  status text DEFAULT 'completed',
  created_at timestamptz DEFAULT now()
);

-- Site visits table (for sub-admin verification)
CREATE TABLE IF NOT EXISTS site_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  billboard_id uuid NOT NULL REFERENCES billboards(id),
  sub_admin_id uuid NOT NULL REFERENCES users(id),
  visit_date timestamptz DEFAULT now(),
  owner_selfie_url text,
  billboard_photo_url text,
  verification_notes text,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- System settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id serial PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value text NOT NULL,
  setting_type text DEFAULT 'string',
  description text,
  updated_by uuid REFERENCES users(id),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE billboard_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE billboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE billboard_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own data" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all users" ON users
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'sub_admin')
    )
  );

-- RLS Policies for billboard_types table
CREATE POLICY "Anyone can read billboard types" ON billboard_types
  FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage billboard types" ON billboard_types
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for billboards table
CREATE POLICY "Anyone can read approved billboards" ON billboards
  FOR SELECT TO authenticated
  USING (status = 'approved');

CREATE POLICY "Owners can read own billboards" ON billboards
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Owners can create billboards" ON billboards
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update own billboards" ON billboards
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Admins can manage all billboards" ON billboards
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'sub_admin')
    )
  );

-- RLS Policies for billboard_images table
CREATE POLICY "Anyone can read billboard images" ON billboard_images
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM billboards 
      WHERE id = billboard_id AND status = 'approved'
    )
  );

CREATE POLICY "Owners can manage own billboard images" ON billboard_images
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM billboards 
      WHERE id = billboard_id AND owner_id = auth.uid()
    )
  );

-- RLS Policies for kyc_documents table
CREATE POLICY "Users can read own KYC documents" ON kyc_documents
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can upload KYC documents" ON kyc_documents
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage KYC documents" ON kyc_documents
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'sub_admin')
    )
  );

-- RLS Policies for bookings table
CREATE POLICY "Users can read own bookings" ON bookings
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Owners can read billboard bookings" ON bookings
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM billboards 
      WHERE id = billboard_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create bookings" ON bookings
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all bookings" ON bookings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'sub_admin')
    )
  );

-- RLS Policies for notifications table
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for wallet_transactions table
CREATE POLICY "Users can read own transactions" ON wallet_transactions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can read all transactions" ON wallet_transactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'sub_admin')
    )
  );

-- RLS Policies for site_visits table
CREATE POLICY "Sub-admins can manage site visits" ON site_visits
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'sub_admin')
    )
  );

-- RLS Policies for system_settings table
CREATE POLICY "Admins can manage system settings" ON system_settings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Insert default billboard types
INSERT INTO billboard_types (type_name, description) VALUES
  ('Digital LED', 'High-resolution LED display billboards'),
  ('Static Vinyl', 'Traditional printed vinyl billboards'),
  ('Backlit', 'Illuminated static billboards'),
  ('Mobile Billboard', 'Vehicle-mounted advertising displays'),
  ('Transit Shelter', 'Bus stop and transit station displays'),
  ('Street Furniture', 'Kiosks, benches, and urban furniture ads');

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
  ('site_name', 'BillboardHub', 'string', 'Website name'),
  ('primary_color', '#1e3a8a', 'string', 'Primary brand color'),
  ('secondary_color', '#fbbf24', 'string', 'Secondary brand color'),
  ('dark_mode_enabled', 'true', 'boolean', 'Enable dark mode toggle'),
  ('gst_rate', '18', 'number', 'GST rate percentage'),
  ('commission_rate', '10', 'number', 'Platform commission percentage'),
  ('min_booking_days', '1', 'number', 'Minimum booking duration in days'),
  ('max_booking_days', '365', 'number', 'Maximum booking duration in days');

-- Create indexes for better performance
CREATE INDEX idx_billboards_owner_id ON billboards(owner_id);
CREATE INDEX idx_billboards_status ON billboards(status);
CREATE INDEX idx_billboards_location ON billboards(state, city);
CREATE INDEX idx_billboard_images_billboard_id ON billboard_images(billboard_id);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_billboard_id ON bookings(billboard_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX idx_kyc_documents_user_id ON kyc_documents(user_id);

-- Create functions for common operations
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_billboards_updated_at BEFORE UPDATE ON billboards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();