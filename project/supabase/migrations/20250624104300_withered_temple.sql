/*
  # Add Billboard Size Fees Table

  1. New Tables
    - `billboard_size_fees`
      - `id` (integer, primary key)
      - `size_name` (text, unique)
      - `fee_amount` (numeric)
      - `description` (text)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `updated_by` (uuid)
  2. Security
    - Enable RLS on `billboard_size_fees` table
    - Add policy for admins to manage fees
    - Add policy for all users to read fees
*/

-- Create billboard size fees table
CREATE TABLE IF NOT EXISTS billboard_size_fees (
  id SERIAL PRIMARY KEY,
  size_name TEXT UNIQUE NOT NULL,
  fee_amount NUMERIC(10,2) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES users(id)
);

-- Add initial size categories
INSERT INTO billboard_size_fees (size_name, fee_amount, description) VALUES
('Small (< 100 sq ft)', 5000.00, 'Small billboards under 100 square feet'),
('Medium (100-300 sq ft)', 10000.00, 'Medium billboards between 100 and 300 square feet'),
('Large (300-600 sq ft)', 15000.00, 'Large billboards between 300 and 600 square feet'),
('Extra Large (> 600 sq ft)', 25000.00, 'Extra large billboards over 600 square feet');

-- Add column to billboards table to track fee payment
ALTER TABLE billboards ADD COLUMN IF NOT EXISTS joining_fee_paid BOOLEAN DEFAULT FALSE;
ALTER TABLE billboards ADD COLUMN IF NOT EXISTS joining_fee_amount NUMERIC(10,2);
ALTER TABLE billboards ADD COLUMN IF NOT EXISTS joining_fee_payment_id TEXT;
ALTER TABLE billboards ADD COLUMN IF NOT EXISTS joining_fee_payment_date TIMESTAMPTZ;

-- Enable RLS
ALTER TABLE billboard_size_fees ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage billboard size fees"
  ON billboard_size_fees
  FOR ALL
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY "All users can view billboard size fees"
  ON billboard_size_fees
  FOR SELECT
  TO authenticated
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_billboard_size_fees_updated_at
BEFORE UPDATE ON billboard_size_fees
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();