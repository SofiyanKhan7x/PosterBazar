import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
   MapPin, IndianRupee, Clock, BarChart, FileCheck, 
  AlertCircle, Plus, Upload, CreditCard, Wallet, FileText,
   TrendingUp, Users, Eye, Target, CheckCircle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getOwnerDashboardStats } from '../../services/supabase';

interface DashboardStats {
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
}

const OwnerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
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
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadDashboardStats();
      
      // Set up periodic refresh for real-time updates
      const interval = setInterval(() => {
        refreshDashboardStats();
      }, 30000); // Refresh every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      if (!user) return;
      
      const dashboardStats = await getOwnerDashboardStats();
      setStats(dashboardStats);
      setError(null);
      
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const refreshDashboardStats = async () => {
    try {
      setRefreshing(true);
      if (!user) return;
      
      const dashboardStats = await getOwnerDashboardStats();
      setStats(dashboardStats);
      setError(null);
      
    } catch (err) {
      console.error('Error refreshing dashboard stats:', err);
      // Don't show error for background refresh failures
    } finally {
      setRefreshing(false);
    }
  };
  const handleNavigate = (path: string) => {
    navigate(path);
  };

  // Check if user has added their first billboard after KYC approval
  const shouldShowKYCBanner = (stats.kycStatus === 'pending' || stats.kycStatus === 'rejected' || user?.kyc_status === 'rejected') || 
    (user?.kyc_status === 'approved' && stats.totalBillboards === 0);
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">{error}</h3>
        <button 
          onClick={loadDashboardStats}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* KYC Status Banner */}
      {shouldShowKYCBanner && (
        <div className={`rounded-xl p-6 ${
          stats.kycStatus === 'approved' || user?.kyc_status === 'approved'
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800'
            : 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800'
        }`}>
          <div className="flex items-start">
            <div className={`p-2 rounded-lg ${
              stats.kycStatus === 'approved' || user?.kyc_status === 'approved'
                ? 'bg-green-100 dark:bg-green-900/50'
                : stats.kycStatus === 'rejected' || user?.kyc_status === 'rejected'
                ? 'bg-red-100 dark:bg-red-900/50' 
                : 'bg-yellow-100 dark:bg-yellow-900/50'
            }`}>
              {stats.kycStatus === 'approved' || user?.kyc_status === 'approved' ? (
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              ) : (
                <AlertCircle className={`h-6 w-6 ${
                  stats.kycStatus === 'rejected' || user?.kyc_status === 'rejected'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-yellow-600 dark:text-yellow-400'
                }`} />
              )}
            </div>
            <div className="ml-4 flex-1">
              <h3 className={`text-lg font-semibold ${
                stats.kycStatus === 'approved' || user?.kyc_status === 'approved'
                  ? 'text-green-800 dark:text-green-200'
                  : stats.kycStatus === 'rejected' || user?.kyc_status === 'rejected'
                  ? 'text-red-800 dark:text-red-200'
                  : 'text-yellow-800 dark:text-yellow-200'
              }`}>
                {stats.kycStatus === 'approved' || user?.kyc_status === 'approved' ? 'KYC Verification Successful' :
                 stats.kycStatus === 'rejected' || user?.kyc_status === 'rejected' ? 'KYC Verification Rejected' : 'KYC Verification Pending'}
              </h3>
              <p className={`mt-1 ${
                stats.kycStatus === 'approved' || user?.kyc_status === 'approved'
                  ? 'text-green-700 dark:text-green-300'
                  : stats.kycStatus === 'rejected' || user?.kyc_status === 'rejected'
                  ? 'text-red-700 dark:text-red-300'
                  : 'text-yellow-700 dark:text-yellow-300'
              }`}>
                {stats.kycStatus === 'approved' || user?.kyc_status === 'approved'
                  ? 'Congratulations! Your KYC verification has been approved by our admin team. You can now add billboards and start earning revenue.'
                  : stats.kycStatus === 'rejected' || user?.kyc_status === 'rejected'
                  ? 'Your KYC verification was rejected. Please review the feedback and resubmit your documents.'
                  : 'Complete your KYC verification to start receiving payments and unlock all features.'
                }
              </p>
              {/* Show rejection notes if KYC was rejected */}
              {(stats.kycStatus === 'rejected' || user?.kyc_status === 'rejected') && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <h4 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">Admin Feedback:</h4>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {stats.rejectionNotes || user?.rejection_notes || 'Please ensure all documents are clear and valid. Contact support if you need assistance.'}
                  </p>
                </div>
              )}
              {(stats.kycStatus !== 'approved' && user?.kyc_status !== 'approved') && (
                <button 
                  onClick={() => handleNavigate('/owner/kyc-upload')}
                  className={`mt-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white ${
                    stats.kycStatus === 'rejected' || user?.kyc_status === 'rejected'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-yellow-600 hover:bg-yellow-700'
                  }`}
                >
                  {stats.kycStatus === 'rejected' || user?.kyc_status === 'rejected' ? 'Resubmit Documents' : 'Upload Documents'}
                </button>
              )}
              {(stats.kycStatus === 'approved' || user?.kyc_status === 'approved') && (
                <button 
                  onClick={() => handleNavigate('/billboard-upload')}
                  className="mt-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white bg-green-600 hover:bg-green-700"
                >
                  Add Your First Billboard
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 relative">
        {/* Refresh Indicator */}
        {refreshing && (
          <div className="absolute top-2 right-2 flex items-center text-blue-600 dark:text-blue-400 z-10">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-sm">Updating...</span>
          </div>
        )}
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
              Total
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalBillboards}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Hoardings</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
              <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
              Active
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeBookings}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Active Bookings</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
              <IndianRupee className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
              Total
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{stats.totalRevenue.toLocaleString()}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
              <Wallet className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
              Available
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{stats.walletBalance.toLocaleString()}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Wallet Balance</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
              <Eye className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
              Views
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalViews.toLocaleString()}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Views</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
              <FileCheck className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              stats.pendingApproval > 0 
                ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/50'
                : 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700'
            }`}>
              {stats.pendingApproval > 0 ? 'Pending' : 'None'}
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingApproval}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Pending Approvals</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Hoarding Management */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Hoarding Management</h2>
                <button 
                  onClick={() => handleNavigate('/billboard-upload')}
                  className="flex items-center bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 transition-all font-medium"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Hoarding
                </button>
                <button
                  onClick={refreshDashboardStats}
                  disabled={refreshing}
                  className="flex items-center bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all font-medium disabled:opacity-50"
                >
                  {refreshing ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                  ) : (
                    <TrendingUp className="h-4 w-4 mr-2" />
                  )}
                  Refresh Data
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button 
                  onClick={() => handleNavigate('/owner/kyc-upload')}
                  className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-600 transition-colors text-left"
                >
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                      <Upload className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white ml-3">Submit Documents</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Upload KYC and hoarding ownership documents</p>
                  <span className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">Upload Now →</span>
                </button>

                <button 
                  onClick={() => handleNavigate('/owner/location-management')}
                  className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-green-300 dark:hover:border-green-600 transition-colors text-left"
                >
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                      <MapPin className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white ml-3">Location Details</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Add GPS coordinates and map integration</p>
                  <span className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium">Manage Locations →</span>
                </button>

                <button 
                  onClick={() => handleNavigate('/owner/specification-management')}
                  className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-yellow-300 dark:hover:border-yellow-600 transition-colors text-left"
                >
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                      <FileText className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white ml-3">Specifications</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Update dimensions and technical details</p>
                  <span className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 font-medium">Edit Details →</span>
                </button>

                <button 
                  onClick={() => handleNavigate('/owner/pricing-management')}
                  className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-purple-300 dark:hover:border-purple-600 transition-colors text-left"
                >
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                      <IndianRupee className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white ml-3">Pricing</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Set rates and view GST breakdown</p>
                  <span className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium">Manage Pricing →</span>
                </button>
              </div>
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Bookings</h2>
                <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium">
                  View All
                </button>
              </div>
            </div>
            <div className="p-6">
              {stats.recentBookings.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No bookings yet</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {stats.totalBillboards === 0 
                      ? 'Add your first billboard to start receiving bookings.'
                      : 'Your billboards are ready for bookings. Promote them to attract advertisers.'}
                  </p>
                  <button 
                    onClick={() => handleNavigate(stats.totalBillboards === 0 ? '/billboard-upload' : '/explore')}
                    className="bg-blue-900 dark:bg-blue-700 text-white px-6 py-3 rounded-lg hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors"
                  >
                    {stats.totalBillboards === 0 ? 'Add Your First Billboard' : 'View Your Billboards'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {stats.recentBookings.map((booking: any, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                          <Users className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{booking.user?.name || 'Unknown User'}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{booking.billboard?.title || 'Unknown Billboard'}</p>
                          <div className="flex items-center mt-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                              </span>
                              {booking.status === 'active' && new Date(booking.end_date) > new Date() && (
                                <span className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-400 px-2 py-1 rounded-full">
                                  Booked till {new Date(booking.end_date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          booking.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400' :
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400' :
                          booking.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400' :
                          'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-8">
          {/* Performance Overview */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Performance</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Revenue Growth</span>
                  </div>
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    {stats.monthlyEarnings > 0 ? '+' : ''}
                    {stats.totalRevenue > 0 ? Math.round((stats.monthlyEarnings / stats.totalRevenue) * 100) : 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                      <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Occupancy Rate</span>
                  </div>
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {stats.totalBillboards > 0 ? Math.round((stats.activeBookings / stats.totalBillboards) * 100) : 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                      <BarChart className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Avg. Booking Value</span>
                  </div>
                  <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                    ₹{stats.totalBookings > 0 ? Math.round(stats.totalRevenue / stats.totalBookings).toLocaleString() : '0'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Wallet Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Wallet</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Available Balance</span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">₹{stats.walletBalance.toLocaleString()}</span>
                </div>
                <button 
                  disabled={stats.walletBalance <= 0}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 dark:from-green-500 dark:to-green-600 text-white py-3 rounded-lg hover:from-green-700 hover:to-green-800 dark:hover:from-green-600 dark:hover:to-green-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Withdraw Funds
                </button>
                <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  {stats.walletBalance > 0 ? 'Funds available for withdrawal' : 'No pending payouts'}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <button 
                  onClick={() => handleNavigate('/owner/kyc-upload')}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <span className="text-gray-900 dark:text-white font-medium">Upload KYC</span>
                  <FileCheck className="h-5 w-5 text-gray-400" />
                </button>
                <button className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <span className="text-gray-900 dark:text-white font-medium">Add Bank Account</span>
                  <CreditCard className="h-5 w-5 text-gray-400" />
                </button>
                <button className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <span className="text-gray-900 dark:text-white font-medium">View Analytics</span>
                  <BarChart className="h-5 w-5 text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Getting Started */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Getting Started</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <button 
                  onClick={() => handleNavigate('/owner/kyc-upload')}
                  className="w-full flex items-start p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors text-left"
                >
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      {user?.kyc_status === 'approved' ? 'KYC Verified' : 'Complete KYC verification'}
                    </p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
                      {user?.kyc_status === 'approved' ? 'You can now receive payments' : 'Required to receive payments'}
                    </p>
                  </div>
                </button>
                <button 
                  onClick={() => handleNavigate('/billboard-upload')}
                  className="w-full flex items-start p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-left"
                >
                  <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      {stats.totalBillboards === 0 ? 'Add your first billboard' : 'Add more billboards'}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                      {stats.totalBillboards === 0 ? 'Start earning from your properties' : 'Expand your billboard portfolio'}
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Billboard Button - Always Available */}
      <div className="mt-8 text-center">
        <button 
          onClick={() => handleNavigate('/billboard-upload')}
          className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 transition-all font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <Plus className="h-6 w-6 mr-3 inline" />
          Add New Billboard
        </button>
        <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">
          Expand your portfolio and increase your earning potential
        </p>
      </div>
    </div>
  );
};

export default OwnerDashboard;