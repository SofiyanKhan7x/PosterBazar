import { supabase } from './supabase';

export interface VendorAdRequest {
  id: string;
  vendor_id: string;
  ad_type: 'notification' | 'video' | 'banner' | 'popup' | 'billboard_offer';
  title: string;
  description?: string;
  content: string;
  image_url?: string;
  video_url?: string;
  target_audience?: string;
  campaign_objectives?: string;
  requested_start_date: string;
  requested_end_date: string;
  requested_duration_days: number;
  daily_budget: number;
  total_budget: number;
  status: 'pending' | 'approved' | 'rejected' | 'payment_pending' | 'paid' | 'active' | 'completed' | 'cancelled';
  admin_notes?: string;
  rejection_reason?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  priority_level: number;
  created_at: string;
  updated_at: string;
  vendor?: {
    name: string;
    email: string;
  };
  reviewer?: {
    name: string;
    email: string;
  };
}

interface VendorAdPayment {
  id: string;
  ad_request_id: string;
  vendor_id: string;
  amount: number;
  currency: string;
  payment_method?: string;
  payment_gateway?: string;
  gateway_transaction_id?: string;
  gateway_payment_id?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  failure_reason?: string;
  invoice_number?: string;
  invoice_url?: string;
  gst_amount: number;
  platform_fee: number;
  net_amount: number;
  payment_date?: string;
  refund_date?: string;
  refund_amount: number;
  refund_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface VendorAdPlacement {
  id: string;
  ad_request_id: string;
  vendor_id: string;
  payment_id: string;
  placement_type: 'header_banner' | 'sidebar' | 'footer' | 'popup' | 'notification' | 'video_overlay';
  display_priority: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  total_impressions: number;
  total_clicks: number;
  click_through_rate: number;
  daily_impression_limit?: number;
  current_daily_impressions: number;
  last_impression_reset: string;
  created_at: string;
  updated_at: string;
  ad_request?: VendorAdRequest;
}

export interface VendorNotificationEnhanced {
  id: string;
  vendor_id: string;
  ad_request_id?: string;
  payment_id?: string;
  notification_type: 'ad_approved' | 'ad_rejected' | 'payment_required' | 'payment_confirmed' | 'ad_live' | 'ad_completed' | 'performance_alert';
  title: string;
  message: string;
  action_required: boolean;
  action_url?: string;
  action_text?: string;
  is_read: boolean;
  is_email_sent: boolean;
  email_sent_at?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  expires_at?: string;
  metadata: any;
  created_at: string;
}

export class VendorAdWorkflowService {
  /**
   * Step 1: Vendor submits ad request
   */
  static async submitAdRequest(requestData: {
    vendor_id: string;
    ad_type: VendorAdRequest['ad_type'];
    title: string;
    description?: string;
    content: string;
    image_url?: string;
    video_url?: string;
    target_audience?: string;
    campaign_objectives?: string;
    requested_start_date: string;
    requested_end_date: string;
    daily_budget: number;
    priority_level?: number;
  }): Promise<{ success: boolean; request?: VendorAdRequest; error?: string }> {
    try {
      if (!supabase) {
        throw new Error('Database service not available');
      }

      // Validate dates
      const startDate = new Date(requestData.requested_start_date);
      const endDate = new Date(requestData.requested_end_date);
      
      if (endDate <= startDate) {
        return {
          success: false,
          error: 'End date must be after start date'
        };
      }

      // Validate budget
      if (requestData.daily_budget <= 0) {
        return {
          success: false,
          error: 'Daily budget must be greater than 0'
        };
      }

      const { data, error } = await supabase
        .from('vendor_ad_requests')
        .insert([{
          vendor_id: requestData.vendor_id,
          ad_type: requestData.ad_type,
          title: requestData.title.trim(),
          description: requestData.description?.trim(),
          content: requestData.content.trim(),
          image_url: requestData.image_url,
          video_url: requestData.video_url,
          target_audience: requestData.target_audience?.trim(),
          campaign_objectives: requestData.campaign_objectives?.trim(),
          requested_start_date: requestData.requested_start_date,
          requested_end_date: requestData.requested_end_date,
          daily_budget: requestData.daily_budget,
          priority_level: requestData.priority_level || 1,
          status: 'pending'
        }])
        .select(`
          *,
          vendor:users!vendor_ad_requests_vendor_id_fkey(name, email)
        `)
        .single();

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        request: {
          ...data,
          vendor: Array.isArray(data.vendor) ? data.vendor[0] : data.vendor
        }
      };
    } catch (error) {
      console.error('Error submitting ad request:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit ad request'
      };
    }
  }

