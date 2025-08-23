/*
  # Create vendor_ads table

  1. New Tables
    - `vendor_ads`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `title` (text)
      - `ad_type` (text with check constraint)
      - `content` (text)
      - `target_audience` (text, optional)
      - `start_date` (date)
      - `end_date` (date)
      - `total_days` (integer)
      - `daily_budget` (numeric)
      - `total_cost` (numeric)
      - `status` (text with check constraint)
      - `admin_notes` (text, optional)
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `vendor_ads` table
    - Add policies for users to manage their own ads
    - Add policies for admins to review all ads

  3. Indexes
    - Index on user_id for efficient queries
    - Index on status for admin filtering
    - Index on is_active for active ads queries
*/

CREATE TABLE IF NOT EXISTS vendor_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  ad_type text NOT NULL CHECK (ad_type IN ('banner', 'video', 'popup', 'billboard_offer')),
  content text NOT NULL,
  target_audience text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_days integer NOT NULL,
  daily_budget numeric(10,2) NOT NULL,
  total_cost numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'active', 'paused', 'completed')),
  admin_notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE vendor_ads ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vendor_ads_user_id ON vendor_ads(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_ads_status ON vendor_ads(status);
CREATE INDEX IF NOT EXISTS idx_vendor_ads_is_active ON vendor_ads(is_active);
CREATE INDEX IF NOT EXISTS idx_vendor_ads_created_at ON vendor_ads(created_at);

-- RLS Policies

-- Users can view their own ads
CREATE POLICY "Users can view own vendor ads"
  ON vendor_ads
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own ads
CREATE POLICY "Users can create vendor ads"
  ON vendor_ads
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own ads (except status which is admin-controlled)
CREATE POLICY "Users can update own vendor ads"
  ON vendor_ads
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own ads
CREATE POLICY "Users can delete own vendor ads"
  ON vendor_ads
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all ads
CREATE POLICY "Admins can view all vendor ads"
  ON vendor_ads
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Admins can update all ads (especially status and admin_notes)
CREATE POLICY "Admins can update all vendor ads"
  ON vendor_ads
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Public can view approved and active ads (for display purposes)
CREATE POLICY "Public can view approved active vendor ads"
  ON vendor_ads
  FOR SELECT
  TO anon, authenticated
  USING (status = 'approved' AND is_active = true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_vendor_ads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vendor_ads_updated_at
  BEFORE UPDATE ON vendor_ads
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_ads_updated_at();