/*
  # Fix Users Table RLS Policy

  1. Security Updates
    - Ensure proper RLS policies for user registration
    - Allow authenticated users to insert their own profile
    - Fix any policy conflicts

  2. Changes
    - Drop and recreate the insert policy to ensure it works correctly
    - Add proper policy for user profile creation during registration
*/

-- Drop existing insert policy if it exists
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Create a new insert policy that allows users to create their own profile
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Ensure the select policy exists for users to read their own data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Users can read own data'
  ) THEN
    CREATE POLICY "Users can read own data"
      ON users
      FOR SELECT
      TO authenticated
      USING (auth.uid() = id);
  END IF;
END $$;

-- Ensure the update policy exists for users to update their own data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Users can update own data'
  ) THEN
    CREATE POLICY "Users can update own data"
      ON users
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = id);
  END IF;
END $$;