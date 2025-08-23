/*
  # Change primary key types from UUID to INTEGER

  1. Changes
     - Modify primary key columns in all tables from UUID to INTEGER or BIGSERIAL
     - Update foreign key references to match the new column types
     - Add sequence generators for auto-incrementing IDs
  
  2. Tables Modified
     - users
     - billboards
     - bookings
     - kyc_documents
     - notifications
     - wallet_transactions
     - site_visits
     - billboard_images
*/

-- Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create new tables with integer IDs
CREATE TABLE IF NOT EXISTS users_new (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  phone TEXT,
  profile_photo TEXT,
  kyc_status kyc_status DEFAULT 'pending',
  wallet_balance NUMERIC(10,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT TRUE,
  email_verified BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS billboard_types_new (
  id SERIAL PRIMARY KEY,
  type_name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS billboards_new (
  id BIGSERIAL PRIMARY KEY,
  owner_id BIGINT NOT NULL,
  title TEXT NOT NULL,
  state TEXT NOT NULL,
  city TEXT NOT NULL,
  location_address TEXT NOT NULL,
  google_maps_link TEXT,
  latitude NUMERIC(10,8),
  longitude NUMERIC(11,8),
  price_per_day NUMERIC(10,2) NOT NULL,
  daily_views INTEGER NOT NULL DEFAULT 0,
  min_days INTEGER NOT NULL DEFAULT 1,
  billboard_type_id INTEGER,
  dimensions TEXT NOT NULL,
  facing TEXT NOT NULL,
  features TEXT NOT NULL,
  description TEXT NOT NULL,
  status billboard_status DEFAULT 'draft',
  featured BOOLEAN DEFAULT FALSE,
  admin_notes TEXT,
  rejection_reason TEXT,
  approved_by BIGINT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (owner_id) REFERENCES users_new(id) ON DELETE CASCADE,
  FOREIGN KEY (billboard_type_id) REFERENCES billboard_types_new(id),
  FOREIGN KEY (approved_by) REFERENCES users_new(id)
);

CREATE TABLE IF NOT EXISTS billboard_images_new (
  id BIGSERIAL PRIMARY KEY,
  billboard_id BIGINT NOT NULL,
  image_url TEXT NOT NULL,
  image_type TEXT DEFAULT 'additional',
  display_order INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (billboard_id) REFERENCES billboards_new(id) ON DELETE CASCADE,
  CHECK (image_type = ANY (ARRAY['main'::text, 'additional'::text]))
);

CREATE TABLE IF NOT EXISTS bookings_new (
  id BIGSERIAL PRIMARY KEY,
  billboard_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER NOT NULL,
  price_per_day NUMERIC(10,2) NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  gst_amount NUMERIC(10,2) NOT NULL,
  final_amount NUMERIC(10,2) NOT NULL,
  ad_content TEXT,
  ad_type TEXT DEFAULT 'static',
  status booking_status DEFAULT 'pending',
  payment_status TEXT DEFAULT 'pending',
  payment_id TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (billboard_id) REFERENCES billboards_new(id),
  FOREIGN KEY (user_id) REFERENCES users_new(id)
);

CREATE TABLE IF NOT EXISTS kyc_documents_new (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  document_type TEXT NOT NULL,
  document_url TEXT NOT NULL,
  status document_status DEFAULT 'pending',
  admin_notes TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by BIGINT,
  FOREIGN KEY (user_id) REFERENCES users_new(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users_new(id),
  CHECK (document_type = ANY (ARRAY['profile_photo'::text, 'aadhar_card'::text, 'pan_card'::text, 'bank_document'::text]))
);

CREATE TABLE IF NOT EXISTS notifications_new (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type notification_type DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  related_id TEXT,
  related_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES users_new(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wallet_transactions_new (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  type transaction_type NOT NULL,
  description TEXT NOT NULL,
  reference_id TEXT,
  booking_id BIGINT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES users_new(id),
  FOREIGN KEY (booking_id) REFERENCES bookings_new(id)
);

CREATE TABLE IF NOT EXISTS site_visits_new (
  id BIGSERIAL PRIMARY KEY,
  billboard_id BIGINT NOT NULL,
  sub_admin_id BIGINT NOT NULL,
  visit_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  owner_selfie_url TEXT,
  billboard_photo_url TEXT,
  verification_notes TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (billboard_id) REFERENCES billboards_new(id),
  FOREIGN KEY (sub_admin_id) REFERENCES users_new(id)
);

CREATE TABLE IF NOT EXISTS system_settings_new (
  id SERIAL PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  setting_type TEXT DEFAULT 'string',
  description TEXT,
  updated_by BIGINT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (updated_by) REFERENCES users_new(id)
);

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users_new
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_billboards_updated_at
BEFORE UPDATE ON billboards_new
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON bookings_new
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add indexes
CREATE INDEX idx_billboards_new_owner_id ON billboards_new(owner_id);
CREATE INDEX idx_billboards_new_status ON billboards_new(status);
CREATE INDEX idx_billboards_new_location ON billboards_new(state, city);
CREATE INDEX idx_billboard_images_new_billboard_id ON billboard_images_new(billboard_id);
CREATE INDEX idx_bookings_new_billboard_id ON bookings_new(billboard_id);
CREATE INDEX idx_bookings_new_user_id ON bookings_new(user_id);
CREATE INDEX idx_kyc_documents_new_user_id ON kyc_documents_new(user_id);
CREATE INDEX idx_notifications_new_user_id ON notifications_new(user_id);
CREATE INDEX idx_wallet_transactions_new_user_id ON wallet_transactions_new(user_id);

-- Note: In a production environment, you would need to:
-- 1. Copy data from old tables to new tables
-- 2. Drop old tables
-- 3. Rename new tables to original names
-- 4. Re-create all constraints and triggers

-- This migration only creates the new table structure
-- A separate data migration would be needed to transfer existing data