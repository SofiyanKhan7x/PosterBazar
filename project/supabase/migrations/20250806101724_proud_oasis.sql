/*
  # Two-Sided Billboard Management and Shopping Cart System

  1. New Tables
    - `billboard_sides` - Manages individual sides of billboards (A and B)
    - `cart_items` - Shopping cart functionality for multiple billboard bookings
    - `cart_sessions` - Manages user cart sessions with expiration

  2. Schema Updates
    - Add `is_two_sided` column to billboards table
    - Add `side_type` to bookings table to track which side is booked
    - Add cart-related columns for booking management

  3. Security
    - Enable RLS on all new tables
    - Add policies for users to manage their own carts
    - Add policies for billboard owners to manage their billboard sides

  4. Features
    - Two-sided billboard support with independent booking for each side
    - Shopping cart with real-time availability checking
    - Consolidated checkout process
    - Inventory management to prevent double-booking
*/

-- Add two-sided billboard support to existing billboards table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'billboards' AND column_name = 'is_two_sided'
  ) THEN
    ALTER TABLE billboards ADD COLUMN is_two_sided boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'billboards' AND column_name = 'side_a_description'
  ) THEN
    ALTER TABLE billboards ADD COLUMN side_a_description text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'billboards' AND column_name = 'side_b_description'
  ) THEN
    ALTER TABLE billboards ADD COLUMN side_b_description text;
  END IF;
END $$;

-- Create billboard_sides table for managing individual sides
CREATE TABLE IF NOT EXISTS billboard_sides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  billboard_id uuid NOT NULL REFERENCES billboards(id) ON DELETE CASCADE,
  side_identifier text NOT NULL CHECK (side_identifier IN ('A', 'B', 'SINGLE')),
  side_name text,
  description text,
  features text,
  price_per_day numeric(10,2),
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(billboard_id, side_identifier)
);

