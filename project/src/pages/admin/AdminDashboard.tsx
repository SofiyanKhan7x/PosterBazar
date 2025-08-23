import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, IndianRupee, FileCheck,
  BarChart, Clipboard, MapPin, TrendingUp,
  Target, Shield, Monitor,
  AlertTriangle, Ruler, MessageSquare
} from 'lucide-react';
import { useAdminSecurity } from '../../hooks/useAdminSecurity';
import { getAdminDashboardStats } from '../../services/supabase';
import AdminSecurityMonitor from '../../components/AdminSecurityMonitor';

interface DashboardStats {
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

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, isConnected } = useAdminSecurity();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalRevenue: 0,
    pendingApprovals: 0,
    activeHoardings: 0,
    monthlyGrowth: 0,
    systemHealth: 0,
    recentApprovals: [],
    verificationStatus: {
      pendingVerification: 0,
      verifiedThisWeek: 0,
      rejectedThisWeek: 0,
      reverifications: 0
    },
    pendingKYC: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardStats();
    
    // Set up periodic refresh for data consistency
    const interval = setInterval(() => {
      loadDashboardStats();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Handle real-time notifications that affect dashboard
  useEffect(() => {
    const dashboardNotifications = notifications.filter(
      n => n.notification_type === 'user_deleted' || n.notification_type === 'dashboard_update'
    );
    
    if (dashboardNotifications.length > 0) {
      // Refresh dashboard data when users are deleted or updated
      loadDashboardStats();
    }
  }, [notifications]);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const dashboardStats = await getAdminDashboardStats();
      setStats(dashboardStats);
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
      
      // Use fallback demo data when Supabase is unavailable
      const fallbackStats: DashboardStats = {
        totalUsers: 156,
        totalRevenue: 523160,
        pendingApprovals: 8,
        activeHoardings: 42,
        monthlyGrowth: 15,
        systemHealth: 85,
        recentApprovals: [
          {
            id: '1',
            title: 'Prime Location Billboard - MG Road',
            status: 'pending',
            owner: { name: 'Rajesh Kumar' },
            location_address: 'MG Road, Bangalore'
          },
          {
            id: '2',
            title: 'Highway Billboard - NH4',
            status: 'approved',
            owner: { name: 'Priya Sharma' },
            location_address: 'NH4, Mumbai-Pune Highway'
          },
          {
            id: '3',
            title: 'City Center Display',
            status: 'rejected',
            owner: { name: 'Amit Singh' },
            location_address: 'Connaught Place, Delhi'
          }
        ],
        verificationStatus: {
          pendingVerification: 12,
          verifiedThisWeek: 5,
          rejectedThisWeek: 2,
          reverifications: 1
        },
        pendingKYC: 6
      };
      
      setStats(fallbackStats);
      setError('Using demo data - Database service unavailable');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

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

  return (
    <div className="space-y-8">
      {/* Security Monitor Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-gray-900 dark:text-white">Admin Security Monitor</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {isConnected ? 'Real-time Active' : 'Offline Mode'}
              </span>
            </div>
          </div>
          <AdminSecurityMonitor />
        </div>
      </div>
      
      {error && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
            <span className="text-yellow-800 dark:text-yellow-200">{error}</span>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <button 
          onClick={() => handleNavigate('/admin/users')}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg hover:scale-105 transition-all cursor-pointer text-left"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded-full">
              Active
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
        </button>

        <button 
          onClick={() => handleNavigate('/admin/revenue-breakdown')}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg hover:scale-105 transition-all cursor-pointer text-left"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
              <IndianRupee className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded-full">
              +{stats.monthlyGrowth}%
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{stats.totalRevenue.toLocaleString()}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
        </button>

        <button 
          onClick={() => handleNavigate('/admin/approvals')}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg hover:scale-105 transition-all cursor-pointer text-left"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
              <FileCheck className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/50 px-2 py-1 rounded-full">
              Urgent
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingApprovals}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Pending Approvals</p>
        </button>

        <button 
          onClick={() => handleNavigate('/admin/active-hoardings')}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg hover:scale-105 transition-all cursor-pointer text-left"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
              <MapPin className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded-full">
              Active
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeHoardings}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Active Hoardings</p>
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
              <TrendingUp className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded-full">
              +{stats.monthlyGrowth}%
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.monthlyGrowth}%</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Growth</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
              <Shield className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded-full">
              Healthy
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.systemHealth}%</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">System Health</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button 
                  onClick={() => handleNavigate('/admin/users')}
                  className="flex items-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-800/30 dark:hover:to-blue-700/30 transition-all border border-blue-200 dark:border-blue-800"
                >
                  <div className="p-3 bg-blue-600 dark:bg-blue-500 rounded-lg">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4 text-left">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Manage Users</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Handle user accounts and roles</p>
                  </div>
                </button>

                <button 
                  onClick={() => handleNavigate('/admin/sub-admins')}
                  className="flex items-center p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-xl hover:from-indigo-100 hover:to-indigo-200 dark:hover:from-indigo-800/30 dark:hover:to-indigo-700/30 transition-all border border-indigo-200 dark:border-indigo-800"
                >
                  <div className="p-3 bg-indigo-600 dark:bg-indigo-500 rounded-lg">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4 text-left">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Manage Sub-Admins</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Add and manage verification staff</p>
                  </div>
                </button>

                <button 
                  onClick={() => handleNavigate('/admin/testimonials')}
                  className="flex items-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl hover:from-orange-100 hover:to-orange-200 dark:hover:from-orange-800/30 dark:hover:to-orange-700/30 transition-all border border-orange-200 dark:border-orange-800"
                >
                  <div className="p-3 bg-orange-600 dark:bg-orange-500 rounded-lg">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4 text-left">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Testimonials</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Manage client testimonials</p>
                  </div>
                </button>

                <button 
                  onClick={() => handleNavigate('/admin/billboard-types')}
                  className="flex items-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl hover:from-purple-100 hover:to-purple-200 dark:hover:from-purple-800/30 dark:hover:to-purple-700/30 transition-all border border-purple-200 dark:border-purple-800"
                >
                  <div className="p-3 bg-purple-600 dark:bg-purple-500 rounded-lg">
                    <Monitor className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4 text-left">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Billboard Types</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Manage billboard categories</p>
                  </div>
                </button>

                <button 
                  onClick={() => handleNavigate('/admin/vendor-ads')}
                  className="flex items-center p-6 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 rounded-xl hover:from-teal-100 hover:to-teal-200 dark:hover:from-teal-800/30 dark:hover:to-teal-700/30 transition-all border border-teal-200 dark:border-teal-800"
                >
                  <div className="p-3 bg-teal-600 dark:bg-teal-500 rounded-lg">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4 text-left">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Vendor Ads</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Review vendor ad campaigns</p>
                  </div>
                </button>


                <button 
                  onClick={() => handleNavigate('/admin/billboard-size-fees')}
                  className="flex items-center p-6 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-xl hover:from-amber-100 hover:to-amber-200 dark:hover:from-amber-800/30 dark:hover:to-amber-700/30 transition-all border border-amber-200 dark:border-amber-800"
                >
                  <div className="p-3 bg-amber-600 dark:bg-amber-500 rounded-lg">
                    <Ruler className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4 text-left">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Size Fees</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Manage billboard joining fees</p>
                  </div>
                </button>

                <button 
                  onClick={() => handleNavigate('/admin/vendor-ad-pricing')}
                  className="flex items-center p-6 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 rounded-xl hover:from-pink-100 hover:to-pink-200 dark:hover:from-pink-800/30 dark:hover:to-pink-700/30 transition-all border border-pink-200 dark:border-pink-800"
                >
                  <div className="p-3 bg-pink-600 dark:bg-pink-500 rounded-lg">
                    <IndianRupee className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4 text-left">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Vendor Ad Pricing</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Set prices for ad types</p>
                  </div>
                </button>

                <button 
                  onClick={() => handleNavigate('/admin/revenue-breakdown')}
                  className="flex items-center p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl hover:from-green-100 hover:to-green-200 dark:hover:from-green-800/30 dark:hover:to-green-700/30 transition-all border border-green-200 dark:border-green-800"
                >
                  <div className="p-3 bg-green-600 dark:bg-green-500 rounded-lg">
                    <BarChart className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4 text-left">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Revenue Reports</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">View and export reports</p>
                  </div>
                </button>

                <button 
                  onClick={() => handleNavigate('/admin/approvals')}
                  className="flex items-center p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl hover:from-yellow-100 hover:to-yellow-200 dark:hover:from-yellow-800/30 dark:hover:to-yellow-700/30 transition-all border border-yellow-200 dark:border-yellow-800"
                >
                  <div className="p-3 bg-yellow-600 dark:bg-yellow-500 rounded-lg">
                    <FileCheck className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4 text-left">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Approvals</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Review pending requests</p>
                  </div>
                </button>

                <button 
                  onClick={() => handleNavigate('/admin/kyc-verification')}
                  className="flex items-center p-6 bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 rounded-xl hover:from-cyan-100 hover:to-cyan-200 dark:hover:from-cyan-800/30 dark:hover:to-cyan-700/30 transition-all border border-cyan-200 dark:border-cyan-800"
                >
                  <div className="p-3 bg-cyan-600 dark:bg-cyan-500 rounded-lg">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4 text-left">
                    <h3 className="font-semibold text-gray-900 dark:text-white">KYC Verification</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Review owner verifications</p>
                    {stats.pendingKYC > 0 && (
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400">
                          {stats.pendingKYC} pending
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Recent Approvals */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Approvals</h2>
                <button 
                  onClick={() => handleNavigate('/admin/approvals')}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                >
                  View All
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {stats.recentApprovals.length > 0 ? (
                  stats.recentApprovals.map(approval => (
                    <div key={approval.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                          <Clipboard className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{approval.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{approval.owner.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{approval.location_address}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        approval.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400' :
                        approval.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400' :
                        'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400'
                      }`}>
                        {approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Clipboard className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">No recent approvals</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-8">
          {/* Analytics Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Analytics</h2>
                <BarChart className="h-6 w-6 text-gray-400" />
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">User Growth</span>
                    <span className="text-green-600 dark:text-green-400 font-medium">+12%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div className="h-2 bg-gradient-to-r from-green-500 to-green-600 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Revenue</span>
                    <span className="text-blue-600 dark:text-blue-400 font-medium">+{stats.monthlyGrowth}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Approval Rate</span>
                    <span className="text-yellow-600 dark:text-yellow-400 font-medium">68%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div className="h-2 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full" style={{ width: '68%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
                