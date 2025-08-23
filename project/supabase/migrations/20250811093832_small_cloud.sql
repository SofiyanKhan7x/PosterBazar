/*
  # Fix Admin Security Functions

  1. Function Updates
    - Fix ambiguous column reference in `check_admin_rate_limit`
    - Recreate `set_dashboard_cache` with correct parameter names
    
  2. Changes Made
    - Qualify all column references with table aliases
    - Ensure parameter names match client-side calls
    - Remove ambiguity in SQL queries
*/

-- Drop existing functions to recreate them
DROP FUNCTION IF EXISTS check_admin_rate_limit(text, inet);
DROP FUNCTION IF EXISTS set_dashboard_cache(text, jsonb, integer);

-- Recreate check_admin_rate_limit function with proper column qualification
CREATE OR REPLACE FUNCTION check_admin_rate_limit(
  admin_email text,
  client_ip inet DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  max_attempts integer := 5;
  lockout_duration interval := '15 minutes';
  recent_failures integer := 0;
  latest_blocked_until timestamptz;
  result jsonb;
BEGIN
  -- Count recent failed attempts (last 15 minutes)
  SELECT COUNT(*), MAX(ala.blocked_until)
  INTO recent_failures, latest_blocked_until
  FROM admin_login_attempts ala
  WHERE ala.email = admin_email
    AND ala.success = false
    AND ala.attempted_at > (now() - lockout_duration);

  -- Check if currently blocked
  IF latest_blocked_until IS NOT NULL AND latest_blocked_until > now() THEN
    result := jsonb_build_object(
      'allowed', false,
      'reason', 'rate_limited',
      'blocked_until', latest_blocked_until,
      'attempts_remaining', 0
    );
  ELSIF recent_failures >= max_attempts THEN
    result := jsonb_build_object(
      'allowed', false,
      'reason', 'rate_limit_exceeded',
      'blocked_until', now() + lockout_duration,
      'attempts_remaining', 0
    );
  ELSE
    result := jsonb_build_object(
      'allowed', true,
      'attempts_remaining', max_attempts - recent_failures
    );
  END IF;

  RETURN result;
END;
$$;

-- Recreate set_dashboard_cache function with correct parameter names
CREATE OR REPLACE FUNCTION set_dashboard_cache(
  cache_key text,
  cache_data jsonb,
  ttl_seconds integer DEFAULT 300
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expires_at_value timestamptz;
BEGIN
  expires_at_value := now() + (ttl_seconds || ' seconds')::interval;
  
  -- Delete existing entry first
  DELETE FROM admin_dashboard_cache adc
  WHERE adc.cache_key = set_dashboard_cache.cache_key;
  
  -- Insert new entry
  INSERT INTO admin_dashboard_cache (cache_key, cache_data, expires_at)
  VALUES (set_dashboard_cache.cache_key, set_dashboard_cache.cache_data, expires_at_value);
END;
$$;