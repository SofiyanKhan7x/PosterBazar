/*
  # Vendor Advertising System Database Schema

  1. New Tables
    - `vendor_profiles` - Extended vendor information
    - `ad_types` - Types of advertisements available
    - `ad_requests` - Vendor ad requests and campaigns
    - `ad_analytics` - Performance tracking data
    - `ad_payments` - Payment records for ads
    - `admin_settings` - System configuration
    - `vendor_notifications` - Vendor-specific notifications

  2. Security
    - Enable RLS on all new tables
    - Add policies for vendors, admins, and public access
    - Secure file upload permissions

  3. Enhancements
    - Add vendor role to existing user_role enum
    - Update existing tables for vendor support
*/

-- Add vendor role to existing enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid 
    WHERE t.typname = 'user_role' AND e.enumlabel = 'vendor'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'vendor';
  END IF;
END $$;

-- Create ad_types table for different advertisement types
CREATE TABLE IF NOT EXISTS ad_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type_name text UNIQUE NOT NULL,
  description text,
  base_price numeric(10,2) NOT NULL DEFAULT 0.00,
  features text[],
  max_file_size_mb integer DEFAULT 10,
  allowed_formats text[],
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create vendor_profiles table for extended vendor information
CREATE TABLE IF NOT EXISTS vendor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  business_type text,
  company_website text,
  company_logo text,
  business_registration_number text,
  gst_number text,
  billing_address text,
  contact_person text,
  contact_designation text,
  secondary_email text,
  secondary_phone text,
  business_description text,
  target_markets text[],
  annual_ad_budget numeric(12,2),
  preferred_ad_types text[],
  is_verified boolean DEFAULT false,
  verification_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ad_requests table for vendor advertisement requests
CREATE TABLE IF NOT EXISTS ad_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES users(id) ON DELETE CASCADE,
  ad_type_id uuid REFERENCES ad_types(id),
  title text NOT NULL,
  description text,
  content text,
  image_url text,
  video_url text,
  target_audience text,
  campaign_objectives text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_days integer GENERATED ALWAYS AS (end_date - start_date + 1) STORED,
  daily_budget numeric(10,2) NOT NULL,
  total_budget numeric(12,2) GENERATED ALWAYS AS (daily_budget * (end_date - start_date + 1)) STORED,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'active', 'paused', 'completed', 'cancelled')),
  admin_notes text,
  rejection_reason text,
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_id text,
  campaign_start_date timestamptz,
  campaign_end_date timestamptz,
  is_featured boolean DEFAULT false,
  priority_level integer DEFAULT 1 CHECK (priority_level BETWEEN 1 AND 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ad_analytics table for performance tracking
CREATE TABLE IF NOT EXISTS ad_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_request_id uuid REFERENCES ad_requests(id) ON DELETE CASCADE,
  date date NOT NULL,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  ctr numeric(5,4) GENERATED ALWAYS AS (
    CASE 
      WHEN impressions > 0 THEN (clicks::numeric / impressions::numeric) * 100
      ELSE 0
    END
  ) STORED,
  conversions integer DEFAULT 0,
  conversion_rate numeric(5,4) GENERATED ALWAYS AS (
    CASE 
      WHEN clicks > 0 THEN (conversions::numeric / clicks::numeric) * 100
      ELSE 0
    END
  ) STORED,
  spend numeric(10,2) DEFAULT 0.00,
  cpm numeric(10,2) GENERATED ALWAYS AS (
    CASE 
      WHEN impressions > 0 THEN (spend / impressions) * 1000
      ELSE 0
    END
  ) STORED,
  unique_visitors integer DEFAULT 0,
  bounce_rate numeric(5,2) DEFAULT 0.00,
  avg_time_spent interval,
  device_breakdown jsonb,
  location_breakdown jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(ad_request_id, date)
);

-- Create ad_payments table for payment tracking
CREATE TABLE IF NOT EXISTS ad_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_request_id uuid REFERENCES ad_requests(id) ON DELETE CASCADE,
  vendor_id uuid REFERENCES users(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  currency text DEFAULT 'INR',
  payment_method text,
  payment_gateway text,
  gateway_transaction_id text,
  gateway_payment_id text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
  failure_reason text,
  refund_amount numeric(12,2) DEFAULT 0.00,
  refund_reason text,
  invoice_number text,
  invoice_url text,
  gst_amount numeric(10,2) DEFAULT 0.00,
  platform_fee numeric(10,2) DEFAULT 0.00,
  net_amount numeric(12,2) GENERATED ALWAYS AS (amount - gst_amount - platform_fee) STORED,
  payment_date timestamptz,
  refund_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create admin_settings table for system configuration
CREATE TABLE IF NOT EXISTS admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_category text NOT NULL,
  setting_key text NOT NULL,
  setting_value text NOT NULL,
  setting_type text DEFAULT 'string' CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
  description text,
  is_public boolean DEFAULT false,
  updated_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(setting_category, setting_key)
);

-- Create vendor_notifications table for vendor-specific notifications
CREATE TABLE IF NOT EXISTS vendor_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'payment', 'campaign')),
  related_ad_id uuid REFERENCES ad_requests(id) ON DELETE SET NULL,
  related_payment_id uuid REFERENCES ad_payments(id) ON DELETE SET NULL,
  is_read boolean DEFAULT false,
  is_email_sent boolean DEFAULT false,
  email_sent_at timestamptz,
  action_url text,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Insert default ad types
