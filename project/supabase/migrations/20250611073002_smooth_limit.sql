/*
  # Fix password_hash constraint issue

  1. Changes
    - Make password_hash column nullable in users table
    - This allows Supabase Auth to handle password management while keeping the column for potential future use

  2. Security
    - Supabase Auth handles password hashing and storage securely
    - Our custom users table focuses on profile information
*/

-- Make password_hash column nullable to fix registration constraint violation
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'password_hash' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
  END IF;
END $$;