import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { supabase, User } from '../services/supabase';
import { AuthService } from '../services/auth';
import { AdminSecurityService } from '../services/adminSecurityService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  sessionToken: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string, role: 'user' | 'owner' | 'vendor', phone?: string) => Promise<boolean>;
  createSubAdmin: (userId: string, subAdminData: { name: string; email: string; password: string; phone?: string }) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const savedUser = localStorage.getItem('billboardhub_user');
    const savedToken = localStorage.getItem('billboardhub_session');
    
    if (savedUser && savedToken) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setSessionToken(savedToken);
        
        // Validate session token
        AuthService.validateSession(savedToken)
          .then(userId => {
            if (!userId || userId !== parsedUser.id) {
              // Session invalid, clear auth state
              handleLogout();
            }
          })
          .catch(error => {
            // Check if it's a network error and user is a demo account
            const isDemoUser = parsedUser.email && (
              parsedUser.email.includes('@demo.com') ||
              parsedUser.email === 'adminbillboard@gmail.com' ||
              parsedUser.email === 'subadminbillboard@gmail.com'
            );
            
            const isNetworkError = error instanceof TypeError && 
              error.message.includes('Failed to fetch');
            
            if (isNetworkError && isDemoUser) {
              // Keep demo users logged in during network issues
              console.warn('Network error during session validation for demo user, maintaining session');
            } else {
              // For non-demo users or non-network errors, logout
              console.error('Session validation failed:', error);
              handleLogout();
            }
          });
      } catch (error) {
        console.error('Error parsing saved user:', error);
        handleLogout();
      }
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    setUser(null);
    setSessionToken(null);
    localStorage.removeItem('billboardhub_user');
    localStorage.removeItem('billboardhub_session');
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Get client info for security logging
      const ipAddress = await AdminSecurityService.getClientIP();
      const userAgent = AdminSecurityService.getUserAgent();
      
      // Check rate limiting for admin accounts
      if (email.includes('admin')) {
        const rateLimitResult = await AdminSecurityService.checkRateLimit(email, ipAddress || undefined);
        
        if (!rateLimitResult.allowed) {
          const blockedUntil = rateLimitResult.blocked_until 
            ? new Date(rateLimitResult.blocked_until).toLocaleTimeString()
            : 'temporarily';
          
          throw new Error(`Too many login attempts. Account blocked until ${blockedUntil}. Please try again later.`);
        }
      }
      
      // Check for demo accounts first
      const isAdminAccount = email === 'adminbillboard@gmail.com' || email === 'newadmin@example.com';
      const isMainAdminAccount = email === 'PosterBazar@admin.com';
      
      if (isAdminAccount || isMainAdminAccount) {
        // Admin authentication
        if (email === 'PosterBazar@admin.com' && password !== 'PosterBazar@1020') {
          // Log failed attempt
          await AdminSecurityService.logLoginAttempt(
            email, false, ipAddress || undefined, userAgent, 'invalid_password'
          );
          throw new Error('Invalid credentials. Please contact system administrator.');
        } else if (email === 'adminbillboard@gmail.com' && password !== 'Admin@billboard') {
          // Log failed attempt
          await AdminSecurityService.logLoginAttempt(
            email, false, ipAddress || undefined, userAgent, 'invalid_password'
          );
          throw new Error('Invalid credentials. Please contact system administrator.');
        } else if (email === 'newadmin@example.com' && password !== 'NewAdmin@123') {
          // Log failed attempt
          await AdminSecurityService.logLoginAttempt(
            email, false, ipAddress || undefined, userAgent, 'invalid_password'
          );
          throw new Error('Invalid credentials. Please contact system administrator.');
        }

        const adminUser = {
          id: '44444444-4444-4444-4444-444444444444',
          email: email === 'PosterBazar@admin.com' ? 'PosterBazar@admin.com' : 'adminbillboard@gmail.com',
          name: email === 'PosterBazar@admin.com' ? 'PosterBazar Main Administrator' : 'System Administrator',
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

        const adminSessionToken = `admin_session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
        
        // Log successful admin login
        await AdminSecurityService.logLoginAttempt(
          email, true, ipAddress || undefined, userAgent, undefined, adminSessionToken
        );
        
        setUser(adminUser);
        setSessionToken(adminSessionToken);
        localStorage.setItem('billboardhub_user', JSON.stringify(adminUser));
        localStorage.setItem('billboardhub_session', adminSessionToken);
        
        return true;
      }
      
      // Use real authentication with Supabase for non-demo accounts
      const authResult = await AuthService.authenticateUser(
        email, 
        password,
        ipAddress || undefined,
        userAgent
      );

      if (authResult.success && authResult.user) {
        // Log successful login
        await AdminSecurityService.logLoginAttempt(
          email, true, ipAddress || undefined, userAgent, undefined, authResult.session_token
        );
        
        setUser(authResult.user);
        setSessionToken(authResult.session_token || '');
        localStorage.setItem('billboardhub_user', JSON.stringify(authResult.user));
        localStorage.setItem('billboardhub_session', authResult.session_token || '');
        return true;
      } else {
        // Log failed login
        await AdminSecurityService.logLoginAttempt(
          email, false, ipAddress || undefined, userAgent, authResult.error || 'authentication_failed'
        );
        
        // Handle specific error types with appropriate messages
        if (authResult.account_inactive) {
          throw new Error('Your account has been temporarily deactivated by an administrator. Please contact support at support@posterbazar.com or +91 98765 43210 for assistance.');
        }
        
        throw new Error(authResult.error || 'Authentication failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };


  const createSubAdmin = async (userId: string, subAdminData: { 
    name: string; 
    email: string; 
    password: string; 
    phone?: string 
  }): Promise<boolean> => {
    try {
      if (!user || user.role !== 'admin') {
        throw new Error('Only administrators can create subadmin accounts');
      }

      setLoading(true);
      
      const result = await AuthService.createSubAdmin(userId, subAdminData);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create subadmin account');
      }
      
      return true;
    } catch (error) {
      console.error('Create subadmin error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Use enhanced logout service
      await AuthService.logout(sessionToken || undefined);
      
      handleLogout();
      
      // Clear browser history to prevent going back to dashboard
      window.history.replaceState(null, '', '/');
      
      // Prevent browser back navigation to protected routes
      const preventBack = () => {
        window.history.pushState(null, '', '/');
      };
      
      window.addEventListener('popstate', preventBack);
      
      // Clean up the event listener after a short delay
      setTimeout(() => {
        window.removeEventListener('popstate', preventBack);
      }, 1000);
      
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if service call fails
      handleLogout();
    }
  };

  const register = async (name: string, email: string, password: string, role: 'user' | 'owner' | 'vendor', phone?: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Validate password complexity
      const passwordValidation = AuthService.validatePassword(password);
      if (!passwordValidation.valid) {
        throw new Error(passwordValidation.errors.join(', '));
      }
      
      // Try real registration with Supabase first
      try {
        // Check if Supabase is available
        if (!supabase) {
          throw new Error('Database service is not available');
        }

        // Check if user already exists
        const { data: existingUsers, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('email', email);

        if (checkError) {
          console.error('Database error:', checkError);
          throw new Error('Database connection failed');
        }

        if (existingUsers && existingUsers.length > 0) {
          throw new Error('An account with this email already exists');
        }

        // Create user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard?verified=true`,
            data: {
              name,
              role,
              email_verified: true // Allow immediate login for development
            }
          }
        });

        if (authError || !authData.user) {
          console.error('Auth signup error:', authError);
          throw new Error(authError?.message || 'Failed to create account');
        }

        // Create user profile in users table
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email,
            name,
            phone: phone || null,
            role,
            kyc_status: 'pending',
            wallet_balance: 0.00,
            is_active: true,
            email_verified: true, // Allow immediate login for development
            failed_login_attempts: 0,
            force_password_change: false,
            password_changed_at: new Date().toISOString()
          })
          .select(`
            id, email, name, role, phone, profile_photo, kyc_status, 
            wallet_balance, is_active, email_verified, last_login, 
            created_at, updated_at, failed_login_attempts, locked_until,
            password_changed_at, force_password_change
          `)
          .single();

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Clean up auth user if profile creation failed
          try {
            await supabase.auth.admin.deleteUser(authData.user.id);
          } catch (cleanupError) {
            console.warn('Failed to cleanup auth user:', cleanupError);
          }
          throw new Error('Failed to create user profile');
        }

        // Auto-login the user with fallback session creation
        try {
          const sessionToken = await AuthService.createSession(userProfile.id);
          setUser(userProfile);
          setSessionToken(sessionToken);
          localStorage.setItem('billboardhub_user', JSON.stringify(userProfile));
          localStorage.setItem('billboardhub_session', sessionToken);
        } catch (sessionError) {
          console.warn('Failed to create session, using fallback:', sessionError);
          const fallbackToken = `fallback_session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
          setUser(userProfile);
          setSessionToken(fallbackToken);
          localStorage.setItem('billboardhub_user', JSON.stringify(userProfile));
          localStorage.setItem('billboardhub_session', fallbackToken);
        }
        
        return true;
      } catch (supabaseError) {
        // Registration requires working database connection
        console.error('Registration failed - database connection required:', supabaseError);
        throw new Error('Registration service unavailable. Please try again later.');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    sessionToken,
    login,
    logout,
    register,
    createSubAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};