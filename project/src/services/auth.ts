import { supabase } from './supabase';
import { User } from './supabase';

interface LoginAttempt {
  email: string;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  failure_reason?: string;
  attempted_at: string;
}

interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  expires_at: string;
  ip_address?: string;
  user_agent?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthResponse {
  success: boolean;
  user?: User;
  session_token?: string;
  error?: string;
  account_locked?: boolean;
  lockout_expires?: string;
  account_inactive?: boolean;
}

export class AuthService {
  /**
   * Validate password complexity
   */
  static validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if account is locked
   */
  static async isAccountLocked(): Promise<{ locked: boolean; expiresAt?: Date }> {
    // Account lockout feature disabled - always return unlocked
    return { locked: false };
  }

  /**
   * Authenticate user with enhanced security
   */
  static async authenticateUser(
    email: string, 
    password: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthResponse> {
    try {
      // Special handling for sub-admin authentication
      if (email.includes('subadmin') || email.toLowerCase().includes('sub')) {
        return await this.authenticateSubAdmin(email, password, ipAddress, userAgent);
      }

      // Special handling for main admin
      if (email === 'PosterBazar@admin.com') {
        if (password !== 'PosterBazar@1020') {
          // Log failed login attempt
          try {
            await this.logLoginAttempt(email, ipAddress, userAgent, false, 'invalid_credentials');
          } catch (logError) {
            console.warn('Failed to log login attempt:', logError);
          }
          
          return {
            success: false,
            error: 'Invalid credentials. Please contact system administrator.'
          };
        }

        const mainAdminUser = {
          id: '11111111-1111-1111-1111-111111111111',
          email: 'PosterBazar@admin.com',
          name: 'PosterBazar Main Administrator',
          role: 'admin' as const,
          kyc_status: 'approved' as const,
          wallet_balance: 0,
          is_active: true,
          email_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          failed_login_attempts: 0,
          locked_until: undefined,
          password_changed_at: new Date().toISOString(),
          force_password_change: false
        };

        const sessionToken = `main_admin_session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
        
        // Log successful login
        try {
          await this.logLoginAttempt(email, ipAddress, userAgent, true);
        } catch (logError) {
          console.warn('Failed to log successful login:', logError);
        }

        return {
          success: true,
          user: mainAdminUser,
          session_token: sessionToken
        };
      }

      // Check if Supabase is properly configured
      if (!supabase) {
        return {
          success: false,
          error: 'Authentication service not available'
        };
      }

      // Check if user account was deleted
      try {
        // Check if user exists in users table (if not, they were deleted)
        const { data: existingUser, error: userCheckError } = await supabase
          .from('users')
          .select('id, is_active')
          .eq('email', email.toLowerCase().trim())
          .maybeSingle();

        if (userCheckError && userCheckError.code !== 'PGRST116') {
          console.warn('Error checking user existence:', userCheckError);
        }
        
        if (!existingUser) {
          return {
            success: false,
            error: 'Your account has been deleted by an administrator. Please contact support if you believe this is an error.'
          };
        }
      } catch (deletionCheckError) {
        console.warn('Could not check deletion status:', deletionCheckError);
        // Continue with normal authentication if deletion check fails
      }
      // Account lockout feature disabled - skip lockout check

      // Attempt authentication with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError || !authData.user) {
        // Log failed login attempt without lockout consequences
        try {
          await this.logLoginAttempt(email, ipAddress, userAgent, false, 'invalid_credentials');
        } catch (logError) {
          console.warn('Failed to log login attempt:', logError);
        }
        
        return {
          success: false,
          error: authError?.message || 'Invalid credentials'
        };
      }

      // Get user profile from users table
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select(`
          id, email, name, role, phone, profile_photo, kyc_status, 
          wallet_balance, is_active, email_verified, last_login, 
          created_at, updated_at, failed_login_attempts, locked_until,
          password_changed_at, force_password_change
        `)
        .eq('email', email)
        .single();

      if (profileError || !userProfile) {
        // Check if user was deleted after auth but before profile fetch
        if (profileError?.code === 'PGRST116') {
          return {
            success: false,
            error: 'Your account has been deleted by an administrator. Please contact support if you believe this is an error.'
          };
        }
        
        return {
          success: false,
          error: 'User profile not found or account is inactive'
        };
      }

      // Check if account is inactive
      if (!userProfile.is_active) {
        // Log failed login attempt for inactive account
        try {
          await this.logLoginAttempt(email, ipAddress, userAgent, false, 'account_inactive');
        } catch (logError) {
          console.warn('Failed to log inactive account login attempt:', logError);
        }
        
        return {
          success: false,
          error: 'Your account has been temporarily deactivated by an administrator. Please contact support for assistance.',
          account_inactive: true
        };
      }
      // Log successful login attempt
      try {
        await this.logLoginAttempt(email, ipAddress, userAgent, true);
      } catch (logError) {
        console.warn('Failed to log successful login:', logError);
      }

      // Create session
      let sessionToken: string;
      try {
        sessionToken = await this.createSession(userProfile.id, ipAddress, userAgent);
      } catch (sessionError) {
        console.warn('Failed to create session via RPC, using fallback:', sessionError);
        sessionToken = `fallback_session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      }

      return {
        success: true,
        user: userProfile,
        session_token: sessionToken
      };

    } catch (error) {
      console.error('Authentication error:', error);
      
      // Check for network/timeout errors
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        return {
          success: false,
          error: 'Unable to connect to authentication service. Please check your internet connection and try again.'
        };
      }
      
      if (error instanceof Error && (error.name === 'TimeoutError' || error.message.includes('timeout'))) {
        return {
          success: false,
          error: 'Authentication service is taking too long to respond. Please try again in a few moments.'
        };
      }
      
      return {
        success: false,
        error: 'Authentication service is currently unavailable. Please try again later.'
      };
    }
  }