-- Create cart_sessions table for managing user shopping carts
CREATE TABLE IF NOT EXISTS cart_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create cart_items table for shopping cart functionality
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_session_id uuid NOT NULL REFERENCES cart_sessions(id) ON DELETE CASCADE,
  billboard_id uuid NOT NULL REFERENCES billboards(id) ON DELETE CASCADE,
  billboard_side_id uuid REFERENCES billboard_sides(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_days integer NOT NULL,
  price_per_day numeric(10,2) NOT NULL,
  total_amount numeric(10,2) NOT NULL,
  ad_content text,
  ad_type text DEFAULT 'static',
  side_booked text DEFAULT 'SINGLE' CHECK (side_booked IN ('A', 'B', 'BOTH', 'SINGLE')),
  availability_checked_at timestamptz DEFAULT now(),
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add side tracking to existing bookings table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'billboard_side_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN billboard_side_id uuid REFERENCES billboard_sides(id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'side_booked'
  ) THEN
    ALTER TABLE bookings ADD COLUMN side_booked text DEFAULT 'SINGLE' CHECK (side_booked IN ('A', 'B', 'BOTH', 'SINGLE'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'cart_session_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN cart_session_id uuid REFERENCES cart_sessions(id);
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_billboard_sides_billboard_id ON billboard_sides(billboard_id);
CREATE INDEX IF NOT EXISTS idx_billboard_sides_availability ON billboard_sides(is_available);
CREATE INDEX IF NOT EXISTS idx_cart_sessions_user_id ON cart_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_sessions_expires ON cart_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_session ON cart_items(cart_session_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_billboard ON cart_items(billboard_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_dates ON cart_items(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_bookings_side_dates ON bookings(billboard_side_id, start_date, end_date);

-- Enable RLS on new tables
ALTER TABLE billboard_sides ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for billboard_sides
CREATE POLICY "Anyone can view billboard sides"
  ON billboard_sides FOR SELECT
  TO public
  USING (is_available = true);

CREATE POLICY "Owners can manage own billboard sides"
  ON billboard_sides FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM billboards 
      WHERE billboards.id = billboard_sides.billboard_id 
      AND billboards.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all billboard sides"
  ON billboard_sides FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- RLS Policies for cart_sessions
CREATE POLICY "Users can view own cart sessions"
  ON cart_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own cart sessions"
  ON cart_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own cart sessions"
  ON cart_sessions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own cart sessions"
  ON cart_sessions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for cart_items
CREATE POLICY "Users can view own cart items"
  ON cart_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cart_sessions 
      WHERE cart_sessions.id = cart_items.cart_session_id 
      AND cart_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own cart items"
  ON cart_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cart_sessions 
      WHERE cart_sessions.id = cart_items.cart_session_id 
      AND cart_sessions.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cart_sessions 
      WHERE cart_sessions.id = cart_items.cart_session_id 
      AND cart_sessions.user_id = auth.uid()
    )
  );

-- Function to check billboard availability for specific dates and side
CREATE OR REPLACE FUNCTION check_billboard_availability(
  billboard_id_param uuid,
  side_param text,
  start_date_param date,
  end_date_param date
) RETURNS boolean AS $$
DECLARE
  conflict_count integer;
BEGIN
  -- Check for conflicting bookings
  SELECT COUNT(*) INTO conflict_count
  FROM bookings
  WHERE billboard_id = billboard_id_param
    AND (side_booked = side_param OR side_booked = 'BOTH' OR side_param = 'BOTH')
    AND status IN ('approved', 'active')
    AND (
      (start_date_param <= start_date AND end_date_param >= start_date) OR
      (start_date_param <= end_date AND end_date_param >= end_date) OR
      (start_date_param >= start_date AND end_date_param <= end_date)
    );
  
  RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Function to create or get user cart session
CREATE OR REPLACE FUNCTION get_or_create_cart_session(user_id_param uuid)
RETURNS uuid AS $$
DECLARE
  session_id uuid;
  session_token text;
BEGIN
  -- Try to get existing active session
  SELECT id INTO session_id
  FROM cart_sessions
  WHERE user_id = user_id_param
    AND is_active = true
    AND expires_at > now()
  LIMIT 1;
  
  -- Create new session if none exists
  IF session_id IS NULL THEN
    session_token := 'cart_' || extract(epoch from now()) || '_' || encode(gen_random_bytes(16), 'hex');
    
    INSERT INTO cart_sessions (user_id, session_token, expires_at, is_active)
    VALUES (user_id_param, session_token, now() + interval '24 hours', true)
    RETURNING id INTO session_id;
  END IF;
  
  RETURN session_id;
END;
$$ LANGUAGE plpgsql;

-- Function to validate cart items availability before checkout
CREATE OR REPLACE FUNCTION validate_cart_availability(cart_session_id_param uuid)
RETURNS TABLE (
  item_id uuid,
  billboard_id uuid,
  is_available boolean,
  conflict_reason text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ci.id,
    ci.billboard_id,
    check_billboard_availability(ci.billboard_id, ci.side_booked, ci.start_date, ci.end_date),
    CASE 
      WHEN NOT check_billboard_availability(ci.billboard_id, ci.side_booked, ci.start_date, ci.end_date)
      THEN 'Billboard is no longer available for the selected dates'
      ELSE NULL
    END
  FROM cart_items ci
  WHERE ci.cart_session_id = cart_session_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired cart sessions
CREATE OR REPLACE FUNCTION cleanup_expired_carts()
RETURNS void AS $$
BEGIN
  -- Delete expired cart sessions and their items
  DELETE FROM cart_sessions
  WHERE expires_at < now() OR (is_active = false AND updated_at < now() - interval '1 hour');
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_billboard_sides_updated_at
  BEFORE UPDATE ON billboard_sides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_sessions_updated_at
  BEFORE UPDATE ON cart_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default billboard sides for existing billboards
INSERT INTO billboard_sides (billboard_id, side_identifier, side_name, description, price_per_day, is_available)
SELECT 
  id,
  'SINGLE',
  'Main Display',
  description,
  price_per_day,
  (status = 'active')
FROM billboards
WHERE NOT EXISTS (
  SELECT 1 FROM billboard_sides 
  WHERE billboard_sides.billboard_id = billboards.id
);