import { supabase } from './supabase';
import { 
  VendorProfile, 
  AdType, 
  AdRequest, 
  AdAnalytics, 
  AdPayment, 
  VendorNotification,
  VendorDashboardStats 
} from '../types/vendor';

// Vendor Profile Management
export const createVendorProfile = async (profileData: Partial<VendorProfile>): Promise<VendorProfile> => {
  const { data, error } = await supabase
    .from('vendor_profiles')
    .insert([profileData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

const getVendorProfile = async (userId: string): Promise<VendorProfile | null> => {
  const { data, error } = await supabase
    .from('vendor_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
};

const updateVendorProfile = async (userId: string, updates: Partial<VendorProfile>): Promise<VendorProfile> => {
  const { data, error } = await supabase
    .from('vendor_profiles')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Ad Types Management
export const getAdTypes = async (): Promise<AdType[]> => {
  const { data, error } = await supabase
    .from('ad_types')
    .select('*')
    .eq('is_active', true)
    .order('base_price', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const getAllAdTypes = async (): Promise<AdType[]> => {
  const { data, error } = await supabase
    .from('ad_types')
    .select('*')
    .order('type_name', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const updateAdType = async (id: string, updates: Partial<AdType>): Promise<AdType> => {
  const { data, error } = await supabase
    .from('ad_types')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Ad Request Management
export const createAdRequest = async (requestData: Partial<AdRequest>): Promise<AdRequest> => {
  const { data, error } = await supabase
    .from('ad_requests')
    .insert([requestData])
    .select(`
      id,
      vendor_id,
      ad_type_id,
      title,
      description,
      content,
      image_url,
      video_url,
      target_audience,
      campaign_objectives,
      start_date,
      end_date,
      total_days,
      daily_budget,
      total_budget,
      status,
      admin_notes,
      rejection_reason,
      approved_by,
      approved_at,
      payment_status,
      payment_id,
      campaign_start_date,
      campaign_end_date,
      is_featured,
      priority_level,
      created_at,
      updated_at,
      ad_type:ad_types(*),
      vendor:users!ad_requests_vendor_id_fkey(name, email),
      approver:users!ad_requests_approved_by_fkey(name, email)
    `)
    .single();

  if (error) throw error;
  
  return {
    ...data,
    ad_type: Array.isArray(data.ad_type) ? data.ad_type[0] : data.ad_type,
    vendor: Array.isArray(data.vendor) ? data.vendor[0] : data.vendor,
    approver: Array.isArray(data.approver) ? data.approver[0] : data.approver
  };
};

export const getVendorAdRequests = async (vendorId: string): Promise<AdRequest[]> => {
  const { data, error } = await supabase
    .from('ad_requests')
    .select(`
      id,
      vendor_id,
      ad_type_id,
      title,
      description,
      content,
      image_url,
      video_url,
      target_audience,
      campaign_objectives,
      start_date,
      end_date,
      total_days,
      daily_budget,
      total_budget,
      status,
      admin_notes,
      rejection_reason,
      approved_by,
      approved_at,
      payment_status,
      payment_id,
      campaign_start_date,
      campaign_end_date,
      is_featured,
      priority_level,
      created_at,
      updated_at,
      ad_type:ad_types(*),
      vendor:users!ad_requests_vendor_id_fkey(name, email),
      approver:users!ad_requests_approved_by_fkey(name, email)
    `)
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((item: any) => ({
    ...item,
    ad_type: Array.isArray(item.ad_type) ? item.ad_type[0] : item.ad_type,
    vendor: Array.isArray(item.vendor) ? item.vendor[0] : item.vendor,
    approver: Array.isArray(item.approver) ? item.approver[0] : item.approver
  }));
};

export const getAllAdRequests = async (): Promise<AdRequest[]> => {
  const { data, error } = await supabase
    .from('ad_requests')
    .select(`
      id,
      vendor_id,
      ad_type_id,
      title,
      description,
      content,
      image_url,
      video_url,
      target_audience,
      campaign_objectives,
      start_date,
      end_date,
      total_days,
      daily_budget,
      total_budget,
      status,
      admin_notes,
      rejection_reason,
      approved_by,
      approved_at,
      payment_status,
      payment_id,
      campaign_start_date,
      campaign_end_date,
      is_featured,
      priority_level,
      created_at,
      updated_at,
      ad_type:ad_types(*),
      vendor:users!ad_requests_vendor_id_fkey(name, email),
      approver:users!ad_requests_approved_by_fkey(name, email)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((item: any) => ({
    ...item,
    ad_type: Array.isArray(item.ad_type) ? item.ad_type[0] : item.ad_type,
    vendor: Array.isArray(item.vendor) ? item.vendor[0] : item.vendor,
    approver: Array.isArray(item.approver) ? item.approver[0] : item.approver
  }));
};

const getPendingAdRequests = async (): Promise<AdRequest[]> => {
  const { data, error } = await supabase
    .from('ad_requests')
    .select(`
      id,
      vendor_id,
      ad_type_id,
      title,
      description,
      content,
      image_url,
      video_url,
      target_audience,
      campaign_objectives,
      start_date,
      end_date,
      total_days,
      daily_budget,
      total_budget,
      status,
      admin_notes,
      rejection_reason,
      approved_by,
      approved_at,
      payment_status,
      payment_id,
      campaign_start_date,
      campaign_end_date,
      is_featured,
      priority_level,
      created_at,
      updated_at,
      ad_type:ad_types(*),
      vendor:users!ad_requests_vendor_id_fkey(name, email),
      approver:users!ad_requests_approved_by_fkey(name, email)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []).map((item: any) => ({
    ...item,
    ad_type: Array.isArray(item.ad_type) ? item.ad_type[0] : item.ad_type,
    vendor: Array.isArray(item.vendor) ? item.vendor[0] : item.vendor,
    approver: Array.isArray(item.approver) ? item.approver[0] : item.approver
  }));
};

export const updateAdRequest = async (id: string, updates: Partial<AdRequest>): Promise<AdRequest> => {
  const { data, error } = await supabase
    .from('ad_requests')
    .update(updates)
    .eq('id', id)
    .select(`
      id,
      vendor_id,
      ad_type_id,
      title,
      description,
      content,
      image_url,
      video_url,
      target_audience,
      campaign_objectives,
      start_date,
      end_date,
      total_days,
      daily_budget,
      total_budget,
      status,
      admin_notes,
      rejection_reason,
      approved_by,
      approved_at,
      payment_status,
      payment_id,
      campaign_start_date,
      campaign_end_date,
      is_featured,
      priority_level,
      created_at,
      updated_at,
      ad_type:ad_types(*),
      vendor:users!ad_requests_vendor_id_fkey(name, email),
      approver:users!ad_requests_approved_by_fkey(name, email)
    `)
    .single();

  if (error) throw error;
  return {
    ...data,
    ad_type: Array.isArray(data.ad_type) ? data.ad_type[0] : data.ad_type,
    vendor: Array.isArray(data.vendor) ? data.vendor[0] : data.vendor,
    approver: Array.isArray(data.approver) ? data.approver[0] : data.approver
  };
};

export const approveAdRequest = async (id: string, adminId: string, notes?: string): Promise<AdRequest> => {
  const { data, error } = await supabase
    .from('ad_requests')
    .update({
      status: 'approved',
      approved_by: adminId,
      approved_at: new Date().toISOString(),
      admin_notes: notes
    })
    .eq('id', id)
    .select(`
      id,
      vendor_id,
      ad_type_id,
      title,
      description,
      content,
      image_url,
      video_url,
      target_audience,
      campaign_objectives,
      start_date,
      end_date,
      total_days,
      daily_budget,
      total_budget,
      status,
      admin_notes,
      rejection_reason,
      approved_by,
      approved_at,
      payment_status,
      payment_id,
      campaign_start_date,
      campaign_end_date,
      is_featured,
      priority_level,
      created_at,
      updated_at,
      ad_type:ad_types(*),
      vendor:users!ad_requests_vendor_id_fkey(name, email),
      approver:users!ad_requests_approved_by_fkey(name, email)
    `)
    .single();

  if (error) throw error;
  return {
    ...data,
    ad_type: Array.isArray(data.ad_type) ? data.ad_type[0] : data.ad_type,
    vendor: Array.isArray(data.vendor) ? data.vendor[0] : data.vendor,
    approver: Array.isArray(data.approver) ? data.approver[0] : data.approver
  };
};

export const rejectAdRequest = async (id: string, reason: string, notes?: string): Promise<AdRequest> => {
  const { data, error } = await supabase
    .from('ad_requests')
    .update({
      status: 'rejected',
      rejection_reason: reason,
      admin_notes: notes
    })
    .eq('id', id)
    .select(`
      id,
      vendor_id,
      ad_type_id,
      title,
      description,
      content,
      image_url,
      video_url,
      target_audience,
      campaign_objectives,
      start_date,
      end_date,
      total_days,
      daily_budget,
      total_budget,
      status,
      admin_notes,
      rejection_reason,
      approved_by,
      approved_at,
      payment_status,
      payment_id,
      campaign_start_date,
      campaign_end_date,
      is_featured,
      priority_level,
      created_at,
      updated_at,
      ad_type:ad_types(*),
      vendor:users!ad_requests_vendor_id_fkey(name, email),
      approver:users!ad_requests_approved_by_fkey(name, email)
    `)
    .single();

  if (error) throw error;
  return {
    ...data,
    ad_type: Array.isArray(data.ad_type) ? data.ad_type[0] : data.ad_type,
    vendor: Array.isArray(data.vendor) ? data.vendor[0] : data.vendor,
    approver: Array.isArray(data.approver) ? data.approver[0] : data.approver
  };
};

// File Upload for Vendor Ads
export const uploadVendorAdFile = async (
  file: File,
  vendorId: string,
  adRequestId: string,
  fileType: 'image' | 'video'
): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${vendorId}/${adRequestId}/${fileType}_${Date.now()}.${fileExt}`;
    const filePath = `vendor-ads/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('vendor-ads')
      .upload(filePath, file);

    if (uploadError) {
      // If storage fails, return a mock URL for demo purposes
      console.warn('Storage upload failed, using mock URL:', uploadError);
      return `https://demo-storage.example.com/vendor-ads/${fileName}`;
    }

    const { data } = supabase.storage
      .from('vendor-ads')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.warn('File upload failed, using mock URL:', error);
    const fileExt = file.name.split('.').pop();
    const fileName = `${vendorId}/${adRequestId}/${fileType}_${Date.now()}.${fileExt}`;
    return `https://demo-storage.example.com/vendor-ads/${fileName}`;
  }
};

// Analytics Management
const getAdAnalytics = async (adRequestId: string): Promise<AdAnalytics[]> => {
  const { data, error } = await supabase
    .from('ad_analytics')
    .select('*')
    .eq('ad_request_id', adRequestId)
    .order('date', { ascending: false });

  if (error) throw error;
  return data || [];
};

const createAdAnalytics = async (analyticsData: Partial<AdAnalytics>): Promise<AdAnalytics> => {
  const { data, error } = await supabase
    .from('ad_analytics')
    .insert([analyticsData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

const updateAdAnalytics = async (
  adRequestId: string, 
  date: string, 
  updates: Partial<AdAnalytics>
): Promise<AdAnalytics> => {
  const { data, error } = await supabase
    .from('ad_analytics')
    .upsert({
      ad_request_id: adRequestId,
      date,
      ...updates
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Payment Management
const createAdPayment = async (paymentData: Partial<AdPayment>): Promise<AdPayment> => {
  const { data, error } = await supabase
    .from('ad_payments')
    .insert([paymentData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

const getVendorPayments = async (vendorId: string): Promise<AdPayment[]> => {
  const { data, error } = await supabase
    .from('ad_payments')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

const updatePaymentStatus = async (
  paymentId: string, 
  status: AdPayment['status'],
  gatewayData?: any
): Promise<AdPayment> => {
  const updates: any = { status };
  
  if (gatewayData) {
    updates.gateway_transaction_id = gatewayData.transaction_id;
    updates.gateway_payment_id = gatewayData.payment_id;
    if (status === 'completed') {
      updates.payment_date = new Date().toISOString();
    }
  }

  const { data, error } = await supabase
    .from('ad_payments')
    .update(updates)
    .eq('id', paymentId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Notification Management
export const createVendorNotification = async (
  vendorId: string,
  title: string,
  message: string,
  type: VendorNotification['type'] = 'info',
  relatedAdId?: string,
  actionUrl?: string
): Promise<VendorNotification> => {
  const { data, error } = await supabase
    .from('vendor_notifications')
    .insert([{
      vendor_id: vendorId,
      title,
      message,
      type,
      related_ad_id: relatedAdId,
      action_url: actionUrl
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getVendorNotifications = async (vendorId: string): Promise<VendorNotification[]> => {
  const { data, error } = await supabase
    .from('vendor_notifications')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data || [];
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  const { error } = await supabase
    .from('vendor_notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) throw error;
};

// Dashboard Stats
export const getVendorDashboardStats = async (vendorId: string): Promise<VendorDashboardStats> => {
  try {
    // Get all ad requests for vendor
    const adRequests = await getVendorAdRequests(vendorId);
    
    // Calculate basic stats
    const totalCampaigns = adRequests.length;
    const activeCampaigns = adRequests.filter(ad => ad.status === 'active').length;
    const pendingApprovals = adRequests.filter(ad => ad.status === 'pending').length;
    const completedCampaigns = adRequests.filter(ad => ad.status === 'completed').length;
    
    // Calculate financial stats
    const totalSpent = adRequests
      .filter(ad => ad.payment_status === 'paid')
      .reduce((sum, ad) => sum + ad.total_budget, 0);
    
    // Get current month data
    const currentMonth = new Date();
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    
    const monthlySpend = adRequests
      .filter(ad => 
        ad.payment_status === 'paid' && 
        new Date(ad.created_at) >= monthStart
      )
      .reduce((sum, ad) => sum + ad.total_budget, 0);

    // Get analytics data for performance metrics
    let totalImpressions = 0;
    let totalClicks = 0;
    let monthlyImpressions = 0;

    for (const ad of adRequests) {
      try {
        const analytics = await getAdAnalytics(ad.id);
        const adImpressions = analytics.reduce((sum, a) => sum + a.impressions, 0);
        const adClicks = analytics.reduce((sum, a) => sum + a.clicks, 0);
        
        totalImpressions += adImpressions;
        totalClicks += adClicks;
        
        // Monthly impressions
        const monthlyAnalytics = analytics.filter(a => new Date(a.date) >= monthStart);
        monthlyImpressions += monthlyAnalytics.reduce((sum, a) => sum + a.impressions, 0);
      } catch (error) {
        console.warn(`Failed to load analytics for ad ${ad.id}:`, error);
      }
    }

    const averageCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    
    return {
      totalCampaigns,
      activeCampaigns,
      totalSpent,
      totalImpressions,
      totalClicks,
      averageCTR,
      pendingApprovals,
      completedCampaigns,
      recentCampaigns: adRequests.slice(0, 5),
      monthlySpend,
      monthlyImpressions
    };
  } catch (error) {
    console.error('Error fetching vendor dashboard stats:', error);
    // Return default stats on error
    return {
      totalCampaigns: 0,
      activeCampaigns: 0,
      totalSpent: 0,
      totalImpressions: 0,
      totalClicks: 0,
      averageCTR: 0,
      pendingApprovals: 0,
      completedCampaigns: 0,
      recentCampaigns: [],
      monthlySpend: 0,
      monthlyImpressions: 0
    };
  }
};

// Admin Settings Management
export const getAdminSetting = async (category: string, key: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from('admin_settings')
    .select('setting_value')
    .eq('setting_category', category)
    .eq('setting_key', key)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data.setting_value;
};

export const updateAdminSetting = async (
  category: string, 
  key: string, 
  value: string,
  updatedBy: string
): Promise<void> => {
  const { error } = await supabase
    .from('admin_settings')
    .upsert({
      setting_category: category,
      setting_key: key,
      setting_value: value,
      updated_by: updatedBy
    });

  if (error) throw error;
};

// Utility Functions
export const calculateAdCost = (
  adType: AdType, 
  days: number, 
  platformCommission: number = 10,
  gstRate: number = 18
) => {
  const baseAmount = adType.base_price * days;
  const platformFee = (baseAmount * platformCommission) / 100;
  const subtotal = baseAmount + platformFee;
  const gstAmount = (subtotal * gstRate) / 100;
  const totalAmount = subtotal + gstAmount;

  return {
    baseAmount,
    platformFee,
    subtotal,
    gstAmount,
    totalAmount,
    breakdown: {
      dailyRate: adType.base_price,
      days,
      platformCommissionRate: platformCommission,
      gstRate
    }
  };
};

const generateInvoiceNumber = (): string => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `INV-${timestamp.slice(-8)}-${random}`;
};

// Mock data generators for demo purposes
const generateMockAnalytics = (adRequestId: string, days: number): AdAnalytics[] => {
  const analytics: AdAnalytics[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    const impressions = Math.floor(Math.random() * 5000) + 1000;
    const clicks = Math.floor(impressions * (Math.random() * 0.05 + 0.01)); // 1-6% CTR
    const conversions = Math.floor(clicks * (Math.random() * 0.1 + 0.02)); // 2-12% conversion rate
    const spend = Math.floor(Math.random() * 1000) + 200;

    analytics.push({
      id: `analytics-${i}`,
      ad_request_id: adRequestId,
      date: date.toISOString().split('T')[0],
      impressions,
      clicks,
      ctr: (clicks / impressions) * 100,
      conversions,
      conversion_rate: (conversions / clicks) * 100,
      spend,
      cpm: (spend / impressions) * 1000,
      unique_visitors: Math.floor(impressions * 0.8),
      bounce_rate: Math.random() * 30 + 20,
      created_at: date.toISOString()
    });
  }

  return analytics;
};