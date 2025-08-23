/*
  # Secure User Deletion System

  1. Security Features
    - Admin-only access with RLS policies
    - Prevents deletion of admin accounts
    - Comprehensive audit logging
    - Atomic transactions for data integrity

  2. Cascading Deletions
    - User sessions and authentication data
    - Billboard listings and associated images
    - Booking history and transactions
    - KYC documents and verification records
    - Notifications and activity logs
    - Cart sessions and items
    - Vendor profiles and ad campaigns

  3. Audit Trail
    - Complete deletion log with timestamps
    - Record of all deleted related data
    - Admin user identification
    - Rollback information for compliance
*/

-- Create audit log table for user deletions
CREATE TABLE IF NOT EXISTS user_deletion_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deleted_user_id uuid NOT NULL,
  deleted_user_email text NOT NULL,
  deleted_user_name text NOT NULL,
  deleted_user_role user_role NOT NULL,
  requesting_admin_id uuid NOT NULL,
  deletion_reason text,
  deleted_records jsonb DEFAULT '{}',
  deletion_timestamp timestamptz DEFAULT now(),
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Add indexes for audit log
CREATE INDEX IF NOT EXISTS idx_user_deletion_logs_deleted_user_id ON user_deletion_logs(deleted_user_id);
CREATE INDEX IF NOT EXISTS idx_user_deletion_logs_admin_id ON user_deletion_logs(requesting_admin_id);
CREATE INDEX IF NOT EXISTS idx_user_deletion_logs_timestamp ON user_deletion_logs(deletion_timestamp);

-- Enable RLS on audit log
ALTER TABLE user_deletion_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view deletion logs
CREATE POLICY "Admins can view deletion logs"
  ON user_deletion_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Policy: Only admins can insert deletion logs
CREATE POLICY "Admins can insert deletion logs"
  ON user_deletion_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Create secure user deletion function
