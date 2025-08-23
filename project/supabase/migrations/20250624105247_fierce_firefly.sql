/*
  # Fix RLS policies for billboard_size_fees table

  1. Security Updates
    - Add INSERT policy for admins to create new billboard size fees
    - Add UPDATE policy for admins to modify existing billboard size fees  
    - Add DELETE policy for admins to remove billboard size fees
    - Keep existing SELECT policy for all authenticated users

  2. Changes
    - Allow admins to perform all CRUD operations on billboard_size_fees
    - Maintain read access for all authenticated users to view fee structures
*/

-- Add INSERT policy for admins
CREATE POLICY "Admins can create billboard size fees"
  ON billboard_size_fees
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Add UPDATE policy for admins  
CREATE POLICY "Admins can update billboard size fees"
  ON billboard_size_fees
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Add DELETE policy for admins
CREATE POLICY "Admins can delete billboard size fees"
  ON billboard_size_fees
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );