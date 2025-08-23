/*
  # Complete Vendor Advertising System

  1. New Tables
    - `vendor_ad_requests` - Ad submission requests from vendors
    - `vendor_ad_payments` - Payment tracking for approved ads
    - `vendor_ad_placements` - Active ad placements and display logic
    - `vendor_notifications` - Notification system for vendors
    - `ad_display_analytics` - Track ad performance and views

  2. Security
    - Enable RLS on all new tables
    - Add policies for vendors, admins, and public access
    - Secure payment processing workflow

  3. Workflow
    - Request → Admin Review → Payment → Display → Analytics
*/

-- Create vendor ad requests table
CREATE TABLE IF NOT EXISTS vendor_ad_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ad_type varchar(50) NOT NULL CHECK (ad_type IN ('notification', 'video', 'banner', 'popup', 'billboard_offer')),
  title varchar(255) NOT NULL,
  description text,
  content text NOT NULL,
  image_url text,
  video_url text,
  target_audience text,
  campaign_objectives text,
  requested_start_date date NOT NULL,
  requested_end_date date NOT NULL,
  requested_duration_days integer GENERATED ALWAYS AS (requested_end_date - requested_start_date + 1) STORED,
  daily_budget numeric(10,2) NOT NULL CHECK (daily_budget > 0),
  total_budget numeric(12,2) GENERATED ALWAYS AS (daily_budget * (requested_end_date - requested_start_date + 1)) STORED,
  status varchar(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'payment_pending', 'paid', 'active', 'completed', 'cancelled')),
  admin_notes text,
  rejection_reason text,
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamptz,
  priority_level integer DEFAULT 1 CHECK (priority_level BETWEEN 1 AND 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create vendor ad payments table
CREATE TABLE IF NOT EXISTS vendor_ad_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_request_id uuid NOT NULL REFERENCES vendor_ad_requests(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  currency varchar(3) DEFAULT 'INR',
  payment_method varchar(50),
  payment_gateway varchar(50),
  gateway_transaction_id varchar(255),
  gateway_payment_id varchar(255),
  status varchar(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
  failure_reason text,
  invoice_number varchar(100),
  invoice_url text,
  gst_amount numeric(10,2) DEFAULT 0,
  platform_fee numeric(10,2) DEFAULT 0,
  net_amount numeric(12,2) GENERATED ALWAYS AS (amount - gst_amount - platform_fee) STORED,
  payment_date timestamptz,
  refund_date timestamptz,
  refund_amount numeric(12,2) DEFAULT 0,
  refund_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create vendor ad placements table (active ads)
CREATE TABLE IF NOT EXISTS vendor_ad_placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_request_id uuid NOT NULL REFERENCES vendor_ad_requests(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payment_id uuid NOT NULL REFERENCES vendor_ad_payments(id) ON DELETE CASCADE,
  placement_type varchar(50) NOT NULL CHECK (placement_type IN ('header_banner', 'sidebar', 'footer', 'popup', 'notification', 'video_overlay')),
  display_priority integer DEFAULT 1 CHECK (display_priority BETWEEN 1 AND 10),
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_active boolean DEFAULT true,
  total_impressions integer DEFAULT 0,
  total_clicks integer DEFAULT 0,
  click_through_rate numeric(5,4) GENERATED ALWAYS AS (
    CASE 
      WHEN total_impressions > 0 THEN (total_clicks::numeric / total_impressions::numeric) * 100
      ELSE 0
    END
  ) STORED,
  daily_impression_limit integer,
  current_daily_impressions integer DEFAULT 0,
  last_impression_reset timestamptz DEFAULT date_trunc('day', now()),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create vendor notifications table (enhanced)
CREATE TABLE IF NOT EXISTS vendor_notifications_enhanced (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ad_request_id uuid REFERENCES vendor_ad_requests(id) ON DELETE SET NULL,
  payment_id uuid REFERENCES vendor_ad_payments(id) ON DELETE SET NULL,
  notification_type varchar(50) NOT NULL CHECK (notification_type IN ('ad_approved', 'ad_rejected', 'payment_required', 'payment_confirmed', 'ad_live', 'ad_completed', 'performance_alert')),
  title varchar(255) NOT NULL,
  message text NOT NULL,
  action_required boolean DEFAULT false,
  action_url text,
  action_text varchar(100),
  is_read boolean DEFAULT false,
  is_email_sent boolean DEFAULT false,
  email_sent_at timestamptz,
  priority varchar(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  expires_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create ad display analytics table
CREATE TABLE IF NOT EXISTS ad_display_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placement_id uuid NOT NULL REFERENCES vendor_ad_placements(id) ON DELETE CASCADE,
  date date NOT NULL,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  unique_viewers integer DEFAULT 0,
  view_duration_seconds integer DEFAULT 0,
  bounce_rate numeric(5,2) DEFAULT 0,
  conversion_events integer DEFAULT 0,
  device_breakdown jsonb DEFAULT '{}',
  location_breakdown jsonb DEFAULT '{}',
  time_breakdown jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(placement_id, date)
);

-- Enable RLS on all tables
ALTER TABLE vendor_ad_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_ad_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_ad_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_notifications_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_display_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vendor_ad_requests
CREATE POLICY "Vendors can create own ad requests"
  ON vendor_ad_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Vendors can view own ad requests"
  ON vendor_ad_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = vendor_id);

CREATE POLICY "Vendors can update own pending requests"
  ON vendor_ad_requests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = vendor_id AND status = 'pending')
  WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Admins can view all ad requests"
  ON vendor_ad_requests
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

CREATE POLICY "Admins can update ad requests"
  ON vendor_ad_requests
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- RLS Policies for vendor_ad_payments
CREATE POLICY "Vendors can view own payments"
  ON vendor_ad_payments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = vendor_id);

CREATE POLICY "Vendors can create own payments"
  ON vendor_ad_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Admins can view all payments"
  ON vendor_ad_payments
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- RLS Policies for vendor_ad_placements
CREATE POLICY "Public can view active placements"
  ON vendor_ad_placements
  FOR SELECT
  TO public
  USING (is_active = true AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE);

CREATE POLICY "Vendors can view own placements"
  ON vendor_ad_placements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = vendor_id);

CREATE POLICY "Admins can manage all placements"
  ON vendor_ad_placements
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- RLS Policies for vendor_notifications_enhanced
CREATE POLICY "Vendors can view own notifications"
  ON vendor_notifications_enhanced
  FOR SELECT
  TO authenticated
  USING (auth.uid() = vendor_id);

CREATE POLICY "Vendors can update own notifications"
  ON vendor_notifications_enhanced
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = vendor_id)
  WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "System can create notifications"
  ON vendor_notifications_enhanced
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for ad_display_analytics
CREATE POLICY "Vendors can view own analytics"
  ON ad_display_analytics
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM vendor_ad_placements 
    WHERE vendor_ad_placements.id = ad_display_analytics.placement_id 
    AND vendor_ad_placements.vendor_id = auth.uid()
  ));