INSERT INTO ad_types (type_name, description, base_price, features, max_file_size_mb, allowed_formats) VALUES
('popup', 'Pop-up Advertisement', 500.00, ARRAY['Customizable timing', 'Click tracking', 'Responsive design'], 5, ARRAY['jpg', 'png', 'gif']),
('video', 'Video Advertisement', 1500.00, ARRAY['Auto-play capability', 'Sound controls', 'HD quality', 'Analytics'], 100, ARRAY['mp4', 'webm', 'mov']),
('notification', 'Notification Banner', 300.00, ARRAY['Header/footer placement', 'Minimal design', 'High visibility'], 2, ARRAY['jpg', 'png'])
ON CONFLICT (type_name) DO NOTHING;

-- Insert default admin settings
INSERT INTO admin_settings (setting_category, setting_key, setting_value, setting_type, description, is_public) VALUES
('vendor_ads', 'approval_required', 'true', 'boolean', 'Whether vendor ads require admin approval', false),
('vendor_ads', 'max_campaign_duration_days', '90', 'number', 'Maximum campaign duration in days', true),
('vendor_ads', 'min_campaign_duration_days', '1', 'number', 'Minimum campaign duration in days', true),
('vendor_ads', 'platform_commission_percentage', '10', 'number', 'Platform commission percentage', false),
('vendor_ads', 'gst_percentage', '18', 'number', 'GST percentage for vendor ads', true),
('vendor_ads', 'auto_approve_verified_vendors', 'false', 'boolean', 'Auto-approve ads from verified vendors', false),
('payments', 'payment_gateway', 'razorpay', 'string', 'Default payment gateway', false),
('notifications', 'email_notifications_enabled', 'true', 'boolean', 'Enable email notifications', false)
ON CONFLICT (setting_category, setting_key) DO NOTHING;

-- Enable RLS on all new tables
ALTER TABLE ad_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ad_types
CREATE POLICY "Public can view active ad types"
  ON ad_types FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage ad types"
  ON ad_types FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- RLS Policies for vendor_profiles
CREATE POLICY "Vendors can view own profile"
  ON vendor_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Vendors can update own profile"
  ON vendor_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Vendors can insert own profile"
  ON vendor_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all vendor profiles"
  ON vendor_profiles FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- RLS Policies for ad_requests
CREATE POLICY "Vendors can view own ad requests"
  ON ad_requests FOR SELECT
  TO authenticated
  USING (vendor_id = auth.uid());

CREATE POLICY "Vendors can manage own ad requests"
  ON ad_requests FOR ALL
  TO authenticated
  USING (vendor_id = auth.uid())
  WITH CHECK (vendor_id = auth.uid());

CREATE POLICY "Admins can view all ad requests"
  ON ad_requests FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

CREATE POLICY "Admins can update ad requests"
  ON ad_requests FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- RLS Policies for ad_analytics
CREATE POLICY "Vendors can view own ad analytics"
  ON ad_analytics FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ad_requests 
    WHERE ad_requests.id = ad_analytics.ad_request_id 
    AND ad_requests.vendor_id = auth.uid()
  ));

CREATE POLICY "Admins can view all analytics"
  ON ad_analytics FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- RLS Policies for ad_payments
CREATE POLICY "Vendors can view own payments"
  ON ad_payments FOR SELECT
  TO authenticated
  USING (vendor_id = auth.uid());

CREATE POLICY "Vendors can insert own payments"
  ON ad_payments FOR INSERT
  TO authenticated
  WITH CHECK (vendor_id = auth.uid());

CREATE POLICY "Admins can view all payments"
  ON ad_payments FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- RLS Policies for admin_settings
CREATE POLICY "Public can view public settings"
  ON admin_settings FOR SELECT
  TO public
  USING (is_public = true);

CREATE POLICY "Authenticated users can view non-sensitive settings"
  ON admin_settings FOR SELECT
  TO authenticated
  USING (setting_category NOT IN ('payments', 'security'));

CREATE POLICY "Admins can manage all settings"
  ON admin_settings FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- RLS Policies for vendor_notifications
CREATE POLICY "Vendors can view own notifications"
  ON vendor_notifications FOR SELECT
  TO authenticated
  USING (vendor_id = auth.uid());

CREATE POLICY "Vendors can update own notifications"
  ON vendor_notifications FOR UPDATE
  TO authenticated
  USING (vendor_id = auth.uid())
  WITH CHECK (vendor_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON vendor_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_user_id ON vendor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_requests_vendor_id ON ad_requests(vendor_id);
CREATE INDEX IF NOT EXISTS idx_ad_requests_status ON ad_requests(status);
CREATE INDEX IF NOT EXISTS idx_ad_requests_dates ON ad_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_ad_analytics_ad_request_id ON ad_analytics(ad_request_id);
CREATE INDEX IF NOT EXISTS idx_ad_analytics_date ON ad_analytics(date);
CREATE INDEX IF NOT EXISTS idx_ad_payments_vendor_id ON ad_payments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_ad_payments_status ON ad_payments(status);
CREATE INDEX IF NOT EXISTS idx_vendor_notifications_vendor_id ON vendor_notifications(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_notifications_is_read ON vendor_notifications(is_read);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ad_types_updated_at
  BEFORE UPDATE ON ad_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_profiles_updated_at
  BEFORE UPDATE ON vendor_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ad_requests_updated_at
  BEFORE UPDATE ON ad_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ad_payments_updated_at
  BEFORE UPDATE ON ad_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON admin_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();