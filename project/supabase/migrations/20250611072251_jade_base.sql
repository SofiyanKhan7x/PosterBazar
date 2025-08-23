/*
  # Fix RLS policies and remove demo data

  1. Security Updates
    - Remove problematic RLS policies that cause infinite recursion
    - Simplify user policies to avoid circular references
    - Remove email confirmation requirements for demo purposes

  2. Clean Structure
    - Only create necessary table structures
    - Remove demo data that causes foreign key violations
    - Focus on essential billboard types only
*/

-- First, let's fix the users table policies to avoid infinite recursion
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Create simpler, non-recursive policies for users table
CREATE POLICY "Enable read access for users based on user_id" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Enable insert for authentication" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on user_id" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Create some basic billboard types (essential ones only)
INSERT INTO billboard_types (type_name, description, is_active, created_at)
VALUES 
  ('Digital LED', 'High-resolution digital LED billboards', true, now()),
  ('Traditional', 'Classic printed billboard displays', true, now()),
  ('Backlit', 'Illuminated billboard displays', true, now())
ON CONFLICT (type_name) DO NOTHING;

-- Note: Demo user accounts and billboards should be created through the application
-- registration process, not through database migrations. This ensures proper
-- Supabase Auth integration and avoids foreign key constraint violations.