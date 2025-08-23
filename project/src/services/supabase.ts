import { createClient } from '@supabase/supabase-js';
import { mockAdminStats } from '../data/mockData';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: any = null;

try {
  if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } else {
    console.warn('Supabase environment variables not found');
  }
} catch (error) {
  console.warn('Failed to initialize Supabase client:', error);
  supabase = null;
}

export { supabase };

// Additional interfaces
interface BillboardType {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface BillboardImage {
  id: string;
  billboard_id: string;
  image_url: string;
  image_type: string;
  display_order: number;
  created_at: string;
}

export interface BillboardSizeFee {
  id: number;
  size_name: string;
  size_category?: string;
  fee_amount: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  updated_by?: string;
}

export interface KYCDocument {
  id: string;
  user_id: string;
  document_type: string;
  document_url: string;
  status: 'pending' | 'approved' | 'rejected';
  uploaded_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  rejection_reason?: string;
}

export interface UserDashboardStats {
  activeBookings: number;
  totalSpent: number;
  savedBillboards: number;
  upcomingBookings: number;
  totalImpressions: number;
  campaignReach: number;
  recentBookings: any[];
}

interface AdminDashboardStats {
  totalUsers: number;
  totalRevenue: number;
  pendingApprovals: number;
  activeHoardings: number;
  monthlyGrowth: number;
  systemHealth: number;
  recentApprovals: {
    id: string;
    title: string;
    status: string;
    owner: { name: string };
    location_address: string;
  }[];
  verificationStatus: {
    pendingVerification: number;
    verifiedThisWeek: number;
    rejectedThisWeek: number;
    reverifications: number;
  };
  pendingKYC: number;
}

interface SubAdminDashboardStats {
  totalAssignedBillboards: number;
  completedVerifications: number;
  pendingVerifications: number;
  rejectedVerifications: number;
  thisMonthVisits: number;
  averageVerificationTime: number;
  pendingBillboards: {
    id: string;
    title: string;
    location_address: string;
    approved_at: string;
    owner: {
      name: string;
    };
  }[];
}

interface OwnerDashboardStats {
  totalBillboards: number;
  activeBillboards: number;
  pendingApproval: number;
  totalEarnings: number;
  monthlyEarnings: number;
  totalBookings: number;
  activeBookings: number;
  rejectedBillboards: number;
  totalRevenue: number;
  walletBalance: number;
  kycStatus: string;
  totalViews: number;
  recentBookings: any[];
  rejectionNotes?: string;
}

// Billboard related functions
export interface Billboard {
  id: string;
  owner_id: string;
  title: string;
  state: string;
  city: string;
  location_address: string;
  google_maps_link?: string;
  latitude?: number | null;
  longitude?: number | null;
  price_per_day: number;
  daily_views: number;
  min_days: number;
  billboard_type_id?: number;
  dimensions: string;
  facing: string;
  features: string;
  description: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'active' | 'inactive';
  featured: boolean;
  admin_notes?: string;
  rejection_reason?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  joining_fee_paid: boolean;
  joining_fee_amount?: number;
  joining_fee_payment_id?: string;
  joining_fee_payment_date?: string;
  is_two_sided?: boolean;
  side_a_description?: string;
  side_b_description?: string;
  billboard_sides?: any[];
  billboard_images?: any[];
  billboard_type?: any;
  owner?: any;
}

export interface VendorAd {
  id: string;
  user_id: string;
  title: string;
  ad_type: 'banner' | 'video' | 'popup';
  content: string;
  image_url?: string;
  video_url?: string;
  target_audience?: string;
  start_date: string;
  end_date: string;
  daily_budget: number;
  total_cost: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'active' | 'paused' | 'completed';
  is_active: boolean;
  impressions?: number;
  clicks?: number;
  ctr?: number;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  user?: {
    name: string;
    email: string;
  };
}

// Vendor Ads functions
const getVendorAds = async (userId: string): Promise<VendorAd[]> => {
  const { data, error } = await supabase
    .from('vendor_ads')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

const getAllVendorAds = async (): Promise<VendorAd[]> => {
  const { data, error } = await supabase
    .from('vendor_ads')
    .select(`
      *,
      user:users(name, email)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

const getPendingVendorAds = async (): Promise<VendorAd[]> => {
  const { data, error } = await supabase
    .from('vendor_ads')
    .select(`
      *,
      user:users(name, email)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getApprovedVendorAds = async (limit: number = 10): Promise<VendorAd[]> => {
  try {
    // Check if Supabase client is available
    if (!supabase) {
      console.warn('Supabase client not available');
      return [];
    }

    // First get the vendor ads
    const { data: adsData, error: adsError } = await supabase
      .from('vendor_ads')
      .select('*')
      .eq('status', 'approved')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (adsError) {
      console.warn('Error fetching vendor ads:', adsError);
      return [];
    }
    if (!adsData) return [];

    // Then get user data for each ad
    const adsWithUsers = await Promise.all(
      adsData.map(async (ad: any) => {
        try {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('name, email')
            .eq('id', ad.user_id)
            .single();

          return {
            ...ad,
            user: userError ? null : userData
          };
        } catch (userFetchError) {
          console.warn('Error fetching user data for ad:', ad.id, userFetchError);
          return {
            ...ad,
            user: null
          };
        }
      })
    );

    return adsWithUsers;
  } catch (error) {
    console.log('Error fetching approved vendor ads:', error);
    // Return empty array instead of throwing to prevent component crashes
    return [];
  }
};

export const createVendorAd = async (adData: Partial<VendorAd>): Promise<VendorAd> => {
  const { data, error } = await supabase
    .from('vendor_ads')
    .insert([adData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateVendorAd = async (id: string, updates: Partial<VendorAd>): Promise<VendorAd> => {
  const { data, error } = await supabase
    .from('vendor_ads')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteVendorAd = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('vendor_ads')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

const uploadVendorAdMedia = async (
  file: File,
  userId: string,
  adId: string,
  mediaType: 'image' | 'video'
): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${adId}/${mediaType}_${Date.now()}.${fileExt}`;
  const filePath = `vendor-ads/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('vendor-ads')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('vendor-ads')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

// Testimonial functions
interface Testimonial {
  id: string;
  name: string;
  role?: string;
  quote: string;
  avatar?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const getTestimonials = async (): Promise<Testimonial[]> => {
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// User functions
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'owner' | 'vendor' | 'admin' | 'sub_admin';
  phone?: string;
  profile_photo?: string;
  kyc_status: 'pending' | 'submitted' | 'approved' | 'rejected';
  wallet_balance: number;
  is_active: boolean;
  email_verified: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  failed_login_attempts?: number;
  locked_until?: string;
  password_changed_at?: string;
  force_password_change?: boolean;
  rejection_notes?: string;
}

export const getUsers = async (role?: string): Promise<User[]> => {
  try {
    let query = supabase
      .from('users')
      .select('id, email, name, role, phone, profile_photo, kyc_status, wallet_balance, is_active, email_verified, last_login, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (role) {
      query = query.eq('role', role);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('Failed to fetch users:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.warn('Failed to fetch users:', error);
    return [];
  }
};

const getUserById = async (id: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, name, role, phone, profile_photo, kyc_status, wallet_balance, is_active, email_verified, last_login, created_at, updated_at')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
};

export const updateUser = async (id: string, updates: Partial<User>): Promise<User> => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select('id, email, name, role, phone, profile_photo, kyc_status, wallet_balance, is_active, email_verified, last_login, created_at, updated_at')
    .single();

  if (error) throw error;
  return data;
};

// Billboard functions
export const getBillboards = async (): Promise<Billboard[]> => {
  try {
    const { data, error } = await supabase
      .from('billboards')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Failed to fetch billboards:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.warn('Failed to fetch billboards:', error);
    return [];
  }
};

export const getBillboardById = async (id: string): Promise<Billboard | null> => {
  const { data, error } = await supabase
    .from('billboards')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
};

export const updateBillboard = async (id: string, updates: Partial<Billboard>): Promise<Billboard> => {
  const { data, error } = await supabase
    .from('billboards')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteBillboard = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('billboards')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Get active bookings for a billboard
export const getActiveBillboardBookings = async (billboardId: string): Promise<any[]> => {
  try {
    if (!supabase) {
      return [];
    }

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        start_date,
        end_date,
        status,
        user:users(name)
      `)
      .eq('billboard_id', billboardId)
      .in('status', ['approved', 'active'])
      .gte('end_date', new Date().toISOString().split('T')[0])
      .order('end_date', { ascending: false });

    if (error) {
      console.warn('Error fetching billboard bookings:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.warn('Error getting active billboard bookings:', error);
    return [];
  }
};
export const getFeaturedBillboards = async (limit?: number): Promise<Billboard[]> => {
  let query = supabase
    .from('billboards')
    .select('*')
    .eq('featured', true)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
};

// Billboard Type functions
export const getBillboardTypes = async (): Promise<BillboardType[]> => {
  const { data, error } = await supabase
    .from('billboard_types')
    .select('*')
    .eq('is_active', true)
    .order('type_name', { ascending: true });

  if (error) throw error;
  return data || [];
};

// Billboard creation and image upload functions
export const createBillboard = async (billboardData: Partial<Billboard>): Promise<Billboard> => {
  const { data, error } = await supabase
    .from('billboards')
    .insert([billboardData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// export const uploadBillboardImage = async (
//   file: File,
//   billboardId: string
// ): Promise<string> => {
//   try {
//     if (!supabase) {
//       console.warn('Supabase client not available, using fallback URL');
//       const fileExt = file.name.split('.').pop();
//       const fileName = `${billboardId}/${Date.now()}.${fileExt}`;
//       return `https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&h=600&fit=crop`;
//     }

//     const fileExt = file.name.split('.').pop();
//     const fileName = `${billboardId}/${Date.now()}.${fileExt}`;
//     const filePath = fileName;

//     // Try to upload to storage, fallback to mock URL if bucket doesn't exist
//     try {
//       const { error: uploadError } = await supabase.storage
//         .from('billboards')
//         .upload(filePath, file);

//       if (uploadError) {
//         if (uploadError.message.includes('Bucket not found')) {
//           console.warn('Storage bucket not found, using fallback URL');
//           return `https://images.pexels.com/photos/1666021/pexels-photo-1666021.jpeg?auto=compress&cs=tinysrgb&w=800&h=450&fit=crop`;
//         }
//         throw uploadError;
//       }

//       const { data } = supabase.storage
//         .from('billboards')
//         .getPublicUrl(filePath);

//       return data.publicUrl;
//     } catch (storageError) {
//       console.warn('Storage service unavailable, using fallback URL:', storageError);
//       return `https://images.pexels.com/photos/1666021/pexels-photo-1666021.jpeg?auto=compress&cs=tinysrgb&w=800&h=450&fit=crop`;
//     }
//   } catch (error) {
//     console.error('Error uploading billboard image:', error);
//     // Return fallback image URL on any error
//     return `https://images.pexels.com/photos/1666021/pexels-photo-1666021.jpeg?auto=compress&cs=tinysrgb&w=800&h=450&fit=crop`;
//   }
// };


export const uploadBillboardImage = async (
  file: File,
  billboardId: string
): Promise<string> => {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `${billboardId}/${Date.now()}.${fileExt}`;
  const filePath = fileName;

  // Upload to 'billboards' bucket
  const { error: uploadError } = await supabase.storage
    .from("billboards")
    .upload(filePath, file);

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from("billboards").getPublicUrl(filePath);

  if (!data || !data.publicUrl) {
    throw new Error("Failed to obtain image public URL.");
  }

  return data.publicUrl;
};




export const saveBillboardImages = async (
  billboardId: string,
  imageUrls: string[]
): Promise<BillboardImage[]> => {
  const imageData = imageUrls.map((url, index) => ({
    billboard_id: billboardId,
    image_url: url,
    image_type: index === 0 ? 'main' : 'additional',
    display_order: index + 1
  }));

  const { data, error } = await supabase
    .from('billboard_images')
    .insert(imageData)
    .select();

  if (error) throw error;
  return data || [];
};

// Dashboard stats functions
export const getUserDashboardStats = async (): Promise<UserDashboardStats> => {
  return {
    activeBookings: 0,
    totalSpent: 0,
    savedBillboards: 0,
    upcomingBookings: 0,
    totalImpressions: 0,
    campaignReach: 0,
    recentBookings: []
  };
};

export const getAdminDashboardStats = async (): Promise<AdminDashboardStats> => {
  try {
    if (!supabase) {
      console.warn('Database service not available, returning fallback data');
      return getDefaultAdminStats();
    }

    let totalRevenue = 0;

    // Get total users count with timeout and error handling
    const { count: totalUsers, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .abortSignal(AbortSignal.timeout(120000));

    if (usersError) {
      console.warn('Failed to fetch users count:', usersError);
    }

    // Get total revenue from wallet transactions
    const { data: revenueData, error: revenueError } = await supabase
      .from('wallet_transactions')
      .select('amount') 
      .eq('type', 'credit')
      .abortSignal(AbortSignal.timeout(120000));

    if (revenueError) {
      console.warn('Failed to fetch revenue data:', revenueError);
      totalRevenue = mockAdminStats.totalRevenue;
    } else {
      totalRevenue = revenueData?.reduce((sum: number, transaction: any) => sum + parseFloat(transaction.amount), 0) || 0;
    }

    // Get pending approvals count
    const { count: pendingApprovals, error: approvalsError } = await supabase
      .from('billboards')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .abortSignal(AbortSignal.timeout(120000));

    if (approvalsError) {
      console.warn('Failed to fetch pending approvals:', approvalsError);
    }

    // Get active billboards count
    const { count: activeHoardings, error: hoardingsError } = await supabase
      .from('billboards')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .abortSignal(AbortSignal.timeout(120000));

    if (hoardingsError) {
      console.warn('Failed to fetch active hoardings:', hoardingsError);
    }

    // Calculate monthly growth (simplified calculation)
    const currentMonth = new Date();
    const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    
    const { count: currentMonthUsers, error: currentMonthError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', currentMonth.toISOString())
      .abortSignal(AbortSignal.timeout(120000));

    if (currentMonthError) {
      console.warn('Failed to fetch current month users:', currentMonthError);
    }

    const { count: lastMonthUsers, error: lastMonthError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', lastMonth.toISOString())
      .lt('created_at', currentMonth.toISOString())
      .abortSignal(AbortSignal.timeout(120000));

    if (lastMonthError) {
      console.warn('Failed to fetch last month users:', lastMonthError);
    }

    const monthlyGrowth = lastMonthUsers > 0 
      ? Math.round(((currentMonthUsers || 0) - (lastMonthUsers || 0)) / (lastMonthUsers || 1) * 100)
      : 0;

    // Get recent approvals
    const { data: recentApprovals, error: recentApprovalsError } = await supabase
      .from('billboards')
      .select(`
        id,
        title,
        status,
        location_address,
        owner:users!billboards_owner_id_fkey(name)
      `)
      .in('status', ['pending', 'approved', 'rejected'])
      .order('updated_at', { ascending: false })
      .limit(5)
      .abortSignal(AbortSignal.timeout(120000));

    if (recentApprovalsError) {
      console.warn('Failed to fetch recent approvals:', recentApprovalsError);
    }

    // Get verification status
    const { count: pendingVerification, error: pendingVerificationError } = await supabase
      .from('billboards')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')
      .abortSignal(AbortSignal.timeout(120000));

    if (pendingVerificationError) {
      console.warn('Failed to fetch pending verification:', pendingVerificationError);
    }

    const { count: verifiedThisWeek, error: verifiedThisWeekError } = await supabase
      .from('site_visits')
      .select('*', { count: 'exact', head: true })
      .eq('is_verified', true)
      .gte('visit_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .abortSignal(AbortSignal.timeout(120000));

    if (verifiedThisWeekError) {
      console.warn('Failed to fetch verified this week:', verifiedThisWeekError);
    }

    const { count: rejectedThisWeek, error: rejectedThisWeekError } = await supabase
      .from('site_visits')
      .select('*', { count: 'exact', head: true })
      .eq('is_verified', false)
      .gte('visit_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .abortSignal(AbortSignal.timeout(120000));

    if (rejectedThisWeekError) {
      console.warn('Failed to fetch rejected this week:', rejectedThisWeekError);
    }

    // Get pending KYC count
    const { count: pendingKYC, error: pendingKYCError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'owner')
      .eq('kyc_status', 'submitted')
      .abortSignal(AbortSignal.timeout(120000));

    if (pendingKYCError) {
      console.warn('Failed to fetch pending KYC:', pendingKYCError);
    }

    // Calculate system health based on various factors
    const systemHealth = Math.min(100, Math.max(0, 
      85 + (monthlyGrowth > 0 ? 10 : -5) + ((pendingApprovals || 0) < 10 ? 5 : -10)
    ));

    return {
      totalUsers: totalUsers || 0,
      totalRevenue: Math.round(totalRevenue),
      pendingApprovals: pendingApprovals || 0,
      activeHoardings: activeHoardings || 0,
      monthlyGrowth,
      systemHealth,
      recentApprovals: (recentApprovals || []).map((approval: any) => ({
        ...approval,
        owner: Array.isArray(approval.owner) ? approval.owner[0] : approval.owner
      })),
      verificationStatus: {
        pendingVerification: pendingVerification || 0,
        verifiedThisWeek: verifiedThisWeek || 0,
        rejectedThisWeek: rejectedThisWeek || 0,
        reverifications: 0
      },
      pendingKYC: pendingKYC || 0
    };
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    return getDefaultAdminStats();
  }
};

// Helper function to provide default admin stats when service is unavailable
const getDefaultAdminStats = (): AdminDashboardStats => {
  return {
    totalUsers: 0,
    totalRevenue: 0,
    pendingApprovals: 0,
    activeHoardings: 0,
    monthlyGrowth: 0,
    systemHealth: 50, // Lower health when service is unavailable
    recentApprovals: [],
    verificationStatus: {
      pendingVerification: 0,
      verifiedThisWeek: 0,
      rejectedThisWeek: 0,
      reverifications: 0
    },
    pendingKYC: 0
  };
};
export const getSubAdminDashboardStats = async (subAdminId: string): Promise<SubAdminDashboardStats> => {
  try {
    if (!supabase) {
      throw new Error('Database service not available');
    }

    // Enhanced debugging and error handling
    console.log('🔍 SubAdmin Dashboard Debug - Starting data fetch for:', subAdminId);
    
    // First, verify the sub-admin exists and is active
    const { data: subAdminUser, error: userError } = await supabase
      .from('users')
      .select('id, name, email, role, is_active')
      .eq('id', subAdminId)
      .eq('role', 'sub_admin')
      .single();

    if (userError) {
      console.error('❌ SubAdmin user verification failed:', userError);
      throw new Error(`Sub-admin user not found or invalid: ${userError.message}`);
    }

    if (!subAdminUser.is_active) {
      console.warn('⚠️ SubAdmin account is inactive:', subAdminUser);
      throw new Error('Sub-admin account is inactive');
    }

    console.log('✅ SubAdmin user verified:', subAdminUser);

    // Get assigned billboards for this sub-admin with enhanced query
    const { data: assignments, error: assignmentsError } = await supabase
      .from('billboard_assignments')
      .select(`
        id,
        billboard_id,
        sub_admin_id,
        status,
        priority,
        assigned_at,
        assigned_by,
        due_date,
        notes,
        completed_at,
        is_active,
        billboard:billboards(
          id,
          title,
          location_address,
          state,
          city,
          status,
          approved_at,
          owner:users!billboards_owner_id_fkey(name)
        )
      `)
      .eq('sub_admin_id', subAdminId)
      .eq('is_active', true)
      .order('assigned_at', { ascending: false });

    if (assignmentsError) {
      console.error('❌ Assignments query failed:', assignmentsError);
      throw new Error(`Failed to fetch assignments: ${assignmentsError.message}`);
    }

    console.log('📊 Raw assignments data:', {
      subAdminId,
      assignmentsCount: assignments?.length || 0,
      assignments: assignments?.map(a => ({
        id: a.id,
        billboard_id: a.billboard_id,
        billboard_title: a.billboard?.title,
        status: a.status,
        priority: a.priority,
        assigned_at: a.assigned_at
      }))
    });

    // Validate assignment data integrity
    const validAssignments = (assignments || []).filter((assignment: any) => {
      const isValid = assignment.billboard && assignment.billboard.id;
      if (!isValid) {
        console.warn('⚠️ Invalid assignment found (missing billboard):', assignment);
      }
      return isValid;
    });

    console.log('✅ Valid assignments after filtering:', validAssignments.length);

    // Get site visits count for this month with better error handling
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    let thisMonthVisits = 0;
    let completedVerifications = 0;
    let rejectedVerifications = 0;

    try {
      const { count: monthVisits } = await supabase
        .from('site_visits')
        .select('*', { count: 'exact', head: true })
        .eq('sub_admin_id', subAdminId)
        .gte('visit_date', currentMonth.toISOString());

      thisMonthVisits = monthVisits || 0;

      const { count: completedCount } = await supabase
        .from('site_visits')
        .select('*', { count: 'exact', head: true })
        .eq('sub_admin_id', subAdminId)
        .eq('is_verified', true);

      completedVerifications = completedCount || 0;

      const { count: rejectedCount } = await supabase
        .from('site_visits')
        .select('*', { count: 'exact', head: true })
        .eq('sub_admin_id', subAdminId)
        .eq('is_verified', false);

      rejectedVerifications = rejectedCount || 0;
    } catch (visitsError) {
      console.warn('⚠️ Error fetching site visits data:', visitsError);
      // Continue with default values
    }

    // Get site visits count for this month
    // Calculate stats from assignments
    const totalAssignments = validAssignments;
    const pendingAssignments = totalAssignments.filter((a: any) => a.status === 'pending');
    const completedAssignments = totalAssignments.filter((a: any) => a.status === 'completed');
    
    console.log('📈 SubAdmin dashboard stats calculated:', {
      subAdminId,
      totalAssignments: totalAssignments.length,
      pendingAssignments: pendingAssignments.length,
      completedAssignments: completedAssignments.length,
      thisMonthVisits,
      completedVerifications,
      rejectedVerifications
    });
    
    return {
      totalAssignedBillboards: totalAssignments.length,
      pendingVerifications: pendingAssignments.length,
      completedVerifications: completedVerifications + completedAssignments.length,
      rejectedVerifications,
      thisMonthVisits,
      averageVerificationTime: 2.5, // Mock average time in hours
      pendingBillboards: pendingAssignments.map((assignment: any) => ({
        id: assignment.billboard?.id || assignment.billboard_id,
        title: assignment.billboard?.title || 'Unknown Billboard',
        location_address: assignment.billboard?.location_address || 'Unknown Location',
        approved_at: assignment.assigned_at,
        owner: {
          name: assignment.billboard?.owner?.name || 'Unknown Owner'
        },
        priority: assignment.priority,
        assignment_id: assignment.id,
        distance: Math.floor(Math.random() * 50) + 5 // Mock distance for demo
      }))
    };
  } catch (error) {
    console.error('❌ SubAdmin dashboard stats error:', {
      subAdminId,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
};

const getPendingBillboardsForVerification = async (): Promise<any[]> => {
  const { data, error } = await supabase
    .from('billboards')
    .select(`
      id,
      title,
      location_address,
      approved_at,
      owner:users!billboards_owner_id_fkey(name)
    `)
    .eq('status', 'approved')
    .order('approved_at', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const getOwnerDashboardStats = async (): Promise<OwnerDashboardStats> => {
  try {
    if (!supabase) {
      throw new Error('Database service not available');
    }

    // Get current user from localStorage for owner ID
    const userStr = localStorage.getItem('billboardhub_user');
    if (!userStr) {
      throw new Error('User not authenticated');
    }
    
    const user = JSON.parse(userStr);
    const ownerId = user.id;

    // Get billboard counts and stats
    const { data: billboards, error: billboardsError } = await supabase
      .from('billboards')
      .select('id, status, price_per_day, daily_views, created_at')
      .eq('owner_id', ownerId);

    if (billboardsError) {
      console.warn('Error fetching billboards:', billboardsError);
    }

    const billboardData = billboards || [];
    const totalBillboards = billboardData.length;
    const activeBillboards = billboardData.filter(b => b.status === 'active').length;
    const pendingApproval = billboardData.filter(b => b.status === 'pending').length;
    const rejectedBillboards = billboardData.filter(b => b.status === 'rejected').length;
    const totalViews = billboardData.reduce((sum, b) => sum + (b.daily_views || 0), 0);

    // Get booking stats
    const billboardIds = billboardData.map(b => b.id);
    let totalBookings = 0;
    let activeBookings = 0;
    let totalRevenue = 0;
    let recentBookings: any[] = [];

    if (billboardIds.length > 0) {
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          billboard_id,
          start_date,
          end_date,
          total_days,
          final_amount,
          status,
          created_at,
          billboard:billboards(title, location_address),
          user:users(name)
        `)
        .in('billboard_id', billboardIds)
        .order('created_at', { ascending: false });

      if (bookingsError) {
        console.warn('Error fetching bookings:', bookingsError);
      } else {
        const bookingData = bookings || [];
        totalBookings = bookingData.length;
        activeBookings = bookingData.filter(b => 
          b.status === 'active' && new Date(b.end_date) > new Date()
        ).length;
        totalRevenue = bookingData
          .filter(b => b.status === 'completed' || b.status === 'active')
          .reduce((sum, b) => sum + (b.final_amount || 0), 0);
        recentBookings = bookingData.slice(0, 5).map(booking => ({
          ...booking,
          isCurrentlyBooked: booking.status === 'active' && new Date(booking.end_date) > new Date(),
          daysRemaining: booking.status === 'active' ? 
            Math.ceil((new Date(booking.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0
        }));
      }
    }

    // Get wallet balance
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('wallet_balance, kyc_status, rejection_notes')
      .eq('id', ownerId)
      .single();

    if (userError) {
      console.warn('Error fetching user data:', userError);
    }

    const walletBalance = userData?.wallet_balance || 0;
    const kycStatus = userData?.kyc_status || 'pending';
    const rejectionNotes = userData?.rejection_notes || null;

    // Calculate monthly earnings (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let monthlyEarnings = 0;
    if (billboardIds.length > 0) {
      const { data: monthlyBookings, error: monthlyError } = await supabase
        .from('bookings')
        .select('final_amount')
        .in('billboard_id', billboardIds)
        .in('status', ['completed', 'active'])
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (monthlyError) {
        console.warn('Error fetching monthly earnings:', monthlyError);
      } else {
        monthlyEarnings = (monthlyBookings || [])
          .reduce((sum, b) => sum + (b.final_amount || 0), 0);
      }
    }

    return {
      totalBillboards,
      activeBillboards,
      pendingApproval,
      totalEarnings: totalRevenue,
      monthlyEarnings,
      totalBookings,
      activeBookings,
      rejectedBillboards,
      totalRevenue,
      walletBalance,
      kycStatus,
      totalViews,
      recentBookings,
      rejectionNotes
    };
  } catch (error) {
    console.error('Error fetching owner dashboard stats:', error);
    // Return default stats on error
    return {
      totalBillboards: 0,
      activeBillboards: 0,
      pendingApproval: 0,
      totalEarnings: 0,
      monthlyEarnings: 0,
      totalBookings: 0,
      activeBookings: 0,
      rejectedBillboards: 0,
      totalRevenue: 0,
      walletBalance: 0,
      kycStatus: 'pending',
      totalViews: 0,
      recentBookings: []
    };
  }
};

// Billboard Size Fee functions
export const getBillboardSizeFees = async (): Promise<BillboardSizeFee[]> => {
  if (!supabase) {
    throw new Error('Database service not available');
  }

  const { data, error } = await supabase
    .from('billboard_size_fees')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createBillboardSizeFee = async (feeData: Partial<BillboardSizeFee>): Promise<BillboardSizeFee> => {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  const { data, error } = await supabase
    .from('billboard_size_fees')
    .insert([feeData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateBillboardSizeFee = async (id: string, updates: Partial<BillboardSizeFee>): Promise<BillboardSizeFee> => {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  const { data, error } = await supabase
    .from('billboard_size_fees')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteBillboardSizeFee = async (id: string): Promise<void> => {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  const { error } = await supabase
    .from('billboard_size_fees')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// KYC functions
export const uploadKYCDocument = async (
  file: File,
  userId: string,
  documentType: string
): Promise<string> => {
  try {
    // Convert file to base64 for storage in database
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // Save document reference to database
    const { error: dbError } = await supabase
      .from('kyc_documents')
      .insert([{
        user_id: userId,
        document_type: documentType,
        document_url: base64Data,
        status: 'pending'
      }]);

    if (dbError) throw dbError;

    return base64Data;
  } catch (error) {
    console.error('Error uploading KYC document:', error);
    throw error;
  }
};

export const getUserKYCDocuments = async (userId: string): Promise<KYCDocument[]> => {
  const { data, error } = await supabase
    .from('kyc_documents')
    .select('*')
    .eq('user_id', userId)
    .order('uploaded_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const updateUserKYCStatus = async (
  userId: string,
  status: 'pending' | 'submitted' | 'approved' | 'rejected',
  rejectionReason?: string
): Promise<User> => {
  try {
    const updates: Partial<User> = { kyc_status: status };
    
    // Handle rejection notes and clearing
    if (status === 'rejected' && rejectionReason) {
      updates.rejection_notes = rejectionReason;
    } else if (status === 'approved' || status === 'submitted') {
      // Clear rejection notes when approved or resubmitted
      updates.rejection_notes = null;
    }
    
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select('id, email, name, role, phone, profile_photo, kyc_status, wallet_balance, is_active, email_verified, last_login, created_at, updated_at, rejection_notes')
      .single();

    if (error) throw error;
    
    // Log the KYC status change for audit purposes
    console.log(`KYC status updated for user ${userId}:`, {
      userId,
      newStatus: status,
      rejectionReason,
      previousStatus: status === 'submitted' ? 'rejected (resubmitted)' : 'unknown',
      timestamp: new Date().toISOString()
    });
    
    return data;
  } catch (error) {
    console.error('Error updating KYC status:', error);
    throw error;
  }
};

export const requestReverification = async (userId: string): Promise<void> => {
  try {
    if (!supabase) {
      throw new Error('Database service not available');
    }

    const { error } = await supabase
      .from('users')
      .update({ kyc_status: 'pending' })
      .eq('id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error requesting reverification:', error);
    throw error;
  }
};

// Site visit and verification functions
export const uploadSiteVisitPhoto = async (
  file: File,
  billboardId: string,
  photoType: string
): Promise<string> => {
  try {
    // For demo purposes, simulate successful upload
    // In production, this would upload to the 'site-visits' storage bucket
    const fileExt = file.name.split('.').pop();
    const fileName = `${billboardId}/${photoType}_${Date.now()}.${fileExt}`;
    
    console.log(`Simulating upload of ${fileName} for demo purposes`);
    
    // Return a demo URL that represents where the file would be stored
    return `https://demo-storage.example.com/site-visits/${fileName}`;
  } catch (error) {
    console.warn('Upload simulation for demo:', error);
    const fileExt = file.name.split('.').pop();
    const fileName = `${billboardId}/${photoType}_${Date.now()}.${fileExt}`;
    return `https://demo-storage.example.com/site-visits/${fileName}`;
  }
};

export const completeSiteVerification = async (
  billboardId: string,
  subAdminId: string,
  isVerified: boolean,
  siteVisitData: any
): Promise<void> => {
  try {
    // Step 1: Insert site visit record
    const { error } = await supabase
      .from('site_visits')
      .insert([{
        billboard_id: billboardId,
        sub_admin_id: subAdminId,
        is_verified: isVerified,
        ...siteVisitData,
        visit_date: new Date().toISOString()
      }]);

    if (error) {
      console.warn('Database insert failed, simulating success for demo:', error);
      return;
    }

    // Step 2: Update billboard status based on verification result
    const newBillboardStatus = isVerified ? 'active' : 'rejected';
    const { error: billboardUpdateError } = await supabase
      .from('billboards')
      .update({
        status: newBillboardStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', billboardId);

    if (billboardUpdateError) {
      console.warn('Billboard status update failed, continuing for demo:', billboardUpdateError);
    }

    // Step 3: Log the verification action for audit purposes
    console.log(`Billboard ${billboardId} verification completed:`, {
      subAdminId,
      isVerified,
      newStatus: newBillboardStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.warn('Site verification failed, simulating success for demo:', error);
  }
};

// Additional vendor ad functions
const approveVendorAd = async (id: string, adminNotes?: string): Promise<VendorAd> => {
  const { data, error } = await supabase
    .from('vendor_ads')
    .update({
      status: 'approved',
      is_active: true,
      admin_notes: adminNotes,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

const rejectVendorAd = async (id: string, adminNotes: string): Promise<VendorAd> => {
  const { data, error } = await supabase
    .from('vendor_ads')
    .update({
      status: 'rejected',
      is_active: false,
      admin_notes: adminNotes,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getUserVendorAds = async (userId: string): Promise<VendorAd[]> => {
  return getVendorAds(userId); // Reuse existing function
};

export const uploadVendorAdImage = async (
  file: File,
  userId: string,
  adId: string
): Promise<string> => {
  return uploadVendorAdMedia(file, userId, adId, 'image');
};

export const uploadVendorAdVideo = async (
  file: File,
  userId: string,
  adId: string
): Promise<string> => {
  try {
    return await uploadVendorAdMedia(file, userId, adId, 'video');
  } catch (error) {
    console.warn('Video upload failed, using fallback URL:', error);
    // Return a mock URL for demo purposes
    return `https://demo-storage.example.com/vendor-ads/${userId}/${adId}/video_${Date.now()}.mp4`;
  }
};

// Sub-admin functions

const createSubAdmin = async (): Promise<User> => {
  // This function is now handled by AuthService.createSubAdmin
  // Keep for backward compatibility but delegate to auth service
  throw new Error('Use AuthService.createSubAdmin instead');
};

export const deactivateUser = async (userId: string, adminId: string): Promise<User> => {
  // First revoke all active sessions
  if (supabase) {
    try {
      await supabase.rpc('revoke_subadmin_access', {
        p_user_id: userId,
        p_admin_id: adminId
      });
    } catch (revokeError) {
      console.warn('Failed to revoke user sessions:', revokeError);
    }
  }

  const { data, error } = await supabase
    .from('users')
    .update({ is_active: false })
    .eq('id', userId)
    .select('id, email, name, role, phone, profile_photo, kyc_status, wallet_balance, is_active, email_verified, last_login, created_at, updated_at')
    .single();

  if (error) throw error;
  return data;
};

// Legacy function - now handled by secure_delete_user RPC
const deleteUser = async (userId: string, adminId: string): Promise<void> => {
  if (!supabase) {
    throw new Error('Database service not available');
  }

  const { data, error } = await supabase.rpc('secure_delete_user_with_notifications', {
    deletion_reason: 'Admin deletion via user management',
    requesting_admin_id: adminId,
    user_id_to_delete: userId
  });

  if (error) {
    throw new Error(error.message || 'Failed to delete user');
  }

  if (!data.success) {
    throw new Error(data.error || 'Failed to delete user');
  }
};

// Function to get billboards for admin approval with proper filtering
const getPendingBillboards = async (): Promise<Billboard[]> => {
  try {
    const { data, error } = await supabase
      .from('billboards')
      .select(`
        *,
        owner:users!billboards_owner_id_fkey(name, email),
        billboard_images(id, image_url, image_type),
        billboard_type:billboard_types(type_name)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching pending billboards:', error);
    return [];
  }
};

// Function to get billboards that need verification (approved but not verified)
const getBillboardsForVerification = async (): Promise<Billboard[]> => {
  try {
    const { data, error } = await supabase
      .from('billboards')
      .select(`
        *,
        owner:users!billboards_owner_id_fkey(name, email),
        billboard_images(id, image_url, image_type),
        billboard_type:billboard_types(type_name)
      `)
      .eq('status', 'approved')
      .order('approved_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching billboards for verification:', error);
    return [];
  }
};

// Billboard approval functions
export const approveBillboard = async (id: string, adminNotes?: string): Promise<Billboard> => {
  try {
  const { data, error } = await supabase
    .from('billboards')
    .update({
      status: 'approved',
      admin_notes: adminNotes,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

    if (error) {
      console.error('Error approving billboard:', error);
      throw new Error('Failed to approve billboard: ' + error.message);
    }

    // Log approval action for audit
    console.log(`Billboard ${id} approved by admin:`, {
      billboardId: id,
      adminNotes,
      timestamp: new Date().toISOString()
    });

  return data;
  } catch (error) {
    console.error('Billboard approval error:', error);
    throw error;
  }
};

export const rejectBillboard = async (id: string, rejectionReason: string): Promise<Billboard> => {
  try {
    const { data, error } = await supabase
      .from('billboards')
      .update({
        status: 'rejected',
        rejection_reason: rejectionReason,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to reject billboard:', error);
      throw error;
    }

    // Log rejection action for audit
    console.log(`Billboard ${id} rejected by admin:`, {
      billboardId: id,
      rejectionReason,
      timestamp: new Date().toISOString()
    });

    return data;
  } catch (error) {
    console.error('Failed to reject billboard:', error);
    throw error;
  }
};

// Notification functions
const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error'
): Promise<void> => {
  try {
    if (supabase) {
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type,
          is_read: false
        });
    }
    
    // Log notification for audit purposes
    console.log(`Notification created for user ${userId}:`, {
      title,
      message,
      type,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};
// Billboard assignment functions
export const assignBillboardToSubAdmin = async (
  billboardId: string,
  subAdminId: string,
  adminId: string,
  priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
  notes?: string
): Promise<{ success: boolean; error?: string; assignment_id?: string }> => {
  try {
    if (!supabase) {
      throw new Error('Database service not available');
    }

    const { data, error } = await supabase.rpc('assign_billboard_to_subadmin', {
      p_billboard_id: billboardId,
      p_sub_admin_id: subAdminId,
      p_admin_id: adminId,
      p_priority: priority,
      p_due_date: null,
      p_notes: notes
    });

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return data;
  } catch (error) {
    console.error('Error assigning billboard:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to assign billboard'
    };
  }
};

// Get assignments for a specific sub-admin
export const getSubAdminAssignments = async (subAdminId: string): Promise<any[]> => {
  try {
    if (!supabase) {
      console.warn('Database service not available');
      return [];
    }

    const { data, error } = await supabase
      .from('billboard_assignments')
      .select(`
        id,
        billboard_id, 
        assigned_at,
        status,
        priority,
        due_date,
        notes,
        completed_at,
        billboard:billboards(
          id,
          title,
          location_address,
          state,
          city,
          status,
          approved_at,
          owner:users!billboards_owner_id_fkey(name, email)
        )
      `)
      .eq('sub_admin_id', subAdminId)
      .eq('is_active', true)
      .order('assigned_at', { ascending: false });

    if (error) {
      console.warn('Error fetching sub-admin assignments:', error);
      return [];
    }

    // Transform data to match expected format
    return (data || []).map((assignment: any) => ({
      assignment_id: assignment.id,
      billboard_id: assignment.billboard_id,
      billboard_title: assignment.billboard?.title || 'Unknown Billboard',
      billboard_location: assignment.billboard?.location_address || 'Unknown Location',
      billboard_owner_name: assignment.billboard?.owner?.name || 'Unknown Owner',
      assignment_status: assignment.status,
      priority: assignment.priority,
      assigned_at: assignment.assigned_at,
      due_date: assignment.due_date,
      notes: assignment.notes,
      billboard: assignment.billboard
    }));
  } catch (error) {
    console.warn('Error getting sub-admin assignments:', error);
    return [];
  }
};