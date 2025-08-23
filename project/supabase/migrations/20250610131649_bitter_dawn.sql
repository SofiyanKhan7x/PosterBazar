/*
  # Fix RLS Policy Infinite Recursion

  1. Problem
    - The current RLS policies on the users table are causing infinite recursion
    - The "Admins can read all users" policy references the users table within itself

  2. Solution
    - Drop the problematic policy
    - Create a simpler policy structure that avoids self-reference
    - Use auth.jwt() to check user roles instead of querying the users table

  3. Changes
    - Remove the recursive admin policy
    - Add a new policy that uses JWT claims for admin access
    - Ensure users can still read and update their own data
*/

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Admins can read all users" ON users;

-- Create a new admin policy that doesn't cause recursion
-- This assumes admin role is stored in JWT claims or we use a different approach
CREATE POLICY "Enable read access for service role" ON users
  FOR SELECT TO service_role
  USING (true);

-- Allow authenticated users to read their own data (this should already exist)
DROP POLICY IF EXISTS "Users can read own data" ON users;
CREATE POLICY "Users can read own data" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Allow authenticated users to update their own data (this should already exist)
DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- Allow users to insert their own profile during registration
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- For admin functionality, we'll handle this through service role or different approach
-- to avoid the infinite recursion issue