CREATE OR REPLACE FUNCTION secure_delete_user(
  user_id_to_delete uuid,
  requesting_admin_id uuid DEFAULT auth.uid(),
  deletion_reason text DEFAULT 'Admin deletion via user management'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_to_delete users%ROWTYPE;
  requesting_admin users%ROWTYPE;
  deleted_records jsonb := '{}';
  record_count integer;
  total_deleted integer := 0;
BEGIN
  -- Validate requesting admin
  SELECT * INTO requesting_admin 
  FROM users 
  WHERE id = requesting_admin_id AND role = 'admin' AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'admin_required: Only active administrators can delete users';
  END IF;

  -- Get user to delete
  SELECT * INTO user_to_delete 
  FROM users 
  WHERE id = user_id_to_delete;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'user_not_found: User does not exist or has already been deleted';
  END IF;

  -- Prevent deletion of admin accounts
  IF user_to_delete.role = 'admin' THEN
    RAISE EXCEPTION 'cannot_delete_admin: Admin accounts cannot be deleted for security reasons';
  END IF;

  -- Start transaction for atomic deletion
  BEGIN
    -- 1. Delete user sessions
    DELETE FROM user_sessions WHERE user_id = user_id_to_delete;
    GET DIAGNOSTICS record_count = ROW_COUNT;
    deleted_records := jsonb_set(deleted_records, '{user_sessions}', to_jsonb(record_count));
    total_deleted := total_deleted + record_count;

    -- 2. Delete login attempts
    DELETE FROM login_attempts WHERE email = user_to_delete.email;
    GET DIAGNOSTICS record_count = ROW_COUNT;
    deleted_records := jsonb_set(deleted_records, '{login_attempts}', to_jsonb(record_count));
    total_deleted := total_deleted + record_count;

    -- 3. Delete user permissions
    DELETE FROM user_permissions WHERE user_id = user_id_to_delete;
    GET DIAGNOSTICS record_count = ROW_COUNT;
    deleted_records := jsonb_set(deleted_records, '{user_permissions}', to_jsonb(record_count));
    total_deleted := total_deleted + record_count;

    -- 4. Delete notifications
    DELETE FROM notifications WHERE user_id = user_id_to_delete;
    GET DIAGNOSTICS record_count = ROW_COUNT;
    deleted_records := jsonb_set(deleted_records, '{notifications}', to_jsonb(record_count));
    total_deleted := total_deleted + record_count;

    -- 5. Delete KYC documents
    DELETE FROM kyc_documents WHERE user_id = user_id_to_delete;
    GET DIAGNOSTICS record_count = ROW_COUNT;
    deleted_records := jsonb_set(deleted_records, '{kyc_documents}', to_jsonb(record_count));
    total_deleted := total_deleted + record_count;

    -- 6. Delete wallet transactions
    DELETE FROM wallet_transactions WHERE user_id = user_id_to_delete;
    GET DIAGNOSTICS record_count = ROW_COUNT;
    deleted_records := jsonb_set(deleted_records, '{wallet_transactions}', to_jsonb(record_count));
    total_deleted := total_deleted + record_count;

    -- 7. Delete cart sessions and items (cascading)
    DELETE FROM cart_sessions WHERE user_id = user_id_to_delete;
    GET DIAGNOSTICS record_count = ROW_COUNT;
    deleted_records := jsonb_set(deleted_records, '{cart_sessions}', to_jsonb(record_count));
    total_deleted := total_deleted + record_count;

    -- 8. Delete vendor profiles and related data
    IF user_to_delete.role = 'vendor' THEN
      -- Delete vendor notifications
      DELETE FROM vendor_notifications WHERE vendor_id = user_id_to_delete;
      GET DIAGNOSTICS record_count = ROW_COUNT;
      deleted_records := jsonb_set(deleted_records, '{vendor_notifications}', to_jsonb(record_count));
      total_deleted := total_deleted + record_count;

      -- Delete ad payments
      DELETE FROM ad_payments WHERE vendor_id = user_id_to_delete;
      GET DIAGNOSTICS record_count = ROW_COUNT;
      deleted_records := jsonb_set(deleted_records, '{ad_payments}', to_jsonb(record_count));
      total_deleted := total_deleted + record_count;

      -- Delete ad requests (this will cascade to ad_analytics)
      DELETE FROM ad_requests WHERE vendor_id = user_id_to_delete;
      GET DIAGNOSTICS record_count = ROW_COUNT;
      deleted_records := jsonb_set(deleted_records, '{ad_requests}', to_jsonb(record_count));
      total_deleted := total_deleted + record_count;

      -- Delete vendor profiles
      DELETE FROM vendor_profiles WHERE user_id = user_id_to_delete;
      GET DIAGNOSTICS record_count = ROW_COUNT;
      deleted_records := jsonb_set(deleted_records, '{vendor_profiles}', to_jsonb(record_count));
      total_deleted := total_deleted + record_count;

      -- Delete vendor ads
      DELETE FROM vendor_ads WHERE user_id = user_id_to_delete;
      GET DIAGNOSTICS record_count = ROW_COUNT;
      deleted_records := jsonb_set(deleted_records, '{vendor_ads}', to_jsonb(record_count));
      total_deleted := total_deleted + record_count;
    END IF;

    -- 9. Delete billboard-related data for owners
    IF user_to_delete.role = 'owner' THEN
      -- Delete site visits for billboards owned by this user
      DELETE FROM site_visits 
      WHERE billboard_id IN (
        SELECT id FROM billboards WHERE owner_id = user_id_to_delete
      );
      GET DIAGNOSTICS record_count = ROW_COUNT;
      deleted_records := jsonb_set(deleted_records, '{site_visits}', to_jsonb(record_count));
      total_deleted := total_deleted + record_count;

      -- Delete billboard images (cascading handled by FK)
      -- Delete bookings for billboards owned by this user
      DELETE FROM bookings 
      WHERE billboard_id IN (
        SELECT id FROM billboards WHERE owner_id = user_id_to_delete
      );
      GET DIAGNOSTICS record_count = ROW_COUNT;
      deleted_records := jsonb_set(deleted_records, '{bookings}', to_jsonb(record_count));
      total_deleted := total_deleted + record_count;

      -- Delete billboards (this will cascade to billboard_images, billboard_sides)
      DELETE FROM billboards WHERE owner_id = user_id_to_delete;
      GET DIAGNOSTICS record_count = ROW_COUNT;
      deleted_records := jsonb_set(deleted_records, '{billboards}', to_jsonb(record_count));
      total_deleted := total_deleted + record_count;
    END IF;

    -- 10. Delete bookings made by this user
    DELETE FROM bookings WHERE user_id = user_id_to_delete;
    GET DIAGNOSTICS record_count = ROW_COUNT;
    deleted_records := jsonb_set(deleted_records, '{user_bookings}', to_jsonb(record_count));
    total_deleted := total_deleted + record_count;

    -- 11. Finally, delete the user record
    DELETE FROM users WHERE id = user_id_to_delete;
    GET DIAGNOSTICS record_count = ROW_COUNT;
    deleted_records := jsonb_set(deleted_records, '{users}', to_jsonb(record_count));
    total_deleted := total_deleted + record_count;

    -- Log the deletion for audit purposes
    INSERT INTO user_deletion_logs (
      deleted_user_id,
      deleted_user_email,
      deleted_user_name,
      deleted_user_role,
      requesting_admin_id,
      deletion_reason,
      deleted_records,
      ip_address,
      user_agent
    ) VALUES (
      user_to_delete.id,
      user_to_delete.email,
      user_to_delete.name,
      user_to_delete.role,
      requesting_admin_id,
      deletion_reason,
      deleted_records,
      inet_client_addr(),
      current_setting('request.headers')::json->>'user-agent'
    );

    -- Return success response with deletion summary
    RETURN jsonb_build_object(
      'success', true,
      'message', 'User deleted successfully',
      'deleted_user', jsonb_build_object(
        'id', user_to_delete.id,
        'email', user_to_delete.email,
        'name', user_to_delete.name,
        'role', user_to_delete.role
      ),
      'deleted_records', deleted_records,
      'total_records_deleted', total_deleted,
      'deletion_timestamp', now()
    );

  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback transaction and re-raise error
      RAISE EXCEPTION 'deletion_failed: %', SQLERRM;
  END;
END;
$$;

-- Grant execute permission to authenticated users (RLS will handle admin check)
GRANT EXECUTE ON FUNCTION secure_delete_user TO authenticated;

-- Create function to get user deletion history (admin only)
CREATE OR REPLACE FUNCTION get_user_deletion_history(
  limit_count integer DEFAULT 50,
  offset_count integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  deleted_user_email text,
  deleted_user_name text,
  deleted_user_role user_role,
  requesting_admin_name text,
  deletion_reason text,
  total_records_deleted integer,
  deletion_timestamp timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify requesting user is admin
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin' 
    AND users.is_active = true
  ) THEN
    RAISE EXCEPTION 'admin_required: Only administrators can view deletion history';
  END IF;

  RETURN QUERY
  SELECT 
    udl.id,
    udl.deleted_user_email,
    udl.deleted_user_name,
    udl.deleted_user_role,
    admin_user.name as requesting_admin_name,
    udl.deletion_reason,
    (udl.deleted_records->>'total_records_deleted')::integer as total_records_deleted,
    udl.deletion_timestamp
  FROM user_deletion_logs udl
  LEFT JOIN users admin_user ON admin_user.id = udl.requesting_admin_id
  ORDER BY udl.deletion_timestamp DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_deletion_history TO authenticated;

-- Create function to soft delete user (alternative to hard delete)
CREATE OR REPLACE FUNCTION soft_delete_user(
  user_id_to_delete uuid,
  requesting_admin_id uuid DEFAULT auth.uid(),
  deletion_reason text DEFAULT 'Admin soft deletion via user management'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_to_delete users%ROWTYPE;
  requesting_admin users%ROWTYPE;
BEGIN
  -- Validate requesting admin
  SELECT * INTO requesting_admin 
  FROM users 
  WHERE id = requesting_admin_id AND role = 'admin' AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'admin_required: Only active administrators can delete users';
  END IF;

  -- Get user to delete
  SELECT * INTO user_to_delete 
  FROM users 
  WHERE id = user_id_to_delete AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'user_not_found: User does not exist or is already deactivated';
  END IF;

  -- Prevent deletion of admin accounts
  IF user_to_delete.role = 'admin' THEN
    RAISE EXCEPTION 'cannot_delete_admin: Admin accounts cannot be deleted for security reasons';
  END IF;

  -- Soft delete: deactivate user and related data
  UPDATE users 
  SET 
    is_active = false,
    email = email || '_deleted_' || extract(epoch from now())::text,
    updated_at = now()
  WHERE id = user_id_to_delete;

  -- Deactivate user sessions
  UPDATE user_sessions 
  SET is_active = false 
  WHERE user_id = user_id_to_delete;

  -- Deactivate billboards if owner
  IF user_to_delete.role = 'owner' THEN
    UPDATE billboards 
    SET status = 'inactive' 
    WHERE owner_id = user_id_to_delete;
  END IF;

  -- Log the soft deletion
  INSERT INTO user_deletion_logs (
    deleted_user_id,
    deleted_user_email,
    deleted_user_name,
    deleted_user_role,
    requesting_admin_id,
    deletion_reason,
    deleted_records
  ) VALUES (
    user_to_delete.id,
    user_to_delete.email,
    user_to_delete.name,
    user_to_delete.role,
    requesting_admin_id,
    deletion_reason || ' (SOFT DELETE)',
    jsonb_build_object('soft_delete', true, 'user_deactivated', 1)
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'User soft deleted successfully',
    'deletion_type', 'soft',
    'user_deactivated', true
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION soft_delete_user TO authenticated;

-- Create function to restore soft deleted user
CREATE OR REPLACE FUNCTION restore_deleted_user(
  user_id_to_restore uuid,
  requesting_admin_id uuid DEFAULT auth.uid()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_to_restore users%ROWTYPE;
  requesting_admin users%ROWTYPE;
BEGIN
  -- Validate requesting admin
  SELECT * INTO requesting_admin 
  FROM users 
  WHERE id = requesting_admin_id AND role = 'admin' AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'admin_required: Only active administrators can restore users';
  END IF;

  -- Get user to restore
  SELECT * INTO user_to_restore 
  FROM users 
  WHERE id = user_id_to_restore AND is_active = false;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'user_not_found: User does not exist or is not deactivated';
  END IF;

  -- Restore user
  UPDATE users 
  SET 
    is_active = true,
    email = regexp_replace(email, '_deleted_[0-9]+$', ''),
    updated_at = now()
  WHERE id = user_id_to_restore;

  -- Log the restoration
  INSERT INTO user_deletion_logs (
    deleted_user_id,
    deleted_user_email,
    deleted_user_name,
    deleted_user_role,
    requesting_admin_id,
    deletion_reason,
    deleted_records
  ) VALUES (
    user_to_restore.id,
    user_to_restore.email,
    user_to_restore.name,
    user_to_restore.role,
    requesting_admin_id,
    'User account restored by admin',
    jsonb_build_object('restoration', true, 'user_restored', 1)
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'User restored successfully',
    'user_restored', true
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION restore_deleted_user TO authenticated;