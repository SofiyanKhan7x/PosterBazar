import React, { useState, useEffect } from 'react';
import { 
  Bell, CheckCircle, AlertTriangle, CreditCard,
  Eye, ExternalLink, Calendar, IndianRupee
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { VendorAdWorkflowService, VendorNotificationEnhanced } from '../services/vendorAdWorkflow';

interface VendorNotificationCenterProps {
  onPaymentRequired?: (adRequestId: string) => void;
}

const VendorNotificationCenter: React.FC<VendorNotificationCenterProps> = ({ onPaymentRequired }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<VendorNotificationEnhanced[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (user && (user.role === 'vendor' || user.role === 'user')) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const vendorNotifications = await VendorAdWorkflowService.getVendorNotifications(user.id);
      setNotifications(vendorNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: VendorNotificationEnhanced) => {
    if (!notification.is_read) {
      try {
        await VendorAdWorkflowService.markNotificationAsRead(notification.id);
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
        );
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Handle action required notifications
    if (notification.action_required && notification.action_url) {
      if (notification.notification_type === 'payment_required' && onPaymentRequired && notification.ad_request_id) {
        onPaymentRequired(notification.ad_request_id);
      } else {
        window.location.href = notification.action_url;
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ad_approved': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'ad_rejected': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'payment_required': return <CreditCard className="h-5 w-5 text-blue-500" />;
      case 'payment_confirmed': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'ad_live': return <Eye className="h-5 w-5 text-purple-500" />;
      case 'ad_completed': return <CheckCircle className="h-5 w-5 text-gray-500" />;
      case 'performance_alert': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default: return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'high': return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'normal': return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      default: return 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700';
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const displayNotifications = showAll ? notifications : notifications.slice(0, 5);

  if (!user || (user.role !== 'vendor' && user.role !== 'user')) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Bell className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Notifications
            </h2>
            {unreadCount > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          {notifications.length > 5 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
            >
              {showAll ? 'Show Less' : `View All (${notifications.length})`}
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No notifications</h3>
            <p className="text-gray-600 dark:text-gray-400">
              You'll receive notifications here when there are updates about your ad campaigns.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                  notification.is_read 
                    ? 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800' 
                    : getPriorityColor(notification.priority)
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.notification_type)}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-sm font-medium ${
                        notification.is_read ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white font-semibold'
                      }`}>
                        {notification.title}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {notification.action_required && (
                          <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400 text-xs px-2 py-1 rounded-full">
                            Action Required
                          </span>
                        )}
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(notification.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <p className={`text-sm mt-1 ${
                      notification.is_read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {notification.message}
                    </p>
                    
                    {notification.action_required && notification.action_text && (
                      <div className="mt-3">
                        <button className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium">
                          {notification.notification_type === 'payment_required' ? (
                            <CreditCard className="h-4 w-4 mr-1" />
                          ) : (
                            <ExternalLink className="h-4 w-4 mr-1" />
                          )}
                          {notification.action_text}
                        </button>
                      </div>
                    )}

                    {/* Metadata Display */}
                    {notification.metadata && Object.keys(notification.metadata).length > 0 && (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          {notification.metadata.total_budget && (
                            <div className="flex items-center">
                              <IndianRupee className="h-3 w-3 mr-1" />
                              <span>Budget: ₹{notification.metadata.total_budget.toLocaleString()}</span>
                            </div>
                          )}
                          {notification.metadata.campaign_duration && (
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              <span>Duration: {notification.metadata.campaign_duration} days</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorNotificationCenter;