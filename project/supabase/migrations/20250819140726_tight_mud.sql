/*
  # Add missing columns to site_visits table

  1. New Columns
    - `accessibility_notes` (text) - Notes about access to the billboard location
    - `location_accuracy` (text) - Accuracy of the location (exact, approximate, incorrect)
    - `structural_condition` (text) - Condition of the billboard structure
    - `visibility_rating` (integer) - Visibility rating from 1-10
    - `issues_found` (text[]) - Array of issues found during verification
    - `recommendations` (text) - Recommendations for improvements

  2. Security
    - Maintain existing RLS policies
    - Add constraints for data validation
*/

-- Add missing columns to site_visits table
DO $$
BEGIN
  -- Add accessibility_notes column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_visits' AND column_name = 'accessibility_notes'
  ) THEN
    ALTER TABLE site_visits ADD COLUMN accessibility_notes text;
  END IF;

  -- Add location_accuracy column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_visits' AND column_name = 'location_accuracy'
  ) THEN
    ALTER TABLE site_visits ADD COLUMN location_accuracy text DEFAULT 'exact';
  END IF;

  -- Add structural_condition column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_visits' AND column_name = 'structural_condition'
  ) THEN
    ALTER TABLE site_visits ADD COLUMN structural_condition text DEFAULT 'excellent';
  END IF;

  -- Add visibility_rating column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_visits' AND column_name = 'visibility_rating'
  ) THEN
    ALTER TABLE site_visits ADD COLUMN visibility_rating integer DEFAULT 8;
  END IF;

  -- Add issues_found column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_visits' AND column_name = 'issues_found'
  ) THEN
    ALTER TABLE site_visits ADD COLUMN issues_found text[] DEFAULT '{}';
  END IF;

  -- Add recommendations column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_visits' AND column_name = 'recommendations'
  ) THEN
    ALTER TABLE site_visits ADD COLUMN recommendations text;
  END IF;
END $$;

-- Add constraints for data validation
DO $$
BEGIN
  -- Add constraint for location_accuracy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'site_visits' AND constraint_name = 'site_visits_location_accuracy_check'
  ) THEN
    ALTER TABLE site_visits ADD CONSTRAINT site_visits_location_accuracy_check
    CHECK (location_accuracy IN ('exact', 'approximate', 'incorrect'));
  END IF;

  -- Add constraint for structural_condition if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'site_visits' AND constraint_name = 'site_visits_structural_condition_check'
  ) THEN
    ALTER TABLE site_visits ADD CONSTRAINT site_visits_structural_condition_check
    CHECK (structural_condition IN ('excellent', 'good', 'fair', 'poor'));
  END IF;

  -- Add constraint for visibility_rating if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'site_visits' AND constraint_name = 'site_visits_visibility_rating_check'
  ) THEN
    ALTER TABLE site_visits ADD CONSTRAINT site_visits_visibility_rating_check
    CHECK (visibility_rating >= 1 AND visibility_rating <= 10);
  END IF;
END $$;