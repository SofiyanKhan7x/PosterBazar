/*
  # Add fields to site_visits table for verification workflow

  1. New Fields
    - `location_accuracy` - Tracks how accurate the billboard location is
    - `structural_condition` - Records the physical condition of the billboard
    - `visibility_rating` - Numeric rating of billboard visibility
    - `issues_found` - Array of issues found during verification
    - `recommendations` - Recommendations for improvements
    - `accessibility_notes` - Notes about accessing the billboard location
  
  2. Changes
    - Adds new fields to the site_visits table to support comprehensive verification
    - Ensures backward compatibility with existing records
*/

-- Add new fields to site_visits table for enhanced verification
ALTER TABLE site_visits 
ADD COLUMN IF NOT EXISTS location_accuracy TEXT,
ADD COLUMN IF NOT EXISTS structural_condition TEXT,
ADD COLUMN IF NOT EXISTS visibility_rating INTEGER,
ADD COLUMN IF NOT EXISTS issues_found TEXT[],
ADD COLUMN IF NOT EXISTS recommendations TEXT,
ADD COLUMN IF NOT EXISTS accessibility_notes TEXT;

-- Create a new notification for the sub-admin to demonstrate the workflow
INSERT INTO notifications (
  user_id,
  title,
  message,
  type,
  is_read,
  related_id,
  related_type,
  created_at
) VALUES 
  (
    '55555555-5555-5555-5555-555555555555', -- Sub-admin user
    'New Verification Assignment',
    'You have been assigned to verify a new billboard. Please complete the verification within 48 hours.',
    'info',
    false,
    'pending-bb-connaught-place-delhi',
    'billboard',
    now()
  )
ON CONFLICT (id) DO NOTHING;