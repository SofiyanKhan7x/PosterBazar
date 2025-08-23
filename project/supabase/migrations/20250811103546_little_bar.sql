/*
  # Create Vendor Ad Pricing RPC Functions

  1. New Functions
    - `get_vendor_ad_pricing()` - Returns current vendor ad pricing data
    - `update_vendor_ad_pricing()` - Updates pricing with audit trail
    - `get_pricing_history()` - Returns pricing change history

  2. Security
    - Functions use SECURITY DEFINER for elevated privileges
    - Proper parameter validation and error handling
    - Audit logging for all pricing changes

  3. Real-time Support
    - Functions work with Supabase real-time subscriptions
    - Proper data formatting for frontend consumption
*/

-- Function to get current vendor ad pricing
CREATE OR REPLACE FUNCTION get_vendor_ad_pricing()
RETURNS TABLE (
  id uuid,
  ad_type_id uuid,
  ad_type_name text,
  base_price numeric(10,2),
  currency text,
  effective_from timestamptz,
  last_updated timestamptz,
  updated_by_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vap.id,
    vap.ad_type_id,
    at.type_name as ad_type_name,
    vap.base_price,
    vap.currency,
    vap.effective_from,
    vap.updated_at as last_updated,
    u.name as updated_by_name
  FROM vendor_ad_pricing vap
  JOIN ad_types at ON vap.ad_type_id = at.id
  LEFT JOIN users u ON vap.updated_by = u.id
  WHERE vap.is_active = true
  ORDER BY at.type_name;
END;
$$;

-- Function to update vendor ad pricing
CREATE OR REPLACE FUNCTION update_vendor_ad_pricing(
  p_ad_type_id uuid,
  p_new_price numeric(10,2),
  p_admin_id uuid,
  p_change_reason text DEFAULT 'Admin price update'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_price numeric(10,2);
  v_pricing_record record;
  v_result json;
BEGIN
  -- Validate admin permissions
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = p_admin_id 
    AND role = 'admin' 
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'admin_required: Only active administrators can update pricing';
  END IF;

  -- Validate price
  IF p_new_price < 0 THEN
    RAISE EXCEPTION 'invalid_price: Price must be positive';
  END IF;

  IF p_new_price > 1000000 THEN
    RAISE EXCEPTION 'price_too_high: Price cannot exceed ₹10,00,000';
  END IF;

  -- Get current price
  SELECT base_price INTO v_old_price
  FROM vendor_ad_pricing
  WHERE ad_type_id = p_ad_type_id AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'pricing_not_found: No active pricing found for this ad type';
  END IF;

  -- Update pricing
  UPDATE vendor_ad_pricing
  SET 
    base_price = p_new_price,
    updated_by = p_admin_id,
    updated_at = now()
  WHERE ad_type_id = p_ad_type_id AND is_active = true;

  -- Insert pricing history record
  INSERT INTO pricing_history (
    ad_type_id,
    old_price,
    new_price,
    change_reason,
    changed_by,
    change_timestamp
  ) VALUES (
    p_ad_type_id,
    v_old_price,
    p_new_price,
    p_change_reason,
    p_admin_id,
    now()
  );

  -- Create pricing notification for vendors
  INSERT INTO pricing_notifications (
    ad_type_id,
    notification_type,
    old_price,
    new_price,
    affected_vendors,
    broadcast_timestamp
  ) 
  SELECT 
    p_ad_type_id,
    'price_update',
    v_old_price,
    p_new_price,
    ARRAY(SELECT id::text FROM users WHERE role = 'vendor' AND is_active = true),
    now();

  -- Prepare result
  v_result := json_build_object(
    'success', true,
    'ad_type_id', p_ad_type_id,
    'old_price', v_old_price,
    'new_price', p_new_price,
    'updated_by', p_admin_id,
    'timestamp', now()
  );

  RETURN v_result;
END;
$$;

-- Function to get pricing history
CREATE OR REPLACE FUNCTION get_pricing_history(
  p_ad_type_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  ad_type_id uuid,
  ad_type_name text,
  old_price numeric(10,2),
  new_price numeric(10,2),
  change_reason text,
  changed_by_name text,
  change_timestamp timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ph.id,
    ph.ad_type_id,
    at.type_name as ad_type_name,
    ph.old_price,
    ph.new_price,
    ph.change_reason,
    u.name as changed_by_name,
    ph.change_timestamp
  FROM pricing_history ph
  JOIN ad_types at ON ph.ad_type_id = at.id
  LEFT JOIN users u ON ph.changed_by = u.id
  WHERE (p_ad_type_id IS NULL OR ph.ad_type_id = p_ad_type_id)
  ORDER BY ph.change_timestamp DESC
  LIMIT p_limit;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_vendor_ad_pricing() TO authenticated;
GRANT EXECUTE ON FUNCTION update_vendor_ad_pricing(uuid, numeric, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pricing_history(uuid, integer) TO authenticated;