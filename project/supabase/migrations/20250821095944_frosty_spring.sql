/*
  # Add rejection_notes column to users table

  1. Schema Changes
    - Add `rejection_notes` column to `users` table
    - Column type: TEXT (nullable)
    - Used to store admin feedback when KYC is rejected

  2. Purpose
    - Allows admins to provide specific feedback when rejecting KYC documents
    - Helps billboard owners understand what needs to be corrected
    - Improves transparency in the KYC verification process

  3. Security
    - Column is nullable to maintain backward compatibility
    - No additional RLS policies needed as it's part of existing user data
*/

-- Add rejection_notes column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'rejection_notes'
  ) THEN
    ALTER TABLE users ADD COLUMN rejection_notes TEXT;
  END IF;
END $$;