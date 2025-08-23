import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, Activity,
  Bell, X, CheckCircle, User
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAdminSecurity } from '../hooks/useAdminSecurity';
import { AdminSecurityService } from '../services/adminSecurityService';
import { supabase } from '../services/supabase';

const AdminSecurityMonitor: React.FC = () => {
  const { user } = useAuth();
  const { notifications, unreadCount, isConnected, markNotificationsAsRead } = useAdminSecurity();
  const [showNotifications, setShowNotifications] = useState(false);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [showLoginHistory, setShowLoginHistory] = useState(false);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [showSystemHealth, setShowSystemHealth] = useState(false);

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadLoginHistory();
      loadSystemHealth();
    }
  }, [user]);

  const loadLoginHistory = async () => {
    if (!user) return;
    
    try {
      const history = await AdminSecurityService.getAdminLoginHistory(user.id, 10);
      setLoginHistory(history);
    } catch (error) {
      console.error('Error loading login history:', error);
    }
  };

  const loadSystemHealth = async () => {
    if (!user || !supabase) return;
    
    try {
      // Check assignment health
      const { data: healthData, error } = await supabase.rpc('check_assignment_health');
      
      if (error) {
        console.warn('System health check failed:', error);
        return;
      }
      
      setSystemHealth(healthData?.[0] || null);
    } catch (error) {
      console.error('Error loading system health:', error);
    }
  };

  const handleRunDiagnostics = async () => {
    if (!user || !supabase) return;
    
    try {
      // Run assignment integrity validation
      const { data: integrityData, error } = await supabase.rpc('validate_assignment_integrity');
      
      if (error) {
        console.error('Integrity check failed:', error);
        return;
      }
      
      console.log('🔍 System Integrity Report:', integrityData);
      
      if (integrityData && integrityData.length > 0) {
        alert(`System Issues Found:\n${integrityData.map((issue: any) => 
          `• ${issue.issue_description}: ${issue.affected_count} records\n  Action: ${issue.suggested_action}`
        ).join('\n\n')}`);
      } else {
        alert('✅ System integrity check passed - no issues found');
      }
    } catch (error) {
      console.error('Error running diagnostics:', error);
      alert('Failed to run system diagnostics');
    }
  };

  const handleMarkAllAsRead = async () => {
    const notificationIds = notifications.map(n => n.id);
    await markNotificationsAsRead(notificationIds);
    setShowNotifications(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'user_deleted': return <User className="h-4 w-4 text-red-500" />;
      case 'user_updated': return <User className="h-4 w-4 text-blue-500" />;
      case 'security_alert': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLoginStatusColor = (success: boolean) => {
    return success 
      ? 'text-green-600 dark:text-green-400' 
      : 'text-red-600 dark:text-red-400';
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="relative">
      {/* Security Status Indicator */}
      <div className="flex items-center space-x-4">
        {/* Connection Status */}
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
          }`}></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>

        {/* System Health Indicator */}
        {systemHealth && (
          <button
            onClick={() => setShowSystemHealth(!showSystemHealth)}
            className="flex items-center space-x-1 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="System health status"
          >
            <div className={`w-2 h-2 rounded-full ${
              systemHealth.orphaned_assignments > 0 || systemHealth.inactive_subadmin_assignments > 0
                ? 'bg-yellow-500' 
                : 'bg-green-500'
            }`}></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {systemHealth.active_assignments} Active
            </span>
          </button>
        )}

        {/* Diagnostics Button */}
        <button
          onClick={handleRunDiagnostics}
          className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50 hover:bg-purple-200 dark:hover:bg-purple-800/70 transition-colors"
          title="Run system diagnostics"
        >
          <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </button>

        {/* Login History Button */}
        <button
          onClick={() => setShowLoginHistory(!showLoginHistory)}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          title="View login history"
        >
          <Activity className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>

        {/* Notifications Button */}
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-800/70 transition-colors"
          title="Admin notifications"
        >
          <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </button>
      </div>

      {/* System Health Dropdown */}
      {showSystemHealth && systemHealth && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 dark:text-white">System Health</h3>
            <button
              onClick={() => setShowSystemHealth(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Assignments:</span>
                <span className="font-medium text-gray-900 dark:text-white">{systemHealth.total_assignments}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Active Assignments:</span>
                <span className="font-medium text-green-600 dark:text-green-400">{systemHealth.active_assignments}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Pending Assignments:</span>
                <span className="font-medium text-yellow-600 dark:text-yellow-400">{systemHealth.pending_assignments}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">SubAdmins with Work:</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">{systemHealth.subadmins_with_assignments}</span>
              </div>
              {systemHealth.orphaned_assignments > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-red-600 dark:text-red-400">Orphaned Assignments:</span>
                  <span className="font-medium text-red-600 dark:text-red-400">{systemHealth.orphaned_assignments}</span>
                </div>
              )}
              {systemHealth.inactive_subadmin_assignments > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-orange-600 dark:text-orange-400">Inactive SubAdmin Assignments:</span>
                  <span className="font-medium text-orange-600 dark:text-orange-400">{systemHealth.inactive_subadmin_assignments}</span>
                </div>
              )}
            </div>
            
            <button
              onClick={handleRunDiagnostics}
              className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-sm transition-colors"
            >
              Run Full Diagnostics
            </button>
          </div>
        </div>
      )}

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 dark:text-white">Admin Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setShowNotifications(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div key={notification.id} className="p-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <div className="flex items-start space-x-3">
                    {getNotificationIcon(notification.notification_type)}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {notification.notification_type === 'user_deleted' && 
                          `User "${notification.data.deleted_user_name}" deleted`}
                        {notification.notification_type === 'user_updated' && 
                          `User "${notification.data.user_name}" updated`}
                        {notification.notification_type === 'security_alert' && 
                          'Security Alert'}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        By {notification.source_admin_name} • {new Date(notification.created_at).toLocaleTimeString()}
                      </p>
                      {notification.data.total_records_deleted && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {notification.data.total_records_deleted} records removed
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Login History Dropdown */}
      {showLoginHistory && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 dark:text-white">Recent Login Activity</h3>
            <button
              onClick={() => setShowLoginHistory(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {loginHistory.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No login history available
              </div>
            ) : (
              loginHistory.map((attempt) => (
                <div key={attempt.id} className="p-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-1 rounded-full ${
                        attempt.success ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'
                      }`}>
                        {attempt.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${getLoginStatusColor(attempt.success)}`}>
                          {attempt.success ? 'Successful Login' : 'Failed Login'}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {new Date(attempt.attempted_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {attempt.ip_address || 'Unknown IP'}
                      </p>
                      {attempt.failure_reason && (
                        <p className="text-xs text-red-600 dark:text-red-400">
                          {attempt.failure_reason}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSecurityMonitor;