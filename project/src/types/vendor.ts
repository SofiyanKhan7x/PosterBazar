export interface VendorProfile {
  id: string;
  user_id: string;
  company_name: string;
  business_type?: string;
  company_website?: string;
  company_logo?: string;
  business_registration_number?: string;
  gst_number?: string;
  billing_address?: string;
  contact_person?: string;
  contact_designation?: string;
  secondary_email?: string;
  secondary_phone?: string;
  business_description?: string;
  target_markets?: string[];
  annual_ad_budget?: number;
  preferred_ad_types?: string[];
  is_verified: boolean;
  verification_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AdType {
  id: string;
  type_name: string;
  description?: string;
  base_price: number;
  size_category: string;
  max_file_size_mb: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdRequest {
  id: string;
  vendor_id: string;
  ad_type_id: string;
  title: string;
  description?: string;
  content?: string;
  image_url?: string;
  video_url?: string;
  target_audience?: string;
  campaign_objectives?: string;
  start_date: string;
  end_date: string;
  total_days: number;
  daily_budget: number;
  total_budget: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'active' | 'paused' | 'completed' | 'cancelled';
  admin_notes?: string;
  rejection_reason?: string;
  approved_by?: string;
  approved_at?: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_id?: string;
  campaign_start_date?: string;
  campaign_end_date?: string;
  is_featured: boolean;
  priority_level: number;
  created_at: string;
  updated_at: string;
  ad_type?: AdType;
  vendor?: {
    name: string;
    email: string;
    vendor_profile?: VendorProfile;
  };
  approver?: {
    name: string;
    email: string;
  };
}

export interface AdAnalytics {
  id: string;
  ad_request_id: string;
  date: string;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  conversion_rate: number;
  spend: number;
  cpm: number;
  unique_visitors: number;
  bounce_rate: number;
  avg_time_spent?: string;
  device_breakdown?: any;
  location_breakdown?: any;
  created_at: string;
}

export interface AdPayment {
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
  refund_amount: number;
  refund_reason?: string;
  invoice_number?: string;
  invoice_url?: string;
  gst_amount: number;
  platform_fee: number;
  net_amount: number;
  payment_date?: string;
  refund_date?: string;
  created_at: string;
  updated_at: string;
}

export interface VendorNotification {
  id: string;
  vendor_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'payment' | 'campaign';
  related_ad_id?: string;
  related_payment_id?: string;
  is_read: boolean;
  is_email_sent: boolean;
  email_sent_at?: string;
  action_url?: string;
  expires_at?: string;
  created_at: string;
}

export interface VendorDashboardStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalSpent: number;
  totalImpressions: number;
  totalClicks: number;
  averageCTR: number;
  pendingApprovals: number;
  completedCampaigns: number;
  recentCampaigns: AdRequest[];
  monthlySpend: number;
  monthlyImpressions: number;
}