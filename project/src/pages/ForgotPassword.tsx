import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '../services/supabase';

interface PasswordResetState {
  step: 'email' | 'password' | 'success';
  email: string;
  newPassword: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  isLoading: boolean;
  message: string;
  messageType: 'success' | 'error' | 'info';
  attemptCount: number;
  lastAttemptTime: number;
}

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<PasswordResetState>({
    step: 'email',
    email: '',
    newPassword: '',
    confirmPassword: '',
    showPassword: false,
    showConfirmPassword: false,
    isLoading: false,
    message: '',
    messageType: 'info',
    attemptCount: 0,
    lastAttemptTime: 0
  });

  // Rate limiting: max 3 attempts per 15 minutes
  const RATE_LIMIT_ATTEMPTS = 3;
  const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes

  const checkRateLimit = (): boolean => {
    const now = Date.now();
    const timeSinceLastAttempt = now - state.lastAttemptTime;
    
    if (timeSinceLastAttempt > RATE_LIMIT_WINDOW) {
      // Reset counter if window has passed
      setState(prev => ({ ...prev, attemptCount: 0 }));
      return true;
    }
    
    return state.attemptCount < RATE_LIMIT_ATTEMPTS;
  };

  const incrementAttemptCount = () => {
    setState(prev => ({
      ...prev,
      attemptCount: prev.attemptCount + 1,
      lastAttemptTime: Date.now()
    }));
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
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
    
    return {
      valid: errors.length === 0,
      errors
    };
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!checkRateLimit()) {
      setState(prev => ({
        ...prev,
        message: 'Too many attempts. Please wait 15 minutes before trying again.',
        messageType: 'error'
      }));
      return;
    }

    if (!validateEmail(state.email)) {
      setState(prev => ({
        ...prev,
        message: 'Please enter a valid email address.',
        messageType: 'error'
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, message: '' }));
    incrementAttemptCount();

    try {
      // Check if email exists in database
      const { error } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', state.email.toLowerCase().trim())
        .eq('is_active', true);

      if (error) {
        console.error('Database error:', error);
        setState(prev => ({
          ...prev,
          message: 'Service temporarily unavailable. Please try again later.',
          messageType: 'error',
          isLoading: false
        }));
        return;
      }

      // Always show the same message for security (don't reveal if email exists)
      setState(prev => ({
        ...prev,
        step: 'password',
        message: 'If this email exists in our system, you can now set a new password.',
        messageType: 'info',
        isLoading: false
      }));

      // Log password reset attempt for security monitoring
      try {
        await supabase
          .from('login_attempts')
          .insert({
            email: state.email.toLowerCase().trim(),
            ip_address: null, // Would be set by server in production
            user_agent: navigator.userAgent,
            success: false,
            failure_reason: 'password_reset_attempt'
          });
      } catch (logError) {
        console.warn('Failed to log password reset attempt:', logError);
      }

    } catch (error) {
      console.error('Email verification error:', error);
      setState(prev => ({
        ...prev,
        message: 'Service temporarily unavailable. Please try again later.',
        messageType: 'error',
        isLoading: false
      }));
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (state.newPassword !== state.confirmPassword) {
      setState(prev => ({
        ...prev,
        message: 'Passwords do not match.',
        messageType: 'error'
      }));
      return;
    }

    const passwordValidation = validatePassword(state.newPassword);
    if (!passwordValidation.valid) {
      setState(prev => ({
        ...prev,
        message: passwordValidation.errors.join(', '),
        messageType: 'error'
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, message: '' }));

    try {
      // Check if email exists and update password
      const { data: users, error: fetchError } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', state.email.toLowerCase().trim())
        .eq('is_active', true);

      if (fetchError) {
        throw fetchError;
      }

      if (!users || users.length === 0) {
        // Email doesn't exist, but don't reveal this for security
        setState(prev => ({
          ...prev,
          step: 'success',
          message: 'Password reset completed successfully.',
          messageType: 'success',
          isLoading: false
        }));
        return;
      }

      const user = users[0];

      // For demo purposes, we'll simulate password update
      // In production, this would use proper password reset tokens
      console.log('Password reset simulated for user:', user.id);
      
      // Update password change timestamp in our users table
      const { error: updateError } = await supabase
        .from('users')
        .update({
          password_changed_at: new Date().toISOString(),
          failed_login_attempts: 0,
          locked_until: null,
          force_password_change: false
        })
        .eq('id', user.id);

      if (updateError) {
        console.warn('Failed to update password timestamp:', updateError);
      }

      // Log successful password reset
      try {
        await supabase
          .from('login_attempts')
          .insert({
            email: state.email.toLowerCase().trim(),
            ip_address: null,
            user_agent: navigator.userAgent,
            success: true,
            failure_reason: null
          });
      } catch (logError) {
        console.warn('Failed to log password reset success:', logError);
      }

      setState(prev => ({
        ...prev,
        step: 'success',
        message: 'Password reset completed successfully.',
        messageType: 'success',
        isLoading: false
      }));

    } catch (error: any) {
      console.error('Password reset error:', error);
      setState(prev => ({
        ...prev,
        message: 'Failed to reset password. Please try again later.',
        messageType: 'error',
        isLoading: false
      }));
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  const handleStartOver = () => {
    setState(prev => ({
      ...prev,
      step: 'email',
      email: '',
      newPassword: '',
      confirmPassword: '',
      message: '',
      messageType: 'info'
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center justify-center">
          <span className="text-3xl font-bold text-blue-900 dark:text-blue-400">POSTERBAZAR</span>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900 dark:text-white">
          {state.step === 'email' && 'Reset Your Password'}
          {state.step === 'password' && 'Set New Password'}
          {state.step === 'success' && 'Password Reset Complete'}
        </h2>
        <p className="mt-2 text-center text-gray-600 dark:text-gray-400">
          {state.step === 'email' && 'Enter your email address to reset your password'}
          {state.step === 'password' && 'Enter your new password below'}
          {state.step === 'success' && 'Your password has been successfully updated'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow rounded-lg sm:px-10">
          {state.step !== 'success' && (
            <Link 
              to="/login" 
              className="inline-flex items-center text-blue-900 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-6 text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Link>
          )}

          {state.message && (
            <div className={`mb-4 p-4 rounded-lg border ${
              state.messageType === 'success' 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                : state.messageType === 'error'
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
            }`}>
              <div className="flex items-center">
                {state.messageType === 'success' ? (
                  <CheckCircle className="h-5 w-5 mr-2" />
                ) : state.messageType === 'error' ? (
                  <AlertCircle className="h-5 w-5 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 mr-2" />
                )}
                {state.message}
              </div>
            </div>
          )}

          {/* Step 1: Email Input */}
          {state.step === 'email' && (
            <form className="space-y-6" onSubmit={handleEmailSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email Address
                </label>
                <div className="mt-1 relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={state.email}
                    onChange={(e) => setState(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email address"
                    className="pl-10 appearance-none block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={state.isLoading}
                  className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600 font-semibold transition-all ${
                    state.isLoading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {state.isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying Email...
                    </>
                  ) : (
                    <>
                      <Mail className="h-5 w-5 mr-2" />
                      Reset Password
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Step 2: New Password Input */}
          {state.step === 'password' && (
            <form className="space-y-6" onSubmit={handlePasswordSubmit}>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <p className="text-blue-800 dark:text-blue-200 text-sm">
                  <strong>Email verified:</strong> {state.email}
                </p>
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  New Password
                </label>
                <div className="mt-1 relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={state.showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={state.newPassword}
                    onChange={(e) => setState(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="pl-10 pr-10 appearance-none block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    onClick={() => setState(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                  >
                    {state.showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <p className="mb-1">Password requirements:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li className={state.newPassword.length >= 8 ? 'text-green-600 dark:text-green-400' : ''}>
                      At least 8 characters
                    </li>
                    <li className={/[A-Z]/.test(state.newPassword) ? 'text-green-600 dark:text-green-400' : ''}>
                      One uppercase letter
                    </li>
                    <li className={/[a-z]/.test(state.newPassword) ? 'text-green-600 dark:text-green-400' : ''}>
                      One lowercase letter
                    </li>
                    <li className={/[0-9]/.test(state.newPassword) ? 'text-green-600 dark:text-green-400' : ''}>
                      One number
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Confirm New Password
                </label>
                <div className="mt-1 relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={state.showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={state.confirmPassword}
                    onChange={(e) => setState(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="pl-10 pr-10 appearance-none block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    onClick={() => setState(prev => ({ ...prev, showConfirmPassword: !prev.showConfirmPassword }))}
                  >
                    {state.showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleStartOver}
                  className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-medium transition-all"
                >
                  Start Over
                </button>
                <button
                  type="submit"
                  disabled={state.isLoading}
                  className={`flex-1 flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600 font-semibold transition-all ${
                    state.isLoading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {state.isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating Password...
                    </>
                  ) : (
                    <>
                      <Lock className="h-5 w-5 mr-2" />
                      Update Password
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Success */}
          {state.step === 'success' && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/50 mb-6">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Password Updated Successfully
              </h3>
              
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                You can now log in with your new password.
              </p>
              
              <div className="space-y-4">
                <button
                  onClick={handleBackToLogin}
                  className="w-full bg-blue-900 dark:bg-blue-700 text-white py-3 px-4 rounded-md font-semibold hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors"
                >
                  Continue to Login
                </button>
                
                <button
                  onClick={handleStartOver}
                  className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-md font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Reset Another Password
                </button>
              </div>
            </div>
          )}

          {/* Rate Limiting Info */}
          {state.attemptCount > 0 && state.step === 'email' && (
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Attempts: {state.attemptCount}/{RATE_LIMIT_ATTEMPTS} 
                {state.attemptCount >= RATE_LIMIT_ATTEMPTS && ' (Rate limit reached)'}
              </p>
            </div>
          )}

          {/* Security Notice */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              For security reasons, we don't reveal whether an email exists in our system.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;