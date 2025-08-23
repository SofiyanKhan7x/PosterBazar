import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { AdminSecurityService, AdminNotification } from '../services/adminSecurityService';
import { supabase } from '../services/supabase';

export const useAdminSecurity = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [systemHealth, setSystemHealth] = useState<any>(null);

  // Load initial notifications
  useEffect(() => {
    if (user && user.role === 'admin') {
      loadNotifications();
      setupRealTimeSubscription();
      loadSystemHealth();
    }
  }, [user]);

  const loadNotifications = useCallback(async () => {
    if (!user || user.role !== 'admin') return;

    try {
      const adminNotifications = await AdminSecurityService.getAdminNotifications(user.id);
      setNotifications(adminNotifications);
      setUnreadCount(adminNotifications.length);
    } catch (error) {
      console.error('Error loading admin notifications:', error);
    }
  }, [user]);

  const loadSystemHealth = useCallback(async () => {
    if (!user || user.role !== 'admin' || !supabase) return;

    try {
      const { data: healthData, error } = await supabase.rpc('check_assignment_health');
      
      if (error) {
        console.warn('System health check failed:', error);
        return;
      }
      
      setSystemHealth(healthData?.[0] || null);
    } catch (error) {
      console.error('Error loading system health:', error);
    }
  }, [user]);

  const setupRealTimeSubscription = useCallback(() => {
    if (!user || user.role !== 'admin') return;

    const unsubscribe = AdminSecurityService.subscribeToAdminNotifications(
      user.id,
      (notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        setIsConnected(true);

        // Handle specific notification types
        if (notification.notification_type === 'user_deleted') {
          // Trigger user list refresh in components that need it
          window.dispatchEvent(new CustomEvent('admin:user_deleted', {
            detail: notification.data
          }));
        }
        
        // Refresh system health when assignments change
        if (notification.notification_type === 'dashboard_update') {
          loadSystemHealth();
        }
      }
    );

    if (unsubscribe) {
      setIsConnected(true);
      return unsubscribe;
    } else {
      setIsConnected(false);
    }
  }, [user]);

  const markNotificationsAsRead = useCallback(async (notificationIds: string[]) => {
    try {
      await AdminSecurityService.markNotificationsProcessed(notificationIds);
      setNotifications(prev => 
        prev.filter(n => !notificationIds.includes(n.id))
      );
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  }, []);

  const clearAllNotifications = useCallback(async () => {
    const notificationIds = notifications.map(n => n.id);
    await markNotificationsAsRead(notificationIds);
  }, [notifications, markNotificationsAsRead]);

  const runSystemDiagnostics = useCallback(async () => {
    if (!user || user.role !== 'admin' || !supabase) return null;

    try {
      const { data: integrityData, error } = await supabase.rpc('validate_assignment_integrity');
      
      if (error) {
        console.error('Integrity check failed:', error);
        return null;
      }
      
      return integrityData || [];
    } catch (error) {
      console.error('Error running system diagnostics:', error);
      return null;
    }
  }, [user]);

  return {
    notifications,
    unreadCount,
    isConnected,
    systemHealth,
    loadNotifications,
    markNotificationsAsRead,
    clearAllNotifications,
    runSystemDiagnostics,
    refreshSystemHealth: loadSystemHealth
  };
};