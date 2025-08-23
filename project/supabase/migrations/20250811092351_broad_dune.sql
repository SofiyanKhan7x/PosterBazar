/*
  # Admin Security and User Management System

  1. Security Features
    - Admin login attempt monitoring with IP tracking
    - Rate limiting for admin accounts (5 attempts per 10 minutes)
    - Real-time session management and monitoring
    - Comprehensive audit logging for all admin actions

  2. Real-time Updates
    - WebSocket-style real-time notifications for admin actions
    - Instant synchronization of user deletions across all admin sessions
    - Dashboard data consistency mechanisms
    - Live user list updates

  3. Enhanced User Deletion
    - Atomic transactions for complete user removal
    - Cascading deletion with proper foreign key handling
    - Real-time notification to all connected admins
    - Comprehensive audit trail

  4. Data Integrity
    - Transaction-based operations for consistency
    - Proper error handling and rollback mechanisms
    - Foreign key constraint management
    - Audit logging for compliance
*/

-- Admin login attempt monitoring with enhanced security
CREATE TABLE IF NOT EXISTS admin_login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES users(id),
  email text NOT NULL,
  ip_address inet,
  user_agent text,
  success boolean DEFAULT false,
  failure_reason text,
  blocked_until timestamptz,
  attempt_count integer DEFAULT 1,
  session_token text,
  attempted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Real-time admin notifications for synchronization
CREATE TABLE IF NOT EXISTS admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type text NOT NULL CHECK (notification_type IN ('user_deleted', 'user_updated', 'dashboard_update', 'security_alert')),
  target_admin_id uuid REFERENCES users(id),
  source_admin_id uuid REFERENCES users(id),
  data jsonb DEFAULT '{}',
  is_processed boolean DEFAULT false,
  expires_at timestamptz DEFAULT (now() + interval '1 hour'),
  created_at timestamptz DEFAULT now()
);

-- Enhanced audit logging for admin actions
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES users(id),
  action_type text NOT NULL,
  target_user_id uuid,
  target_user_email text,
  action_details jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  session_token text,
  success boolean DEFAULT true,
  error_message text,
  execution_time_ms integer,
  created_at timestamptz DEFAULT now()
);

-- Dashboard cache for consistency
CREATE TABLE IF NOT EXISTS admin_dashboard_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key text UNIQUE NOT NULL,
  cache_data jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_email_time ON admin_login_attempts(email, attempted_at);
CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_ip_time ON admin_login_attempts(ip_address, attempted_at);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_target ON admin_notifications(target_admin_id, is_processed);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_time ON admin_audit_log(admin_id, created_at);
CREATE INDEX IF NOT EXISTS idx_dashboard_cache_key_expires ON admin_dashboard_cache(cache_key, expires_at);

-- Enable RLS
ALTER TABLE admin_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_dashboard_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all login attempts"
  ON admin_login_attempts FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

CREATE POLICY "System can insert login attempts"
  ON admin_login_attempts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view notifications"
  ON admin_notifications FOR SELECT
  TO authenticated
  USING (target_admin_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

CREATE POLICY "Admins can insert notifications"
  ON admin_notifications FOR INSERT
  TO authenticated
  WITH CHECK (source_admin_id = auth.uid());

CREATE POLICY "Admins can view audit logs"
  ON admin_audit_log FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

CREATE POLICY "System can insert audit logs"
  ON admin_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage dashboard cache"
  ON admin_dashboard_cache FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- Function to check admin rate limiting
CREATE OR REPLACE FUNCTION check_admin_rate_limit(
  admin_email text,
  client_ip inet DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  attempt_count integer;
  last_attempt timestamptz;
  blocked_until timestamptz;
  rate_limit_window interval := '10 minutes';
  max_attempts integer := 5;
  block_duration interval := '30 minutes';
BEGIN
  -- Get recent attempt count and last attempt time
  SELECT 
    COUNT(*),
    MAX(attempted_at),
    MAX(blocked_until)
  INTO attempt_count, last_attempt, blocked_until
  FROM admin_login_attempts
  WHERE email = admin_email
    AND attempted_at > (now() - rate_limit_window)
    AND (client_ip IS NULL OR ip_address = client_ip);

  -- Check if currently blocked
  IF blocked_until IS NOT NULL AND blocked_until > now() THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'rate_limited',
      'blocked_until', blocked_until,
      'attempts_remaining', 0
    );
  END IF;

  -- Check if rate limit exceeded
  IF attempt_count >= max_attempts THEN
    -- Block the account/IP
    blocked_until := now() + block_duration;
    
    INSERT INTO admin_login_attempts (
      email, ip_address, success, failure_reason, 
      blocked_until, attempt_count
    ) VALUES (
      admin_email, client_ip, false, 'rate_limit_exceeded',
      blocked_until, attempt_count + 1
    );

    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'rate_limit_exceeded',
      'blocked_until', blocked_until,
      'attempts_remaining', 0
    );
  END IF;

  -- Allow the attempt
  RETURN jsonb_build_object(
    'allowed', true,
    'attempts_remaining', max_attempts - attempt_count
  );