CREATE POLICY "Admins can view all analytics"
  ON ad_display_analytics
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendor_ad_requests_vendor_id ON vendor_ad_requests(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_ad_requests_status ON vendor_ad_requests(status);
CREATE INDEX IF NOT EXISTS idx_vendor_ad_requests_dates ON vendor_ad_requests(requested_start_date, requested_end_date);

CREATE INDEX IF NOT EXISTS idx_vendor_ad_payments_vendor_id ON vendor_ad_payments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_ad_payments_status ON vendor_ad_payments(status);
CREATE INDEX IF NOT EXISTS idx_vendor_ad_payments_ad_request_id ON vendor_ad_payments(ad_request_id);

CREATE INDEX IF NOT EXISTS idx_vendor_ad_placements_active ON vendor_ad_placements(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_vendor_ad_placements_type ON vendor_ad_placements(placement_type);
CREATE INDEX IF NOT EXISTS idx_vendor_ad_placements_vendor_id ON vendor_ad_placements(vendor_id);

CREATE INDEX IF NOT EXISTS idx_vendor_notifications_vendor_id ON vendor_notifications_enhanced(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_notifications_read ON vendor_notifications_enhanced(is_read);
CREATE INDEX IF NOT EXISTS idx_vendor_notifications_type ON vendor_notifications_enhanced(notification_type);

CREATE INDEX IF NOT EXISTS idx_ad_analytics_placement_date ON ad_display_analytics(placement_id, date);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vendor_ad_requests_updated_at
  BEFORE UPDATE ON vendor_ad_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_ad_payments_updated_at
  BEFORE UPDATE ON vendor_ad_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_ad_placements_updated_at
  BEFORE UPDATE ON vendor_ad_placements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create ad placement after payment
CREATE OR REPLACE FUNCTION create_ad_placement_after_payment()
RETURNS TRIGGER AS $$
DECLARE
  ad_request_record vendor_ad_requests%ROWTYPE;
  placement_type_mapping varchar(50);
BEGIN
  -- Only proceed if payment is completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Get the ad request details
    SELECT * INTO ad_request_record
    FROM vendor_ad_requests
    WHERE id = NEW.ad_request_id;
    
    -- Map ad type to placement type
    placement_type_mapping := CASE ad_request_record.ad_type
      WHEN 'notification' THEN 'notification'
      WHEN 'video' THEN 'video_overlay'
      WHEN 'banner' THEN 'header_banner'
      WHEN 'popup' THEN 'popup'
      WHEN 'billboard_offer' THEN 'sidebar'
      ELSE 'sidebar'
    END;
    
    -- Create ad placement
    INSERT INTO vendor_ad_placements (
      ad_request_id,
      vendor_id,
      payment_id,
      placement_type,
      start_date,
      end_date,
      display_priority,
      daily_impression_limit
    ) VALUES (
      NEW.ad_request_id,
      NEW.vendor_id,
      NEW.id,
      placement_type_mapping,
      ad_request_record.requested_start_date,
      ad_request_record.requested_end_date,
      ad_request_record.priority_level,
      CASE ad_request_record.ad_type
        WHEN 'notification' THEN 1000
        WHEN 'video' THEN 500
        WHEN 'popup' THEN 100
        ELSE 2000
      END
    );
    
    -- Update ad request status to active
    UPDATE vendor_ad_requests
    SET status = 'active'
    WHERE id = NEW.ad_request_id;
    
    -- Create notification for vendor
    INSERT INTO vendor_notifications_enhanced (
      vendor_id,
      ad_request_id,
      payment_id,
      notification_type,
      title,
      message,
      action_required,
      action_url,
      action_text,
      priority
    ) VALUES (
      NEW.vendor_id,
      NEW.ad_request_id,
      NEW.id,
      'ad_live',
      'Your Advertisement is Now Live!',
      'Congratulations! Your ad "' || ad_request_record.title || '" is now live on our platform and being displayed to users.',
      false,
      '/vendor/campaigns/' || NEW.ad_request_id || '/analytics',
      'View Analytics',
      'high'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic ad placement
CREATE TRIGGER create_placement_after_payment
  AFTER UPDATE ON vendor_ad_payments
  FOR EACH ROW
  EXECUTE FUNCTION create_ad_placement_after_payment();

-- Function to handle admin approval workflow
CREATE OR REPLACE FUNCTION approve_vendor_ad_request(
  request_id uuid,
  admin_id uuid,
  admin_notes_param text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  request_record vendor_ad_requests%ROWTYPE;
  result jsonb;
BEGIN
  -- Verify admin permissions
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = admin_id AND role = 'admin'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only administrators can approve ad requests'
    );
  END IF;
  
  -- Get and update the request
  UPDATE vendor_ad_requests
  SET 
    status = 'approved',
    reviewed_by = admin_id,
    reviewed_at = now(),
    admin_notes = admin_notes_param,
    updated_at = now()
  WHERE id = request_id AND status = 'pending'
  RETURNING * INTO request_record;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Ad request not found or not in pending status'
    );
  END IF;
  
  -- Create approval notification for vendor
  INSERT INTO vendor_notifications_enhanced (
    vendor_id,
    ad_request_id,
    notification_type,
    title,
    message,
    action_required,
    action_url,
    action_text,
    priority,
    metadata
  ) VALUES (
    request_record.vendor_id,
    request_id,
    'ad_approved',
    'Advertisement Request Approved!',
    'Great news! Your ad request "' || request_record.title || '" has been approved. You can now proceed with payment to make your ad live.',
    true,
    '/vendor/campaigns/' || request_id || '/payment',
    'Make Payment',
    'high',
    jsonb_build_object(
      'approved_by', admin_id,
      'total_budget', request_record.total_budget,
      'campaign_duration', request_record.requested_duration_days
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Ad request approved successfully',
    'request_id', request_id,
    'total_budget', request_record.total_budget
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle admin rejection workflow
CREATE OR REPLACE FUNCTION reject_vendor_ad_request(
  request_id uuid,
  admin_id uuid,
  rejection_reason_param text,
  admin_notes_param text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  request_record vendor_ad_requests%ROWTYPE;
BEGIN
  -- Verify admin permissions
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = admin_id AND role = 'admin'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only administrators can reject ad requests'
    );
  END IF;
  
  -- Validate rejection reason
  IF rejection_reason_param IS NULL OR trim(rejection_reason_param) = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Rejection reason is required'
    );
  END IF;
  
  -- Update the request
  UPDATE vendor_ad_requests
  SET 
    status = 'rejected',
    reviewed_by = admin_id,
    reviewed_at = now(),
    rejection_reason = rejection_reason_param,
    admin_notes = admin_notes_param,
    updated_at = now()
  WHERE id = request_id AND status = 'pending'
  RETURNING * INTO request_record;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Ad request not found or not in pending status'
    );
  END IF;
  
  -- Create rejection notification for vendor
  INSERT INTO vendor_notifications_enhanced (
    vendor_id,
    ad_request_id,
    notification_type,
    title,
    message,
    action_required,
    action_url,
    action_text,
    priority,
    metadata
  ) VALUES (
    request_record.vendor_id,
    request_id,
    'ad_rejected',
    'Advertisement Request Requires Changes',
    'Your ad request "' || request_record.title || '" needs some adjustments. Reason: ' || rejection_reason_param,
    true,
    '/vendor/campaigns/' || request_id || '/edit',
    'Edit Request',
    'high',
    jsonb_build_object(
      'rejected_by', admin_id,
      'rejection_reason', rejection_reason_param,
      'can_resubmit', true
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Ad request rejected successfully',
    'request_id', request_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active ad placements for display
CREATE OR REPLACE FUNCTION get_active_ad_placements(
  placement_type_param varchar(50) DEFAULT NULL,
  limit_count integer DEFAULT 10
)
RETURNS TABLE (
  placement_id uuid,
  ad_request_id uuid,
  vendor_name text,
  ad_type varchar(50),
  title varchar(255),
  content text,
  image_url text,
  video_url text,
  placement_type varchar(50),
  display_priority integer,
  total_impressions integer,
  total_clicks integer,
  click_through_rate numeric(5,4),
  can_display boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as placement_id,
    p.ad_request_id,
    u.name as vendor_name,
    r.ad_type,
    r.title,
    r.content,
    r.image_url,
    r.video_url,
    p.placement_type,
    p.display_priority,
    p.total_impressions,
    p.total_clicks,
    p.click_through_rate,
    (p.is_active AND 
     p.start_date <= CURRENT_DATE AND 
     p.end_date >= CURRENT_DATE AND
     (p.daily_impression_limit IS NULL OR p.current_daily_impressions < p.daily_impression_limit)
    ) as can_display
  FROM vendor_ad_placements p
  JOIN vendor_ad_requests r ON p.ad_request_id = r.id
  JOIN users u ON p.vendor_id = u.id
  WHERE 
    (placement_type_param IS NULL OR p.placement_type = placement_type_param)
    AND p.is_active = true
    AND p.start_date <= CURRENT_DATE
    AND p.end_date >= CURRENT_DATE
  ORDER BY p.display_priority DESC, p.created_at ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track ad impressions and clicks
CREATE OR REPLACE FUNCTION track_ad_interaction(
  placement_id_param uuid,
  interaction_type varchar(20), -- 'impression' or 'click'
  user_metadata jsonb DEFAULT '{}'
)
RETURNS jsonb AS $$
DECLARE
  placement_record vendor_ad_placements%ROWTYPE;
  today_date date := CURRENT_DATE;
BEGIN
  -- Get placement record
  SELECT * INTO placement_record
  FROM vendor_ad_placements
  WHERE id = placement_id_param;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Placement not found'
    );
  END IF;
  
  -- Reset daily counter if needed
  IF placement_record.last_impression_reset::date < today_date THEN
    UPDATE vendor_ad_placements
    SET 
      current_daily_impressions = 0,
      last_impression_reset = date_trunc('day', now())
    WHERE id = placement_id_param;
  END IF;
  
  -- Update placement counters
  IF interaction_type = 'impression' THEN
    UPDATE vendor_ad_placements
    SET 
      total_impressions = total_impressions + 1,
      current_daily_impressions = current_daily_impressions + 1
    WHERE id = placement_id_param;
  ELSIF interaction_type = 'click' THEN
    UPDATE vendor_ad_placements
    SET total_clicks = total_clicks + 1
    WHERE id = placement_id_param;
  END IF;
  
  -- Update daily analytics
  INSERT INTO ad_display_analytics (
    placement_id,
    date,
    impressions,
    clicks
  ) VALUES (
    placement_id_param,
    today_date,
    CASE WHEN interaction_type = 'impression' THEN 1 ELSE 0 END,
    CASE WHEN interaction_type = 'click' THEN 1 ELSE 0 END
  )
  ON CONFLICT (placement_id, date)
  DO UPDATE SET
    impressions = ad_display_analytics.impressions + CASE WHEN interaction_type = 'impression' THEN 1 ELSE 0 END,
    clicks = ad_display_analytics.clicks + CASE WHEN interaction_type = 'click' THEN 1 ELSE 0 END;
  
  RETURN jsonb_build_object(
    'success', true,
    'interaction_type', interaction_type,
    'placement_id', placement_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process vendor payment
CREATE OR REPLACE FUNCTION process_vendor_payment(
  ad_request_id_param uuid,
  vendor_id_param uuid,
  payment_amount numeric(12,2),
  payment_method_param varchar(50),
  gateway_transaction_id_param varchar(255)
)
RETURNS jsonb AS $$
DECLARE
  request_record vendor_ad_requests%ROWTYPE;
  payment_id uuid;
  gst_amount numeric(10,2);
  platform_fee numeric(10,2);
BEGIN
  -- Verify vendor owns the request
  SELECT * INTO request_record
  FROM vendor_ad_requests
  WHERE id = ad_request_id_param AND vendor_id = vendor_id_param AND status = 'approved';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Ad request not found or not approved'
    );
  END IF;
  
  -- Calculate fees
  gst_amount := payment_amount * 0.18; -- 18% GST
  platform_fee := payment_amount * 0.10; -- 10% platform fee
  
  -- Create payment record
  INSERT INTO vendor_ad_payments (
    ad_request_id,
    vendor_id,
    amount,
    payment_method,
    gateway_transaction_id,
    status,
    gst_amount,
    platform_fee,
    payment_date
  ) VALUES (
    ad_request_id_param,
    vendor_id_param,
    payment_amount,
    payment_method_param,
    gateway_transaction_id_param,
    'completed',
    gst_amount,
    platform_fee,
    now()
  ) RETURNING id INTO payment_id;
  
  -- Update request status
  UPDATE vendor_ad_requests
  SET status = 'paid'
  WHERE id = ad_request_id_param;
  
  RETURN jsonb_build_object(
    'success', true,
    'payment_id', payment_id,
    'message', 'Payment processed successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default ad types if they don't exist
INSERT INTO ad_types (type_name, description, base_price, features, max_file_size_mb, allowed_formats, is_active)
VALUES 
  ('notification', 'Small notification-style advertisements', 500.00, ARRAY['Quick display', 'High visibility', 'Mobile optimized'], 5, ARRAY['jpg', 'png', 'gif'], true),
  ('video', 'Video advertisements with audio/visual content', 1500.00, ARRAY['Full motion video', 'Audio support', 'High engagement'], 50, ARRAY['mp4', 'webm', 'mov'], true),
  ('banner', 'Traditional banner advertisements', 800.00, ARRAY['Static display', 'Wide reach', 'Cost effective'], 10, ARRAY['jpg', 'png', 'gif'], true),
  ('popup', 'Interactive popup advertisements', 1200.00, ARRAY['Interactive elements', 'Call-to-action buttons', 'High conversion'], 10, ARRAY['jpg', 'png', 'gif', 'html'], true),
  ('billboard_offer', 'Special offers for billboard bookings', 300.00, ARRAY['Promotional content', 'Limited time offers', 'Discount highlights'], 5, ARRAY['jpg', 'png'], true)
ON CONFLICT (type_name) DO NOTHING;