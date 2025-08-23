/*
  # Disable RLS for billboard_size_fees table

  1. Changes
    - Drop all existing RLS policies on billboard_size_fees table
    - Disable Row Level Security on billboard_size_fees table

  2. Security
    - Removes all access restrictions on billboard_size_fees table
    - Table will be accessible to all authenticated users without policy checks
*/

-- Drop all existing policies on billboard_size_fees table
DROP POLICY IF EXISTS "Admins can create billboard size fees" ON billboard_size_fees;
DROP POLICY IF EXISTS "Admins can delete billboard size fees" ON billboard_size_fees;
DROP POLICY IF EXISTS "Admins can manage billboard size fees" ON billboard_size_fees;
DROP POLICY IF EXISTS "Admins can update billboard size fees" ON billboard_size_fees;
DROP POLICY IF EXISTS "All users can view billboard size fees" ON billboard_size_fees;

-- Disable Row Level Security on billboard_size_fees table
ALTER TABLE billboard_size_fees DISABLE ROW LEVEL SECURITY;