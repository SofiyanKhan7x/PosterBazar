/*
  # Fix Authentication Policies

  1. Security Updates
    - Update RLS policies on users table to allow proper registration and authentication
    - Remove restrictive policies that prevent demo account creation and login
    - Ensure anonymous users can register and authenticated users can access their data

  2. Changes
    - Update user registration policies to be more permissive
    - Fix authentication flow for demo accounts
    - Ensure proper access control while allowing registration
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow anonymous registration" ON users;
DROP POLICY IF EXISTS "Allow user registration" ON users;

-- Create more permissive registration policy
CREATE POLICY "Enable registration for all users"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Ensure users can read their own data
DROP POLICY IF EXISTS "Users can read own data" ON users;
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Ensure users can update their own data
DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow service role full access (for admin operations)
DROP POLICY IF EXISTS "Service role has full access" ON users;
CREATE POLICY "Service role has full access"
  ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);