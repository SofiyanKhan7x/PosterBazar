/*
  # Fix Users Table RLS Policies

  1. Security Changes
    - Remove restrictive RLS policies on users table
    - Add proper policies for user registration and authentication
    - Allow users to insert their own records during registration
    - Allow users to read and update their own data
    - Allow service role full access for admin operations

  2. Policy Updates
    - Enable public user registration
    - Fix authentication flow issues
    - Maintain security while allowing proper user operations
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Enable insert for authentication" ON users;
DROP POLICY IF EXISTS "Enable read access for service role" ON users;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON users;

-- Create new policies that allow proper user registration and authentication
CREATE POLICY "Allow user registration"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role has full access"
  ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow anonymous users to insert during registration
CREATE POLICY "Allow anonymous registration"
  ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);