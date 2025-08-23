import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, Mail, Lock, AlertCircle, UserPlus, Eye, EyeOff, Phone } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useFormValidation } from '../hooks/useFormValidation';

const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    handleFieldChange, 
    handleFieldBlur, 
    validateAllFields, 
    getFieldError, 
    hasFieldError,
    clearErrors
  } = useFormValidation();
  
  // Get pre-filled data from navigation state (for demo accounts)
  const prefilledData = location.state as {
    email?: string;
    role?: 'user' | 'owner' | 'admin';
    name?: string;
    password?: string;
  } | null;

  const [formData, setFormData] = useState({
    name: prefilledData?.name || '',
    email: prefilledData?.email || '',
    phone: '',
    password: prefilledData?.password || '',
    confirmPassword: prefilledData?.password || '',
    role: (prefilledData?.role === 'admin' ? 'owner' : prefilledData?.role) || 'user' as 'user' | 'owner',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Clear navigation state after using it
  useEffect(() => {
    if (prefilledData) {
      // Replace the current history entry to remove the state
      window.history.replaceState(null, '', '/register');
    }
  }, [prefilledData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Apply real-time input filtering and validation based on field type
    let validationType = 'text';
    let additionalParam = '';
    let filteredValue = value;
    
    switch (name) {
      case 'name':
        validationType = 'textOnly';
        // Filter out numbers and special characters in real-time
        filteredValue = value.replace(/[^a-zA-Z\s]/g, '');
        break;
      case 'email':
        validationType = 'email';
        break;
      case 'phone':
        validationType = 'mobile';
        // Filter out non-numeric characters in real-time
        filteredValue = value.replace(/\D/g, '').slice(0, 10);
        break;
      case 'password':
        validationType = 'password';
        break;
      case 'confirmPassword':
        validationType = 'confirmPassword';
        additionalParam = formData.password;
        break;
    }
    
    const formattedValue = handleFieldChange(name, filteredValue, validationType, additionalParam);
    
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
    
    let validationType = 'text';
    let additionalParam = '';
    
    switch (name) {
      case 'name':
        validationType = 'textOnly';
        break;
      case 'email':
        validationType = 'email';
        break;
      case 'phone':
        validationType = 'mobile';
        break;
      case 'password':
        validationType = 'password';
        break;
      case 'confirmPassword':
        validationType = 'confirmPassword';
        additionalParam = formData.password;
        break;
    }
    
    handleFieldBlur(name, value, validationType, additionalParam);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Validate all fields before submission
    const validationRules = {
      name: { type: 'textOnly' },
      email: { type: 'email' },
      phone: { type: 'mobile' },
      password: { type: 'password' },
      confirmPassword: { type: 'confirmPassword', param: formData.password }
    };
    
    const isFormValid = validateAllFields(formData, validationRules);
    
    if (!isFormValid) {
      setErrorMessage('Please fix the errors above before submitting');
      return;
    }

    setIsLoading(true);
    
    try {
      const success = await register(formData.name, formData.email, formData.password, formData.role, formData.phone);
      if (success) {
        clearErrors();
        navigate('/dashboard');
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'An error occurred. Please try again.');
      console.error(error);
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
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900 dark:text-white">Create your account</h2>
        <p className="mt-2 text-center text-gray-600 dark:text-gray-400">
          Or {' '}
          <Link to="/login" className="text-blue-900 dark:text-blue-400 hover:underline">
            sign in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow rounded-lg sm:px-10">
          {prefilledData && (
            <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-blue-500 mr-2" />
                <p className="text-blue-700 dark:text-blue-200">
                  Creating demo account: <strong>{prefilledData.email}</strong>
                </p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/50 border-l-4 border-red-500 p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <div className="text-red-700 dark:text-red-200">
                  {errorMessage.includes(',') ? (
                    <div>
                      <p className="font-medium mb-2">Password requirements:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {errorMessage.split(', ').map((error, index) => (
                          <li key={index} className="text-sm">{error}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p>{errorMessage}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Full Name
              </label>
              <div className="mt-1 relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`pl-10 appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                    hasFieldError('name') 
                      ? 'border-red-500 dark:border-red-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
              </div>
              {getFieldError('name') && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {getFieldError('name')}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
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
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Phone Number
              </label>
              <div className="mt-1 relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`pl-10 appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                    hasFieldError('phone') 
                      ? 'border-red-500 dark:border-red-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                />
              </div>
              {getFieldError('phone') && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {getFieldError('phone')}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Account Type
              </label>
              <div className="mt-1">
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="user">User - Book billboard advertising</option>
                  <option value="owner">Owner - List and manage posters</option>
                  <option value="vendor">Advertiser/Vendor - Create ad campaigns</option>
                </select>
              </div>
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
                  autoComplete="new-password"
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

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm Password
              </label>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`pl-10 pr-10 appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                    hasFieldError('confirmPassword') 
                      ? 'border-red-500 dark:border-red-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {getFieldError('confirmPassword') && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {getFieldError('confirmPassword')}
                </p>
              )}
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
                    Creating account...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5 mr-2" />
                    Create Account
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  By registering, you agree to our
                </span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <Link to="/terms" className="text-blue-900 dark:text-blue-400 hover:underline">Terms of Service</Link>
                {' and '}
                <Link to="/privacy" className="text-blue-900 dark:text-blue-400 hover:underline">Privacy Policy</Link>
              </div>
              <div className="mt-4">
                <Link 
                  to="/vendor-register" 
                  className="text-blue-900 dark:text-blue-400 hover:underline text-sm"
                >
                  Need advanced advertising features? Register as Vendor →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;