END;
$$;

-- Function to log admin login attempts
CREATE OR REPLACE FUNCTION log_admin_login_attempt(
  admin_email text,
  client_ip inet DEFAULT NULL,
  client_user_agent text DEFAULT NULL,
  login_success boolean DEFAULT false,
  failure_reason text DEFAULT NULL,
  session_token text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Get admin user ID if login was successful
  IF login_success THEN
    SELECT id INTO admin_user_id
    FROM users
    WHERE email = admin_email AND role = 'admin' AND is_active = true;
  END IF;

  -- Insert login attempt record
  INSERT INTO admin_login_attempts (
    admin_id, email, ip_address, user_agent, success, 
    failure_reason, session_token, attempted_at
  ) VALUES (
    admin_user_id, admin_email, client_ip, client_user_agent,
    login_success, failure_reason, session_token, now()
  );

  -- Reset attempt count on successful login
  IF login_success THEN
    UPDATE admin_login_attempts
    SET blocked_until = NULL
    WHERE email = admin_email;
  END IF;
END;
$$;

-- Enhanced secure user deletion with real-time notifications
CREATE OR REPLACE FUNCTION secure_delete_user_with_notifications(
  user_id_to_delete uuid,
  requesting_admin_id uuid DEFAULT auth.uid(),
  deletion_reason text DEFAULT 'Admin deletion via user management'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_user record;
  user_to_delete record;
  deletion_start_time timestamptz;
  execution_time_ms integer;
  deleted_records jsonb := '{}';
  total_records_deleted integer := 0;
  error_occurred boolean := false;
  error_message text;
BEGIN
  deletion_start_time := now();
  
  -- Verify requesting user is an active admin
  SELECT id, email, name, role INTO admin_user
  FROM users
  WHERE id = requesting_admin_id 
    AND role = 'admin' 
    AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'admin_required: Only active administrators can delete users';
  END IF;

  -- Get user to delete
  SELECT id, email, name, role INTO user_to_delete
  FROM users
  WHERE id = user_id_to_delete;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'user_not_found: User does not exist or has already been deleted';
  END IF;

  -- Prevent deletion of admin accounts
  IF user_to_delete.role = 'admin' THEN
    RAISE EXCEPTION 'cannot_delete_admin: Admin accounts cannot be deleted for security reasons';
  END IF;

  BEGIN
    -- Start transaction for atomic deletion
    
    -- Delete user sessions
    WITH deleted_sessions AS (
      DELETE FROM user_sessions WHERE user_id = user_id_to_delete RETURNING *
    )
    SELECT count(*) INTO deleted_records FROM deleted_sessions;
    deleted_records := deleted_records || jsonb_build_object('user_sessions', (deleted_records->>'user_sessions')::integer);
    total_records_deleted := total_records_deleted + (deleted_records->>'user_sessions')::integer;

    -- Delete user permissions
    WITH deleted_permissions AS (
      DELETE FROM user_permissions WHERE user_id = user_id_to_delete RETURNING *
    )
    SELECT count(*) INTO deleted_records FROM deleted_permissions;
    deleted_records := deleted_records || jsonb_build_object('user_permissions', COALESCE((deleted_records->>'user_permissions')::integer, 0));
    total_records_deleted := total_records_deleted + COALESCE((deleted_records->>'user_permissions')::integer, 0);

    -- Delete KYC documents
    WITH deleted_kyc AS (
      DELETE FROM kyc_documents WHERE user_id = user_id_to_delete RETURNING *
    )
    SELECT count(*) INTO deleted_records FROM deleted_kyc;
    deleted_records := deleted_records || jsonb_build_object('kyc_documents', COALESCE((deleted_records->>'kyc_documents')::integer, 0));
    total_records_deleted := total_records_deleted + COALESCE((deleted_records->>'kyc_documents')::integer, 0);

    -- Delete notifications
    WITH deleted_notifications AS (
      DELETE FROM notifications WHERE user_id = user_id_to_delete RETURNING *
    )
    SELECT count(*) INTO deleted_records FROM deleted_notifications;
    deleted_records := deleted_records || jsonb_build_object('notifications', COALESCE((deleted_records->>'notifications')::integer, 0));
    total_records_deleted := total_records_deleted + COALESCE((deleted_records->>'notifications')::integer, 0);

    -- Delete wallet transactions
    WITH deleted_transactions AS (
      DELETE FROM wallet_transactions WHERE user_id = user_id_to_delete RETURNING *
    )
    SELECT count(*) INTO deleted_records FROM deleted_transactions;
    deleted_records := deleted_records || jsonb_build_object('wallet_transactions', COALESCE((deleted_records->>'wallet_transactions')::integer, 0));
    total_records_deleted := total_records_deleted + COALESCE((deleted_records->>'wallet_transactions')::integer, 0);

    -- Delete cart items and sessions
    WITH deleted_cart_items AS (
      DELETE FROM cart_items 
      WHERE cart_session_id IN (
        SELECT id FROM cart_sessions WHERE user_id = user_id_to_delete
      ) RETURNING *
    )
    SELECT count(*) INTO deleted_records FROM deleted_cart_items;
    deleted_records := deleted_records || jsonb_build_object('cart_items', COALESCE((deleted_records->>'cart_items')::integer, 0));
    total_records_deleted := total_records_deleted + COALESCE((deleted_records->>'cart_items')::integer, 0);

    WITH deleted_cart_sessions AS (
      DELETE FROM cart_sessions WHERE user_id = user_id_to_delete RETURNING *
    )
    SELECT count(*) INTO deleted_records FROM deleted_cart_sessions;
    deleted_records := deleted_records || jsonb_build_object('cart_sessions', COALESCE((deleted_records->>'cart_sessions')::integer, 0));
    total_records_deleted := total_records_deleted + COALESCE((deleted_records->>'cart_sessions')::integer, 0);

    -- Delete bookings
    WITH deleted_bookings AS (
      DELETE FROM bookings WHERE user_id = user_id_to_delete RETURNING *
    )
    SELECT count(*) INTO deleted_records FROM deleted_bookings;
    deleted_records := deleted_records || jsonb_build_object('bookings', COALESCE((deleted_records->>'bookings')::integer, 0));
    total_records_deleted := total_records_deleted + COALESCE((deleted_records->>'bookings')::integer, 0);

    -- Delete billboards (if user is owner)
    WITH deleted_billboard_images AS (
      DELETE FROM billboard_images 
      WHERE billboard_id IN (
        SELECT id FROM billboards WHERE owner_id = user_id_to_delete
      ) RETURNING *
    )
    SELECT count(*) INTO deleted_records FROM deleted_billboard_images;
    deleted_records := deleted_records || jsonb_build_object('billboard_images', COALESCE((deleted_records->>'billboard_images')::integer, 0));
    total_records_deleted := total_records_deleted + COALESCE((deleted_records->>'billboard_images')::integer, 0);

    WITH deleted_billboard_sides AS (
      DELETE FROM billboard_sides 
      WHERE billboard_id IN (
        SELECT id FROM billboards WHERE owner_id = user_id_to_delete
      ) RETURNING *
    )
    SELECT count(*) INTO deleted_records FROM deleted_billboard_sides;
    deleted_records := deleted_records || jsonb_build_object('billboard_sides', COALESCE((deleted_records->>'billboard_sides')::integer, 0));
    total_records_deleted := total_records_deleted + COALESCE((deleted_records->>'billboard_sides')::integer, 0);

    WITH deleted_billboards AS (
      DELETE FROM billboards WHERE owner_id = user_id_to_delete RETURNING *
    )
    SELECT count(*) INTO deleted_records FROM deleted_billboards;
    deleted_records := deleted_records || jsonb_build_object('billboards', COALESCE((deleted_records->>'billboards')::integer, 0));
    total_records_deleted := total_records_deleted + COALESCE((deleted_records->>'billboards')::integer, 0);

    -- Delete vendor-related data
    WITH deleted_vendor_notifications AS (
      DELETE FROM vendor_notifications WHERE vendor_id = user_id_to_delete RETURNING *
    )
    SELECT count(*) INTO deleted_records FROM deleted_vendor_notifications;
    deleted_records := deleted_records || jsonb_build_object('vendor_notifications', COALESCE((deleted_records->>'vendor_notifications')::integer, 0));
    total_records_deleted := total_records_deleted + COALESCE((deleted_records->>'vendor_notifications')::integer, 0);

    WITH deleted_ad_analytics AS (
      DELETE FROM ad_analytics 
      WHERE ad_request_id IN (
        SELECT id FROM ad_requests WHERE vendor_id = user_id_to_delete
      ) RETURNING *
    )
    SELECT count(*) INTO deleted_records FROM deleted_ad_analytics;
    deleted_records := deleted_records || jsonb_build_object('ad_analytics', COALESCE((deleted_records->>'ad_analytics')::integer, 0));
    total_records_deleted := total_records_deleted + COALESCE((deleted_records->>'ad_analytics')::integer, 0);

    WITH deleted_ad_payments AS (
      DELETE FROM ad_payments WHERE vendor_id = user_id_to_delete RETURNING *
    )
    SELECT count(*) INTO deleted_records FROM deleted_ad_payments;
    deleted_records := deleted_records || jsonb_build_object('ad_payments', COALESCE((deleted_records->>'ad_payments')::integer, 0));
    total_records_deleted := total_records_deleted + COALESCE((deleted_records->>'ad_payments')::integer, 0);

    WITH deleted_ad_requests AS (
      DELETE FROM ad_requests WHERE vendor_id = user_id_to_delete RETURNING *
    )
    SELECT count(*) INTO deleted_records FROM deleted_ad_requests;
    deleted_records := deleted_records || jsonb_build_object('ad_requests', COALESCE((deleted_records->>'ad_requests')::integer, 0));
    total_records_deleted := total_records_deleted + COALESCE((deleted_records->>'ad_requests')::integer, 0);

    WITH deleted_vendor_profiles AS (
      DELETE FROM vendor_profiles WHERE user_id = user_id_to_delete RETURNING *
    )
    SELECT count(*) INTO deleted_records FROM deleted_vendor_profiles;
    deleted_records := deleted_records || jsonb_build_object('vendor_profiles', COALESCE((deleted_records->>'vendor_profiles')::integer, 0));
    total_records_deleted := total_records_deleted + COALESCE((deleted_records->>'vendor_profiles')::integer, 0);

    -- Delete site visits (if sub-admin)
    WITH deleted_site_visits AS (
      DELETE FROM site_visits WHERE sub_admin_id = user_id_to_delete RETURNING *
    )
    SELECT count(*) INTO deleted_records FROM deleted_site_visits;
    deleted_records := deleted_records || jsonb_build_object('site_visits', COALESCE((deleted_records->>'site_visits')::integer, 0));
    total_records_deleted := total_records_deleted + COALESCE((deleted_records->>'site_visits')::integer, 0);

    -- Log the deletion in audit table before deleting the user
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

    -- Finally, delete the user record
    DELETE FROM users WHERE id = user_id_to_delete;
    total_records_deleted := total_records_deleted + 1;

    -- Calculate execution time
    execution_time_ms := EXTRACT(EPOCH FROM (now() - deletion_start_time)) * 1000;

    -- Log successful admin action
    INSERT INTO admin_audit_log (
      admin_id, action_type, target_user_id, target_user_email,
      action_details, ip_address, user_agent, success, execution_time_ms
    ) VALUES (
      requesting_admin_id, 'user_deletion', user_to_delete.id, user_to_delete.email,
      jsonb_build_object(
        'deletion_reason', deletion_reason,
        'deleted_records', deleted_records,
        'total_records_deleted', total_records_deleted
      ),
      inet_client_addr(),
      current_setting('request.headers')::json->>'user-agent',
      true,
      execution_time_ms
    );

    -- Send real-time notification to all other admins
    INSERT INTO admin_notifications (
      notification_type, source_admin_id, data
    )
    SELECT 
      'user_deleted',
      requesting_admin_id,
      jsonb_build_object(
        'deleted_user_id', user_to_delete.id,
        'deleted_user_email', user_to_delete.email,
        'deleted_user_name', user_to_delete.name,
        'deleted_user_role', user_to_delete.role,
        'admin_name', admin_user.name,
        'total_records_deleted', total_records_deleted,
        'timestamp', now()
      )
    FROM users admin_users
    WHERE admin_users.role = 'admin' 
      AND admin_users.is_active = true 
      AND admin_users.id != requesting_admin_id;

    -- Invalidate dashboard cache
    DELETE FROM admin_dashboard_cache 
    WHERE cache_key LIKE 'dashboard_%' OR cache_key LIKE 'users_%';

    RETURN jsonb_build_object(
      'success', true,
      'message', 'User deleted successfully with all associated data',
      'deleted_user', jsonb_build_object(
        'id', user_to_delete.id,
        'email', user_to_delete.email,
        'name', user_to_delete.name,
        'role', user_to_delete.role
      ),
      'deleted_records', deleted_records,
      'total_records_deleted', total_records_deleted,
      'execution_time_ms', execution_time_ms,
      'deletion_timestamp', now()
    );

  EXCEPTION WHEN OTHERS THEN
    error_occurred := true;
    error_message := SQLERRM;
    
    -- Log failed admin action
    INSERT INTO admin_audit_log (
      admin_id, action_type, target_user_id, target_user_email,
      action_details, success, error_message, execution_time_ms
    ) VALUES (
      requesting_admin_id, 'user_deletion_failed', user_to_delete.id, user_to_delete.email,
      jsonb_build_object('deletion_reason', deletion_reason, 'error', error_message),
      false, error_message,
      EXTRACT(EPOCH FROM (now() - deletion_start_time)) * 1000
    );

    RAISE EXCEPTION 'deletion_failed: %', error_message;
  END;
END;
$$;

-- Function to get real-time admin notifications
CREATE OR REPLACE FUNCTION get_admin_notifications(
  admin_id uuid DEFAULT auth.uid(),
  limit_count integer DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  notification_type text,
  source_admin_name text,
  data jsonb,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify admin access
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = admin_id AND users.role = 'admin' AND users.is_active = true
  ) THEN
    RAISE EXCEPTION 'admin_required: Only administrators can access notifications';
  END IF;

  RETURN QUERY
  SELECT 
    n.id,
    n.notification_type,
    u.name as source_admin_name,
    n.data,
    n.created_at
  FROM admin_notifications n
  LEFT JOIN users u ON u.id = n.source_admin_id
  WHERE (n.target_admin_id = admin_id OR n.target_admin_id IS NULL)
    AND n.expires_at > now()
    AND NOT n.is_processed
  ORDER BY n.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Function to mark notifications as processed
CREATE OR REPLACE FUNCTION mark_admin_notifications_processed(
  notification_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE admin_notifications
  SET is_processed = true
  WHERE id = ANY(notification_ids);
END;
$$;

-- Function to get/set dashboard cache
CREATE OR REPLACE FUNCTION get_dashboard_cache(
  cache_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cached_data jsonb;
BEGIN
  SELECT cache_data INTO cached_data
  FROM admin_dashboard_cache
  WHERE admin_dashboard_cache.cache_key = get_dashboard_cache.cache_key
    AND expires_at > now();

  RETURN cached_data;
END;
$$;

CREATE OR REPLACE FUNCTION set_dashboard_cache(
  cache_key text,
  cache_data jsonb,
  ttl_seconds integer DEFAULT 300
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO admin_dashboard_cache (cache_key, cache_data, expires_at)
  VALUES (cache_key, cache_data, now() + (ttl_seconds || ' seconds')::interval)
  ON CONFLICT (cache_key) 
  DO UPDATE SET 
    cache_data = EXCLUDED.cache_data,
    expires_at = EXCLUDED.expires_at,
    updated_at = now();
END;
$$;

-- Cleanup function for old records
CREATE OR REPLACE FUNCTION cleanup_admin_security_tables()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Clean up old login attempts (keep 30 days)
  DELETE FROM admin_login_attempts 
  WHERE attempted_at < now() - interval '30 days';

  -- Clean up processed notifications (keep 7 days)
  DELETE FROM admin_notifications 
  WHERE is_processed = true AND created_at < now() - interval '7 days';

  -- Clean up expired cache entries
  DELETE FROM admin_dashboard_cache 
  WHERE expires_at < now();

  -- Clean up old audit logs (keep 1 year)
  DELETE FROM admin_audit_log 
  WHERE created_at < now() - interval '1 year';
END;
$$;

-- Create a scheduled job to run cleanup (if pg_cron is available)
-- SELECT cron.schedule('cleanup-admin-security', '0 2 * * *', 'SELECT cleanup_admin_security_tables();');