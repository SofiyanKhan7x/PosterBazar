import { supabase } from './supabase';

interface AdminLoginAttempt {
  id: string;
  admin_id?: string;
  email: string;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  failure_reason?: string;
  blocked_until?: string;
  attempt_count: number;
  attempted_at: string;
}

export interface AdminNotification {
  id: string;
  notification_type: 'user_deleted' | 'user_updated' | 'dashboard_update' | 'security_alert';
  source_admin_name: string;
  data: any;
  created_at: string;
}

interface RateLimitResult {
  allowed: boolean;
  reason?: 'rate_limited' | 'rate_limit_exceeded';
  blocked_until?: string;
  attempts_remaining: number;
}

export class AdminSecurityService {
  /**
   * Check if admin login is rate limited
   */
  static async checkRateLimit(
    email: string,
    ipAddress?: string
  ): Promise<RateLimitResult> {
    try {
      if (!supabase) {
        // Allow login if service unavailable (graceful degradation)
        return { allowed: true, attempts_remaining: 5 };
      }

      const { data, error } = await supabase.rpc('check_admin_rate_limit', {
        admin_email: email.toLowerCase().trim(),
        client_ip: ipAddress || null
      });

      if (error) {
        console.warn('Rate limit check failed, allowing login:', error);
        return { allowed: true, attempts_remaining: 5 };
      }

      return data;
    } catch (error) {
      console.warn('Rate limit service unavailable, allowing login:', error);
      return { allowed: true, attempts_remaining: 5 };
    }
  }

  /**
   * Log admin login attempt
   */
  static async logLoginAttempt(
    email: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
    failureReason?: string,
    sessionToken?: string
  ): Promise<void> {
    try {
      if (!supabase) {
        console.warn('Cannot log login attempt - service unavailable');
        return;
      }

      await supabase.rpc('log_admin_login_attempt', {
        admin_email: email.toLowerCase().trim(),
        client_ip: ipAddress || null,
        client_user_agent: userAgent || null,
        login_success: success,
        failure_reason: failureReason || null,
        session_token: sessionToken || null
      });
    } catch (error) {
      console.warn('Failed to log admin login attempt:', error);
    }
  }

  /**
   * Get real-time admin notifications
   */
  static async getAdminNotifications(
    adminId: string,
    limit: number = 50
  ): Promise<AdminNotification[]> {
    try {
      if (!supabase) {
        return [];
      }

      const { data, error } = await supabase.rpc('get_admin_notifications', {
        admin_id: adminId,
        limit_count: limit
      });

      if (error) {
        console.warn('Failed to fetch admin notifications:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.warn('Admin notifications service unavailable:', error);
      return [];
    }
  }

  /**
   * Mark notifications as processed
   */
  static async markNotificationsProcessed(notificationIds: string[]): Promise<void> {
    try {
      if (!supabase || notificationIds.length === 0) {
        return;
      }

      await supabase.rpc('mark_admin_notifications_processed', {
        notification_ids: notificationIds
      });
    } catch (error) {
      console.warn('Failed to mark notifications as processed:', error);
    }
  }

  /**
   * Subscribe to real-time admin notifications
   */
  static subscribeToAdminNotifications(
    adminId: string,
    onNotification: (notification: AdminNotification) => void
  ): (() => void) | null {
    try {
      if (!supabase) {
        return null;
      }

      const subscription = supabase
        .channel('admin_notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'admin_notifications',
            filter: `target_admin_id=eq.${adminId}`
          },
          (payload: any) => {
            console.log('Real-time admin notification:', payload);
            if (payload.new) {
              onNotification({
                id: payload.new.id,
                notification_type: payload.new.notification_type,
                source_admin_name: 'Admin',
                data: payload.new.data,
                created_at: payload.new.created_at
              });
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.warn('Failed to subscribe to admin notifications:', error);
      return null;
    }
  }

  /**
   * Get admin login history
   */
  static async getAdminLoginHistory(
    adminId?: string,
    limit: number = 100
  ): Promise<AdminLoginAttempt[]> {
    try {
      if (!supabase) {
        return [];
      }

      let query = supabase
        .from('admin_login_attempts')
        .select('*')
        .order('attempted_at', { ascending: false })
        .limit(limit);

      if (adminId) {
        query = query.eq('admin_id', adminId);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('Failed to fetch admin login history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.warn('Admin login history service unavailable:', error);
      return [];
    }
  }

  /**
   * Get admin audit logs
   */
  static async getAdminAuditLogs(
    adminId?: string,
    actionType?: string,
    limit: number = 100
  ): Promise<any[]> {
    try {
      if (!supabase) {
        return [];
      }

      let query = supabase
        .from('admin_audit_log')
        .select(`
          *,
          admin:users!admin_audit_log_admin_id_fkey(name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (adminId) {
        query = query.eq('admin_id', adminId);
      }

      if (actionType) {
        query = query.eq('action_type', actionType);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('Failed to fetch admin audit logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.warn('Admin audit logs service unavailable:', error);
      return [];
    }
  }

  /**
   * Secure user deletion with real-time notifications
   */
  static async secureDeleteUser(
    userIdToDelete: string,
    deletionReason?: string
  ): Promise<{
    success: boolean;
    message: string;
    deletedUser?: any;
    deletedRecords?: any;
    totalRecordsDeleted?: number;
    executionTimeMs?: number;
    error?: string;
  }> {
    try {
      if (!supabase) {
        throw new Error('Database service not available');
      }

      const { data, error } = await supabase.rpc('secure_delete_user_with_notifications', {
        user_id_to_delete: userIdToDelete,
        deletion_reason: deletionReason || 'Admin deletion via user management'
      });

      if (error) {
        return {
          success: false,
          message: error.message,
          error: error.code || 'DELETION_FAILED'
        };
      }

      return {
        success: true,
        message: data.message,
        deletedUser: data.deleted_user,
        deletedRecords: data.deleted_records,
        totalRecordsDeleted: data.total_records_deleted,
        executionTimeMs: data.execution_time_ms
      };
    } catch (error: any) {
      console.error('Secure user deletion error:', error);
      
      if (error.message?.includes('admin_required')) {
        return {
          success: false,
          message: 'Only administrators can delete users',
          error: 'INSUFFICIENT_PERMISSIONS'
        };
      }
      
      if (error.message?.includes('user_not_found')) {
        return {
          success: false,
          message: 'User not found or already deleted',
          error: 'USER_NOT_FOUND'
        };
      }
      
      if (error.message?.includes('cannot_delete_admin')) {
        return {
          success: false,
          message: 'Admin accounts cannot be deleted for security reasons',
          error: 'ADMIN_DELETION_FORBIDDEN'
        };
      }

      return {
        success: false,
        message: 'User deletion service temporarily unavailable',
        error: 'SERVICE_UNAVAILABLE'
      };
    }
  }

  /**
   * Get client IP address (browser-side approximation)
   */
  static async getClientIP(): Promise<string | null> {
    try {
      // In a real application, this would be handled server-side
      // For demo purposes, we'll use a placeholder
      return '127.0.0.1';
    } catch (error) {
      return null;
    }
  }

  /**
   * Get user agent string
   */
  static getUserAgent(): string {
    return navigator.userAgent;
  }
}