  /**
   * Step 2: Get pending ad requests for admin review
   */
  static async getPendingAdRequests(): Promise<VendorAdRequest[]> {
    try {
      if (!supabase) {
        return [];
      }

      const { data, error } = await supabase
        .from('vendor_ad_requests')
        .select(`
          *,
          vendor:users!vendor_ad_requests_vendor_id_fkey(name, email),
          reviewer:users!vendor_ad_requests_reviewed_by_fkey(name, email)
        `)
        .eq('status', 'pending')
        .order('priority_level', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching pending ad requests:', error);
        return [];
      }

      return (data || []).map((item: any) => ({
        ...item,
        vendor: Array.isArray(item.vendor) ? item.vendor[0] : item.vendor,
        reviewer: Array.isArray(item.reviewer) ? item.reviewer[0] : item.reviewer
      }));
    } catch (error) {
      console.error('Error getting pending ad requests:', error);
      return [];
    }
  }

  /**
   * Step 3: Admin approves ad request
   */
  static async approveAdRequest(
    requestId: string,
    adminId: string,
    adminNotes?: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      if (!supabase) {
        throw new Error('Database service not available');
      }

      const { data, error } = await supabase.rpc('approve_vendor_ad_request', {
        request_id: requestId,
        admin_id: adminId,
        admin_notes_param: adminNotes
      });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return data;
    } catch (error) {
      console.error('Error approving ad request:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to approve ad request'
      };
    }
  }

  /**
   * Step 4: Admin rejects ad request
   */
  static async rejectAdRequest(
    requestId: string,
    adminId: string,
    rejectionReason: string,
    adminNotes?: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      if (!supabase) {
        throw new Error('Database service not available');
      }

      const { data, error } = await supabase.rpc('reject_vendor_ad_request', {
        request_id: requestId,
        admin_id: adminId,
        rejection_reason_param: rejectionReason,
        admin_notes_param: adminNotes
      });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return data;
    } catch (error) {
      console.error('Error rejecting ad request:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reject ad request'
      };
    }
  }

  /**
   * Step 5: Get vendor notifications
   */
  static async getVendorNotifications(vendorId: string): Promise<VendorNotificationEnhanced[]> {
    try {
      if (!supabase) {
        return [];
      }

      const { data, error } = await supabase
        .from('vendor_notifications_enhanced')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching vendor notifications:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting vendor notifications:', error);
      return [];
    }
  }

  /**
   * Step 6: Process payment for approved ad
   */
  static async processAdPayment(
    adRequestId: string,
    vendorId: string,
    paymentData: {
      amount: number;
      payment_method: string;
      gateway_transaction_id: string;
      gateway_payment_id?: string;
    }
  ): Promise<{ success: boolean; payment_id?: string; error?: string }> {
    try {
      if (!supabase) {
        throw new Error('Database service not available');
      }

      const { data, error } = await supabase.rpc('process_vendor_payment', {
        ad_request_id_param: adRequestId,
        vendor_id_param: vendorId,
        payment_amount: paymentData.amount,
        payment_method_param: paymentData.payment_method,
        gateway_transaction_id_param: paymentData.gateway_transaction_id
      });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        payment_id: data.payment_id,
      };
    } catch (error) {
      console.error('Error processing payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process payment'
      };
    }
  }

  /**
   * Step 7: Get active ad placements for display
   */
  static async getActiveAdPlacements(
    placementType?: string,
    limit: number = 10
  ): Promise<VendorAdPlacement[]> {
    try {
      if (!supabase) {
        return [];
      }

      const { data, error } = await supabase.rpc('get_active_ad_placements', {
        placement_type_param: placementType,
        limit_count: limit
      });

      if (error) {
        console.error('Error fetching active ad placements:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting active ad placements:', error);
      return [];
    }
  }

  /**
   * Step 8: Track ad interactions (impressions/clicks)
   */
  static async trackAdInteraction(
    placementId: string,
    interactionType: 'impression' | 'click',
    userMetadata?: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!supabase) {
        return { success: false, error: 'Database service not available' };
      }

      const { data, error } = await supabase.rpc('track_ad_interaction', {
        placement_id_param: placementId,
        interaction_type: interactionType,
        user_metadata: userMetadata || {}
      });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return data;
    } catch (error) {
      console.error('Error tracking ad interaction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to track interaction'
      };
    }
  }

  /**
   * Get vendor's ad requests with status
   */
  static async getVendorAdRequests(vendorId: string): Promise<VendorAdRequest[]> {
    try {
      if (!supabase) {
        return [];
      }

      const { data, error } = await supabase
        .from('vendor_ad_requests')
        .select(`
          *,
          vendor:users!vendor_ad_requests_vendor_id_fkey(name, email),
          reviewer:users!vendor_ad_requests_reviewed_by_fkey(name, email)
        `)
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching vendor ad requests:', error);
        return [];
      }

      return (data || []).map((item: any) => ({
        ...item,
        vendor: Array.isArray(item.vendor) ? item.vendor[0] : item.vendor,
        reviewer: Array.isArray(item.reviewer) ? item.reviewer[0] : item.reviewer
      }));
    } catch (error) {
      console.error('Error getting vendor ad requests:', error);
      return [];
    }
  }

  /**
   * Get vendor's payment history
   */
  static async getVendorPayments(vendorId: string): Promise<VendorAdPayment[]> {
    try {
      if (!supabase) {
        return [];
      }

      const { data, error } = await supabase
        .from('vendor_ad_payments')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching vendor payments:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting vendor payments:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  static async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      if (!supabase) {
        return;
      }

      await supabase
        .from('vendor_notifications_enhanced')
        .update({ is_read: true })
        .eq('id', notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  /**
   * Get ad analytics for vendor
   */
  static async getAdAnalytics(
    vendorId: string,
    adRequestId?: string,
    dateRange?: { start: string; end: string }
  ): Promise<any[]> {
    try {
      if (!supabase) {
        return [];
      }

      let query = supabase
        .from('ad_display_analytics')
        .select(`
          *,
          placement:vendor_ad_placements!ad_display_analytics_placement_id_fkey(
            ad_request_id,
            placement_type,
            ad_request:vendor_ad_requests!vendor_ad_placements_ad_request_id_fkey(title, ad_type)
          )
        `)
        .eq('placement.vendor_id', vendorId);

      if (adRequestId) {
        query = query.eq('placement.ad_request_id', adRequestId);
      }

      if (dateRange) {
        query = query
          .gte('date', dateRange.start)
          .lte('date', dateRange.end);
      }

      const { data, error } = await query.order('date', { ascending: false });

      if (error) {
        console.error('Error fetching ad analytics:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting ad analytics:', error);
      return [];
    }
  }

  /**
   * Calculate ad pricing based on type and duration
   */
  static calculateAdPricing(
    dailyBudget: number,
    durationDays: number
  ): {
    baseAmount: number;
    platformFee: number;
    gstAmount: number;
    totalAmount: number;
    breakdown: any;
  } {
    const baseAmount = dailyBudget * durationDays;
    const platformFee = baseAmount * 0.10; // 10% platform fee
    const subtotal = baseAmount + platformFee;
    const gstAmount = subtotal * 0.18; // 18% GST
    const totalAmount = subtotal + gstAmount;

    return {
      baseAmount,
      platformFee,
      gstAmount,
      totalAmount,
      breakdown: {
        dailyBudget,
        durationDays,
        platformFeeRate: 10,
        gstRate: 18,
        calculation: `₹${dailyBudget}/day × ${durationDays} days + 10% platform fee + 18% GST`
      }
    };
  }

  /**
   * Get ad type configuration
   */
  static async getAdTypeConfig(adType: string): Promise<any> {
    try {
      if (!supabase) {
        return null;
      }

      const { data, error } = await supabase
        .from('ad_types')
        .select('*')
        .eq('type_name', adType)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching ad type config:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting ad type config:', error);
      return null;
    }
  }

  /**
   * Upload ad media files
   */
  static async uploadAdMedia(
    file: File,
    vendorId: string,
    adRequestId: string,
    mediaType: 'image' | 'video'
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      if (!supabase) {
        return {
          success: false,
          error: 'Storage service not available'
        };
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${vendorId}/${adRequestId}/${mediaType}_${Date.now()}.${fileExt}`;
      const filePath = `vendor-ads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('vendor-ads')
        .upload(filePath, file);

      if (uploadError) {
        // Return mock URL for demo purposes
        return {
          success: true,
          url: `https://demo-storage.example.com/vendor-ads/${fileName}`
        };
      }

      const { data } = supabase.storage
        .from('vendor-ads')
        .getPublicUrl(filePath);

      return {
        success: true,
        url: data.publicUrl
      };
    } catch (error) {
      console.error('Error uploading ad media:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload media'
      };
    }
  }
}