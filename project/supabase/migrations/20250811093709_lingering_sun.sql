/*
  # Fix ambiguous cache_key column reference

  1. Database Functions
    - Fix `set_dashboard_cache` function to resolve column ambiguity
    - Fix `get_dashboard_cache` function for consistency
  
  2. Changes Made
    - Rename function parameters to avoid conflicts with column names
    - Use explicit parameter references in SQL statements
    - Ensure proper table column qualification
*/

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS set_dashboard_cache(text, jsonb, integer);
DROP FUNCTION IF EXISTS get_dashboard_cache(text);

-- Create fixed set_dashboard_cache function with unambiguous parameter names
CREATE OR REPLACE FUNCTION set_dashboard_cache(
  p_cache_key text,
  p_cache_data jsonb,
  p_ttl_seconds integer DEFAULT 300
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  p_expires_at timestamptz;
BEGIN
  -- Calculate expiration time
  p_expires_at := now() + (p_ttl_seconds || ' seconds')::interval;
  
  -- Delete existing cache entry
  DELETE FROM admin_dashboard_cache 
  WHERE admin_dashboard_cache.cache_key = p_cache_key;
  
  -- Insert new cache entry
  INSERT INTO admin_dashboard_cache (cache_key, cache_data, expires_at)
  VALUES (p_cache_key, p_cache_data, p_expires_at);
END;
$$;

-- Create fixed get_dashboard_cache function with unambiguous parameter names
CREATE OR REPLACE FUNCTION get_dashboard_cache(
  p_cache_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT admin_dashboard_cache.cache_data INTO result
  FROM admin_dashboard_cache
  WHERE admin_dashboard_cache.cache_key = p_cache_key
    AND admin_dashboard_cache.expires_at > now();
  
  RETURN result;
END;
$$;