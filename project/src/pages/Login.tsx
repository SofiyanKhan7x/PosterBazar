import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock, AlertCircle, LogIn, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useFormValidation } from '../hooks/useFormValidation';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { 
    handleFieldChange, 
    handleFieldBlur, 
    validateAllFields, 
    getFieldError, 
    hasFieldError,
    clearErrors
  } = useFormValidation();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Apply real-time input filtering and validation
    let filteredValue = value;
    
    // Filter input based on field type
    if (name === 'email') {
      // No filtering for email, allow all characters
      filteredValue = value;
    }
    
    const formattedValue = handleFieldChange(
      name, 
      filteredValue, 
      name === 'email' ? 'email' : 'password'
    );
    
    setFormData({
      ...formData,
      [name]: filteredValue,
    });
    
    // Clear general error message when user starts typing
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    handleFieldBlur(
      name, 
      value, 
      name === 'email' ? 'email' : 'password'
    );
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    // Validate all fields before submission
    const validationRules = {
      email: { type: 'email' },
      password: { type: 'password' }
    };
    
    const isFormValid = validateAllFields(formData, validationRules);
    
    if (!isFormValid) {
      setErrorMessage('Please fix the errors above before submitting');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Account lockout feature disabled - proceed with login attempt

      const success = await login(formData.email, formData.password);
      if (success) {
        clearErrors();
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Display appropriate error message based on error type
      if (error.message && error.message.includes('deactivated by an administrator')) {
        setErrorMessage(error.message);
      } else if (error.message && error.message.includes('sub-admin account has been deactivated')) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(error.message || 'An error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md mt-8">
        <Link to="/" className="flex items-center justify-center">
          <span className="text-3xl font-bold text-blue-900 dark:text-blue-400">POSTERBAZAR</span>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900 dark:text-white">Sign in to your account</h2>
        <p className="mt-2 text-center text-gray-600 dark:text-gray-400">
          Or {' '}
          <Link to="/register" className="text-blue-900 dark:text-blue-400 hover:underline">
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow rounded-lg sm:px-10">
          {errorMessage && (
            <div className={`mb-4 border-l-4 p-4 ${
              errorMessage.includes('deactivated by an administrator')
                ? 'bg-orange-50 dark:bg-orange-900/50 border-orange-500'
                : 'bg-red-50 dark:bg-red-900/50 border-red-500'
            }`}>
              <div className="flex items-center">
                <AlertCircle className={`h-5 w-5 mr-2 ${
                  errorMessage.includes('deactivated by an administrator')
                    ? 'text-orange-500'
                    : 'text-red-500'
                }`} />
                <div>
                  <p className={`${
                    errorMessage.includes('deactivated by an administrator')
                      ? 'text-orange-700 dark:text-orange-200'
                      : 'text-red-700 dark:text-red-200'
                  }`}>
                    {errorMessage}
                  </p>
                  {errorMessage.includes('deactivated by an administrator') && (
                    <p className="text-orange-600 dark:text-orange-300 text-sm mt-2">
                      If you believe this is an error, please reach out to our support team for immediate assistance.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <div className="mt-1 relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`pl-10 appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                    hasFieldError('email') 
                      ? 'border-red-500 dark:border-red-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
              </div>
              {getFieldError('email') && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {getFieldError('email')}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`pl-10 pr-10 appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                    hasFieldError('password') 
                      ? 'border-red-500 dark:border-red-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {getFieldError('password') && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {getFieldError('password')}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link to="/forgot-password" className="text-blue-900 dark:text-blue-400 hover:underline font-medium">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600 transform hover:scale-105 transition-all ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5 mr-2" />
                    Sign in
                  </>
                )}
              </button>
            </div>
          </form>


        </div>
      </div>
    </div>
  );
};

export default Login;