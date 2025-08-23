/*
  # Auto-confirm email addresses for new users

  1. Database Function
    - Creates a function to automatically confirm email addresses
    - Triggers on user creation in auth.users table

  2. Security
    - Ensures all new users have confirmed emails by default
    - Eliminates manual email confirmation step
*/

-- Function to auto-confirm emails
CREATE OR REPLACE FUNCTION auto_confirm_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-confirm email for new users
  NEW.email_confirmed_at = NOW();
  NEW.confirmed_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-confirm emails on user creation
DROP TRIGGER IF EXISTS auto_confirm_email_trigger ON auth.users;
CREATE TRIGGER auto_confirm_email_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_confirm_email();