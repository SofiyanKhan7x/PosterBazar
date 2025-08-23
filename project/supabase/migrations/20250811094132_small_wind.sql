/*
  # User Deletion System

  1. New Functions
    - `secure_delete_user_complete` - Completely removes user and all related data
    - `check_user_deletion_status` - Checks if user account was deleted
    
  2. Security
    - Only admins can delete users
    - Comprehensive cascading deletion
    - Audit logging for all deletions
    - Prevention of admin account deletion
*/

-- Function to securely delete user and all related data
CREATE OR REPLACE FUNCTION secure_delete_user_complete(
  user_id_to_delete UUID,
  deletion_reason TEXT DEFAULT 'Admin deletion'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_to_delete RECORD;
  requesting_admin_id UUID;
  deleted_records JSONB := '{}';
  total_deleted INTEGER := 0;
  temp_count INTEGER;
BEGIN
  -- Get requesting admin ID from auth context
  requesting_admin_id := auth.uid();
  
  -- Verify requesting user is admin
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = requesting_admin_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'admin_required: Only administrators can delete users';
  END IF;
  
  -- Get user to delete
  SELECT * INTO user_to_delete 
  FROM users 
  WHERE id = user_id_to_delete;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'user_not_found: User not found';
  END IF;
  
  -- Prevent deletion of admin accounts
  IF user_to_delete.role = 'admin' THEN
    RAISE EXCEPTION 'cannot_delete_admin: Admin accounts cannot be deleted for security reasons';
  END IF;
  
  -- Log deletion before starting
  INSERT INTO user_deletion_logs (
    deleted_user_id,
    deleted_user_email,
    deleted_user_name,
    deleted_user_role,
    requesting_admin_id,
    deletion_reason,
    ip_address,
    user_agent
  ) VALUES (
    user_to_delete.id,
    user_to_delete.email,
    user_to_delete.name,
    user_to_delete.role,
    requesting_admin_id,
    deletion_reason,
    NULL, -- Would be set by application
    NULL  -- Would be set by application
  );
  
  -- Start cascading deletion
  
  -- Delete user sessions
  DELETE FROM user_sessions WHERE user_id = user_id_to_delete;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_records := deleted_records || jsonb_build_object('user_sessions', temp_count);
  total_deleted := total_deleted + temp_count;
  
  -- Delete login attempts
  DELETE FROM login_attempts WHERE email = user_to_delete.email;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_records := deleted_records || jsonb_build_object('login_attempts', temp_count);
  total_deleted := total_deleted + temp_count;
  
  -- Delete admin login attempts if sub_admin
  IF user_to_delete.role = 'sub_admin' THEN
    DELETE FROM admin_login_attempts WHERE admin_id = user_id_to_delete;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_records := deleted_records || jsonb_build_object('admin_login_attempts', temp_count);
    total_deleted := total_deleted + temp_count;
  END IF;
  
  -- Delete user permissions
  DELETE FROM user_permissions WHERE user_id = user_id_to_delete;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_records := deleted_records || jsonb_build_object('user_permissions', temp_count);
  total_deleted := total_deleted + temp_count;
  
  -- Delete notifications
  DELETE FROM notifications WHERE user_id = user_id_to_delete;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_records := deleted_records || jsonb_build_object('notifications', temp_count);
  total_deleted := total_deleted + temp_count;
  
  -- Delete vendor notifications if vendor
  IF user_to_delete.role = 'vendor' THEN
    DELETE FROM vendor_notifications WHERE vendor_id = user_id_to_delete;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_records := deleted_records || jsonb_build_object('vendor_notifications', temp_count);
    total_deleted := total_deleted + temp_count;
  END IF;
  
  -- Delete KYC documents
  DELETE FROM kyc_documents WHERE user_id = user_id_to_delete;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_records := deleted_records || jsonb_build_object('kyc_documents', temp_count);
  total_deleted := total_deleted + temp_count;
  
  -- Delete wallet transactions
  DELETE FROM wallet_transactions WHERE user_id = user_id_to_delete;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_records := deleted_records || jsonb_build_object('wallet_transactions', temp_count);
  total_deleted := total_deleted + temp_count;
  
  -- Delete cart sessions and items
  DELETE FROM cart_items WHERE cart_session_id IN (
    SELECT id FROM cart_sessions WHERE user_id = user_id_to_delete
  );
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_records := deleted_records || jsonb_build_object('cart_items', temp_count);
  total_deleted := total_deleted + temp_count;
  
  DELETE FROM cart_sessions WHERE user_id = user_id_to_delete;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_records := deleted_records || jsonb_build_object('cart_sessions', temp_count);
  total_deleted := total_deleted + temp_count;
  
  -- Delete bookings
  DELETE FROM bookings WHERE user_id = user_id_to_delete;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_records := deleted_records || jsonb_build_object('bookings', temp_count);
  total_deleted := total_deleted + temp_count;
  
  -- Delete vendor profile if vendor
  IF user_to_delete.role = 'vendor' THEN
    DELETE FROM vendor_profiles WHERE user_id = user_id_to_delete;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_records := deleted_records || jsonb_build_object('vendor_profiles', temp_count);
    total_deleted := total_deleted + temp_count;
    
    -- Delete ad requests and related data
    DELETE FROM ad_analytics WHERE ad_request_id IN (
      SELECT id FROM ad_requests WHERE vendor_id = user_id_to_delete
    );
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_records := deleted_records || jsonb_build_object('ad_analytics', temp_count);
    total_deleted := total_deleted + temp_count;
    
    DELETE FROM ad_payments WHERE vendor_id = user_id_to_delete;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_records := deleted_records || jsonb_build_object('ad_payments', temp_count);
    total_deleted := total_deleted + temp_count;
    
    DELETE FROM ad_requests WHERE vendor_id = user_id_to_delete;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_records := deleted_records || jsonb_build_object('ad_requests', temp_count);
    total_deleted := total_deleted + temp_count;
    
    DELETE FROM vendor_ads WHERE user_id = user_id_to_delete;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_records := deleted_records || jsonb_build_object('vendor_ads', temp_count);
    total_deleted := total_deleted + temp_count;
  END IF;
  
  -- Delete billboards if owner (this will cascade to related tables)
  IF user_to_delete.role = 'owner' THEN
    DELETE FROM billboard_images WHERE billboard_id IN (
      SELECT id FROM billboards WHERE owner_id = user_id_to_delete
    );
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_records := deleted_records || jsonb_build_object('billboard_images', temp_count);
    total_deleted := total_deleted + temp_count;
    
    DELETE FROM billboard_sides WHERE billboard_id IN (
      SELECT id FROM billboards WHERE owner_id = user_id_to_delete
    );
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_records := deleted_records || jsonb_build_object('billboard_sides', temp_count);
    total_deleted := total_deleted + temp_count;
    
    DELETE FROM site_visits WHERE billboard_id IN (
      SELECT id FROM billboards WHERE owner_id = user_id_to_delete
    );
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_records := deleted_records || jsonb_build_object('site_visits', temp_count);
    total_deleted := total_deleted + temp_count;
    
    DELETE FROM billboards WHERE owner_id = user_id_to_delete;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_records := deleted_records || jsonb_build_object('billboards', temp_count);
    total_deleted := total_deleted + temp_count;
  END IF;
  
  -- Delete site visits if sub_admin
  IF user_to_delete.role = 'sub_admin' THEN
    DELETE FROM site_visits WHERE sub_admin_id = user_id_to_delete;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_records := deleted_records || jsonb_build_object('site_visits', temp_count);
    total_deleted := total_deleted + temp_count;
  END IF;
  
  -- Finally delete the user record
  DELETE FROM users WHERE id = user_id_to_delete;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_records := deleted_records || jsonb_build_object('users', temp_count);
  total_deleted := total_deleted + temp_count;
  
  -- Update deletion log with final counts
  UPDATE user_deletion_logs 
  SET 
    deleted_records = deleted_records,
    deletion_timestamp = NOW()
  WHERE deleted_user_id = user_id_to_delete 
    AND requesting_admin_id = requesting_admin_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'User deleted successfully',
    'deleted_user', json_build_object(
      'id', user_to_delete.id,
      'email', user_to_delete.email,
      'name', user_to_delete.name,
      'role', user_to_delete.role
    ),
    'deleted_records', deleted_records,
    'total_records_deleted', total_deleted,
    'deletion_timestamp', NOW()
  );
END;
$$;

-- Function to check if user account was deleted
CREATE OR REPLACE FUNCTION check_user_deletion_status(user_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deletion_record RECORD;
BEGIN
  -- Check if user was deleted
  SELECT 
    deleted_user_email,
    deleted_user_name,
    deletion_timestamp,
    deletion_reason
  INTO deletion_record
  FROM user_deletion_logs 
  WHERE deleted_user_email = user_email
  ORDER BY deletion_timestamp DESC
  LIMIT 1;
  
  IF FOUND THEN
    RETURN json_build_object(
      'deleted', true,
      'deletion_date', deletion_record.deletion_timestamp,
      'reason', deletion_record.deletion_reason,
      'message', 'Your account has been deleted by an administrator'
    );
  ELSE
    RETURN json_build_object('deleted', false);
  END IF;
END;
$$;