  /**
   * Authenticate sub-admin users with enhanced security
   */
  private static async authenticateSubAdmin(
    email: string,
    password: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthResponse> {
    try {
      // Check for demo sub-admin first
      if (email === 'subadminbillboard@gmail.com') {
        if (password !== 'SubAdmin@123') {
          return {
            success: false,
            error: 'Invalid credentials. Please contact system administrator.'
          };
        }

        // Check if demo sub-admin is still active (simulate database check)
        const demoSubAdminActive = true; // In real app, this would check database
        
        if (!demoSubAdminActive) {
          return {
            success: false,
            error: 'Your sub-admin account has been deactivated by an administrator. Please contact support at support@posterbazar.com or +91 98765 43210 for assistance.',
            account_inactive: true
          };
        }

        const subAdminUser = {
          id: '55555555-5555-5555-5555-555555555555',
          email: 'subadminbillboard@gmail.com',
          name: 'Demo Sub Administrator',
          role: 'sub_admin' as const,
          kyc_status: 'approved' as const,
          wallet_balance: 0,
          is_active: true,
          email_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          failed_login_attempts: 0,
          locked_until: undefined,
          password_changed_at: new Date().toISOString(),
          force_password_change: false
        };

        const sessionToken = `subadmin_session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
        
        return {
          success: true,
          user: subAdminUser,
          session_token: sessionToken
        };
      }

      // For real sub-admin accounts, use database authentication
      if (!supabase) {
        return {
          success: false,
          error: 'Authentication service not available'
        };
      }

      // Call the sub-admin authentication function
      const { data, error } = await supabase.rpc('authenticate_subadmin', {
        p_email: email,
        p_password: password,
        p_ip_address: ipAddress || null,
        p_user_agent: userAgent || null
      });

      if (error) {
        console.error('Sub-admin authentication error:', error);
        return {
          success: false,
          error: 'Authentication service temporarily unavailable'
        };
      }

      if (!data.success) {
        return {
          success: false,
          error: data.error,
          account_inactive: data.account_inactive || false
        };
      }

      return {
        success: true,
        user: data.user,
        session_token: data.session_token
      };

    } catch (error) {
      console.error('Sub-admin authentication error:', error);
      return {
        success: false,
        error: 'Authentication service temporarily unavailable'
      };
    }
  }

  /**
   * Create secure subadmin account
   */
  static async createSubAdmin(
    adminId: string,
    subAdminData: {
      name: string;
      email: string;
      password: string;
      phone?: string;
    }
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      // Validate password
      const passwordValidation = this.validatePassword(subAdminData.password);
      if (!passwordValidation.valid) {
        return {
          success: false,
          error: passwordValidation.errors.join(', ')
        };
      }

      // Check if Supabase is available
      if (!supabase) {
        return {
          success: false,
          error: 'Database service not available'
        };
      }

      try {
        // Use secure server-side function to create sub-admin
        const { data, error } = await supabase.rpc('create_subadmin_account', {
          p_admin_id: adminId,
          p_name: subAdminData.name,
          p_email: subAdminData.email,
          p_password: subAdminData.password,
          p_phone: subAdminData.phone || null
        });

        if (error) {
          // If function doesn't exist, return specific error message
          if (error.code === 'PGRST202' || error.message?.includes('Could not find the function')) {
            return {
              success: false,
              error: 'Sub-admin creation function not deployed. Please contact system administrator to apply the required database migration.'
            };
          }
          
          return {
            success: false,
            error: error.message || 'Failed to create sub-admin account'
          };
        }

        if (!data.success) {
          return {
            success: false,
            error: data.error || 'Failed to create sub-admin account'
          };
        }

        return {
          success: true,
          user: data.user
        };

      } catch (rpcError: any) {
        // If RPC function doesn't exist, return specific error message
        if (rpcError.code === 'PGRST202' || rpcError.message?.includes('Could not find the function')) {
          return {
            success: false,
            error: 'Sub-admin creation function not deployed. Please contact system administrator to apply the required database migration.'
          };
        }
        throw rpcError;
      }

    } catch (error) {
      console.error('Error creating subadmin:', error);
      
      // Check for network/timeout errors
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        return {
          success: false,
          error: 'Unable to connect to the service. Please check your internet connection and try again.'
        };
      }
      
      if (error instanceof Error && (error.name === 'TimeoutError' || error.message.includes('timeout'))) {
        return {
          success: false,
          error: 'Service is taking too long to respond. Please try again in a few moments.'
        };
      }
      
      return {
        success: false,
        error: 'Service is currently unavailable. Please try again later.'
      };
    }
  }

  /**
   * Log login attempt for monitoring (without lockout consequences)
   */
  private static async logLoginAttempt(
    email: string,
    ipAddress?: string,
    userAgent?: string,
    success: boolean = false,
    failureReason?: string
  ): Promise<void> {
    try {
      // Simply log the attempt without any lockout logic
      await supabase
        .from('login_attempts')
        .insert({
          email: email.toLowerCase().trim(),
          ip_address: ipAddress || null,
          user_agent: userAgent || null,
          success: success,
          failure_reason: failureReason || null
        });
    } catch (error) {
      console.error('Error logging login attempt:', error);
    }
  }

  /**
   * Reset failed login attempts (legacy function - now no-op)
   */
  static async resetFailedAttempts(email: string): Promise<void> {
    try {
      // Reset failed attempts count for successful login
      await supabase
        .from('users')
        .update({
          failed_login_attempts: 0,
          locked_until: null
        })
        .eq('email', email);
    } catch (error) {
      console.error('Error resetting failed attempts:', error);
    }
  }

  /**
   * Create user session
   */
  static async createSession(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('create_user_session', {
        user_id: userId,
        ip_addr: ipAddress,
        user_agent_str: userAgent
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error creating session:', error);
      // Return a fallback session token
      return `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    }
  }

  /**
   * Validate session token
   */
  static async validateSession(token: string): Promise<string | null> {
    try {
      // Add timeout to prevent hanging requests
      const { data, error } = await supabase.rpc('validate_session', {
        token
      }).abortSignal(AbortSignal.timeout(30000));

      if (error) {
        console.warn('Error validating session (network/service issue):', error.message);
        return null;
      }

      return data;
    } catch (error) {
      // Handle network errors gracefully
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.warn('Network error during session validation - Supabase may be unavailable');
      } else if (error instanceof Error && error.name === 'TimeoutError') {
        console.warn('Session validation timed out - network or service issue');
      } else {
        console.warn('Error validating session:', error);
      }
      return null;
    }
  }

  /**
   * Logout user and invalidate session
   */
  static async logout(sessionToken?: string): Promise<void> {
    try {
      // Invalidate session in database
      if (sessionToken) {
        await supabase
          .from('user_sessions')
          .update({ is_active: false })
          .eq('session_token', sessionToken);
      }

      // Sign out from Supabase Auth
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  /**
   * Get user permissions
   */
  static async getUserPermissions(userId: string): Promise<string[]> {
    try {
      // Check if Supabase is available
      if (!supabase) {
        console.warn('Supabase client not available, returning empty permissions');
        return [];
      }

      // Add timeout to prevent hanging requests
      const { data, error } = await supabase
        .from('user_permissions')
        .select('permission_name')
        .eq('user_id', userId)
        .eq('is_active', true)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .abortSignal(AbortSignal.timeout(10000));

      if (error) {
        console.warn('Error fetching user permissions (network/service issue):', error.message);
        return [];
      }

      return data?.map((p: any) => p.permission_name) || [];
    } catch (error) {
      console.warn('Error getting user permissions (likely network timeout or Supabase unavailable):', error);
      return [];
    }
  }

  /**
   * Check if user has specific permission
   */
  static async hasPermission(userId: string, permission: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.includes(permission);
  }

  /**
   * Get login attempts for monitoring
   */
  static async getLoginAttempts(
    email?: string,
    limit: number = 50
  ): Promise<LoginAttempt[]> {
    try {
      let query = supabase
        .from('login_attempts')
        .select('*')
        .order('attempted_at', { ascending: false })
        .limit(limit);

      if (email) {
        query = query.eq('email', email);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching login attempts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting login attempts:', error);
      return [];
    }
  }

  /**
   * Get active sessions for user
   */
  static async getUserSessions(userId: string): Promise<UserSession[]> {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user sessions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting user sessions:', error);
      return [];
    }
  }

  /**
   * Force password change for user
   */
  static async forcePasswordChange(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ force_password_change: true })
        .eq('id', userId);

      if (error) {
        console.error('Error forcing password change:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error forcing password change:', error);
      return false;
    }
  }

  /**
   * Unlock user account
   */
  static async unlockAccount(email: string): Promise<boolean> {
    try {
      // This function is now essentially a no-op since lockout is disabled
      const { error } = await supabase
        .from('users')
        .update({
          locked_until: null,
          failed_login_attempts: 0
        })
        .eq('email', email);

      if (error) {
        console.error('Error unlocking account:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error unlocking account:', error);
      return false;
    }
  }
}