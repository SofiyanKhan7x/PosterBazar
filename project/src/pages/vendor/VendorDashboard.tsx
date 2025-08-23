import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
   TrendingUp, Eye, MousePointer, IndianRupee, 
   Bell, Target,
   Activity, CheckCircle, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { 
  getVendorDashboardStats, 
  getVendorNotifications,
  markNotificationAsRead 
} from '../../services/vendor';
import { VendorDashboardStats, VendorNotification } from '../../types/vendor';
import VendorPricingDisplay from '../../components/VendorPricingDisplay';

const VendorDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<VendorDashboardStats>({
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
  });
  const [notifications, setNotifications] = useState<VendorNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Load dashboard stats and notifications in parallel
      const [dashboardStats, vendorNotifications] = await Promise.all([
        getVendorDashboardStats(user.id),
        getVendorNotifications(user.id)
      ]);
      
      setStats(dashboardStats);
      setNotifications(vendorNotifications);
    } catch (err) {
      console.error('Error loading vendor dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: VendorNotification) => {
    if (!notification.is_read) {
      try {
        await markNotificationAsRead(notification.id);
        setNotifications(notifications.map(n => 
          n.id === notification.id ? { ...n, is_read: true } : n
        ));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400';
      case 'approved': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400';
      case 'completed': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-400';
      case 'paused': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-400';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'payment': return <IndianRupee className="h-5 w-5 text-blue-500" />;
      case 'campaign': return <Target className="h-5 w-5 text-purple-500" />;
      default: return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading vendor dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
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
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
              Total
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCampaigns}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Campaigns</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
              <Activity className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded-full">
              Live
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeCampaigns}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Active Campaigns</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
              <IndianRupee className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
              Spent
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{stats.totalSpent.toLocaleString()}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Spent</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
              <Eye className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
              Views
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalImpressions.toLocaleString()}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Impressions</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
              <MousePointer className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
              Clicks
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalClicks.toLocaleString()}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Clicks</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
              <TrendingUp className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
              CTR
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.averageCTR.toFixed(2)}%</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Average CTR</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Campaigns */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Campaigns</h2>
                <div className="flex space-x-3">
                  <button 
                    onClick={() => handleNavigate('/vendor/ad-workflow')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
                  >
                    Ad Workflow
                  </button>
                  <button 
                    onClick={() => handleNavigate('/vendor/campaigns')}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                  >
                    View All
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6">
              {stats.recentCampaigns.length === 0 ? (
                <div className="text-center py-12">
                  <Target className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No campaigns yet</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Create your first advertising campaign to start promoting your business.
                  </p>
                  <button 
                    onClick={() => handleNavigate('/vendor/campaigns/create')}
                    className="bg-blue-900 dark:bg-blue-700 text-white px-6 py-3 rounded-lg hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors"
                  >
                    Create Campaign
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {stats.recentCampaigns.map((campaign) => (
                    <div key={campaign.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <Target className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{campaign.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {campaign.start_date} - {campaign.end_date}
                          </p>
                          <div className="flex items-center mt-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              ₹{campaign.total_budget.toLocaleString()} • {campaign.total_days} days
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </span>
                        <button
                          onClick={() => handleNavigate(`/vendor/campaigns/${campaign.id}`)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-8">
          {/* Real-time Pricing Display */}
          <VendorPricingDisplay showNotifications={true} compact={true} />

          {/* Notifications */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Notifications</h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {notifications.filter(n => !n.is_read).length} unread
                </span>
              </div>
            </div>
            <div className="p-6">
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.slice(0, 5).map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        notification.is_read 
                          ? 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700' 
                          : 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800'
                      }`}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="ml-3 flex-1">
                          <p className={`text-sm font-medium ${
                            notification.is_read ? 'text-gray-900 dark:text-white' : 'text-blue-900 dark:text-blue-100'
                          }`}>
                            {notification.title}
                          </p>
                          <p className={`text-xs mt-1 ${
                            notification.is_read ? 'text-gray-600 dark:text-gray-400' : 'text-blue-700 dark:text-blue-300'
                          }`}>
                            {notification.message.length > 80 
                              ? `${notification.message.substring(0, 80)}...` 
                              : notification.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {new Date(notification.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                  {notifications.length > 5 && (
                    <button 
                      onClick={() => handleNavigate('/vendor/notifications')}
                      className="w-full text-center py-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm"
                    >
                      View all {notifications.length} notifications
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;