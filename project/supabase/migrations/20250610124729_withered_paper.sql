/*
  # Add INSERT policy for user registration

  1. Security Changes
    - Add RLS policy to allow authenticated users to insert their own profile data
    - This enables user registration to work properly by allowing users to create their profile after auth signup

  2. Policy Details
    - Policy name: "Users can insert own profile"
    - Allows INSERT operations on users table
    - Restricts to authenticated users only
    - Ensures users can only insert records where the id matches their auth.uid()
*/

-- Add policy to allow users to insert their own profile data during registration
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());