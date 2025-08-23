import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  MapPin, CheckCircle, Clock, AlertTriangle, Camera, 
   FileCheck, Calendar, Activity, ArrowLeft, RefreshCw
} from 'lucide-react';
import { getSubAdminDashboardStats, getSubAdminAssignments } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';

interface DashboardStats {
  totalAssignedBillboards: number;
  pendingVerifications: number;
  completedVerifications: number;
  rejectedVerifications: number;
  thisMonthVisits: number;
  averageVerificationTime: number;
  assignedBillboards: {
    assignment_id: string;
    billboard_id: string;
    billboard_title: string;
    billboard_location: string;
    billboard_owner_name: string;
    assignment_status: string;
    priority: string;
    assigned_at: string;
    due_date: string;
    notes: string;
  }[];
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

const SubAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalAssignedBillboards: 0,
    pendingVerifications: 0,
    completedVerifications: 0,
    rejectedVerifications: 0,
    thisMonthVisits: 0,
    averageVerificationTime: 0,
    assignedBillboards: [],
    pendingBillboards: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadDashboardData();
      
      // Set up periodic refresh for real-time updates
      const interval = setInterval(() => {
        refreshDashboardData();
      }, 30000); // Refresh every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) return;
      
      console.log('🔄 Loading SubAdmin dashboard data for user:', user.id);
      
      // Load dashboard stats which now includes assigned billboards
      const dashboardStats = await getSubAdminDashboardStats(user.id);
      
      console.log('📊 Dashboard stats loaded:', dashboardStats);
      
      setStats({
        ...dashboardStats,
        assignedBillboards: [],
        pendingBillboards: dashboardStats.pendingBillboards
      });
      
    } catch (err) {
      console.error('❌ Dashboard data loading failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
      setError(errorMessage);
      
      // Show user-friendly error message based on error type
      if (errorMessage.includes('Sub-admin user not found')) {
        setError('Your sub-admin account could not be verified. Please contact support.');
      } else if (errorMessage.includes('inactive')) {
        setError('Your account has been deactivated. Please contact your administrator.');
      } else if (errorMessage.includes('Database service not available')) {
        setError('System temporarily unavailable. Please try again in a few moments.');
      } else {
        setError('Unable to load dashboard data. Please refresh the page or contact support if the issue persists.');
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshDashboardData = async () => {
    try {
      setRefreshing(true);
      if (!user) return;
      
      const dashboardStats = await getSubAdminDashboardStats(user.id);
      setStats({
        ...dashboardStats,
        assignedBillboards: [],
        pendingBillboards: dashboardStats.pendingBillboards
      });
      setError(null);
    } catch (err) {
      console.error('❌ Dashboard refresh failed:', err);
      // Don't show error for background refresh failures
    } finally {
      setRefreshing(false);
    }
  };

  const handleStartVerification = (billboardId: string) => {
    navigate(`/subadmin/verify/${billboardId}`);
  };

  const handleViewHistory = () => {
    navigate('/subadmin/history');
  };

  const handleViewAllSiteVisits = () => {
    navigate('/subadmin/site-visits');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link 
          to="/dashboard" 
          className="inline-flex items-center text-blue-900 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-8"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </Link>
        
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Loading verification dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link 
          to="/dashboard" 
          className="inline-flex items-center text-blue-900 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-8"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </Link>
        
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">{error}</h3>
          <button 
            onClick={loadDashboardData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <Link 
          to="/dashboard" 
          className="inline-flex items-center text-blue-900 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </Link>
        
        <div className="flex items-center space-x-4">
          {refreshing && (
            <div className="flex items-center text-blue-600 dark:text-blue-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              <span className="text-sm">Refreshing...</span>
            </div>
          )}
          <button
            onClick={refreshDashboardData}
            disabled={refreshing}
            className="flex items-center bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-800/70 text-blue-700 dark:text-blue-300 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>
      </div>
      
      <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
              Total
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalAssignedBillboards}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Assigned Billboards</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/50 px-2 py-1 rounded-full">
              Urgent
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingVerifications}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Pending Verifications</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded-full">
              Done
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completedVerifications}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <span className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 px-2 py-1 rounded-full">
              Issues
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.rejectedVerifications}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Rejected</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/50 px-2 py-1 rounded-full">
              Month
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.thisMonthVisits}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">This Month</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
              <Activity className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 px-2 py-1 rounded-full">
              Avg
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.averageVerificationTime}h</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Avg Time</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pending Verifications */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Pending Verifications</h2>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {stats.pendingBillboards.length} pending
                  </span>
                  <button 
                    onClick={handleViewAllSiteVisits}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                  >
                    View All
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6">
              {stats.pendingBillboards.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">All caught up!</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    No pending verifications at the moment. Great work!
                  </p>
                  <button 
                    onClick={handleViewHistory}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View History
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {stats.pendingBillboards.map((billboard) => (
                    <div key={billboard.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <MapPin className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 dark:text-white">{billboard.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{billboard.location_address}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-xs text-gray-500 dark:text-gray-400">Owner: {billboard.owner.name}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">~{billboard.distance || Math.floor(Math.random() * 50) + 5}km away</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(billboard.priority)}`}>
                            {billboard.priority}
                          </span>
                          <button
                            onClick={() => handleStartVerification(billboard.id)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                          >
                            <Camera className="h-4 w-4" />
                            <span>Start Verification</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
               
                <button
                  onClick={handleViewHistory}
                  className="w-full flex items-center space-x-3 p-3 text-left bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <FileCheck className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <span className="text-gray-900 dark:text-white">History</span>
                </button>
                <button
                  onClick={refreshDashboardData}
                  disabled={refreshing}
                  className="w-full flex items-center space-x-3 p-3 text-left bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-5 w-5 text-gray-600 dark:text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
                  <span className="text-gray-900 dark:text-white">Refresh Data</span>
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-start p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm text-green-800 dark:text-green-200">Verified billboard successfully</p>
                    <p className="text-xs text-green-600 dark:text-green-300 mt-1">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <Camera className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm text-blue-800 dark:text-blue-200">Started site visit</p>
                    <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">4 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">Requested re-verification</p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">1 day ago</p>
                  </div>
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

export default SubAdminDashboard;