import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, Mail, Lock, Building, Globe, Phone, MapPin,
  AlertCircle, UserPlus, Eye, EyeOff, FileText, CreditCard
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { createVendorProfile } from '../services/vendor';
import { useFormValidation } from '../hooks/useFormValidation';

const VendorRegister: React.FC = () => {
  const { register } = useAuth();
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
    // Basic user info
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    
    // Vendor-specific info
    company_name: '',
    business_type: '',
    company_website: '',
    business_registration_number: '',
    gst_number: '',
    billing_address: '',
    contact_person: '',
    contact_designation: '',
    secondary_email: '',
    secondary_phone: '',
    business_description: '',
    annual_ad_budget: '',
    target_markets: '',
    preferred_ad_types: [] as string[]
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const businessTypes = [
    'E-commerce',
    'Technology',
    'Healthcare',
    'Education',
    'Real Estate',
    'Automotive',
    'Food & Beverage',
    'Fashion & Lifestyle',
    'Financial Services',
    'Travel & Tourism',
    'Entertainment',
    'Manufacturing',
    'Retail',
    'Agriculture & Farming',
    'Events & Exhibitions',
    'Construction & Infrastructure',
    'Logistics & Transportation',
    'Energy & Utilities',
    'Sports & Fitness',
    'Beauty & Personal Care',
    'Media & Publishing',
    'Hospitality',
    'Non-Profits & Social Causes',
    'Government & Public Sector',
    'Art & Culture',
    'Pet Care & Veterinary Services',
    'Other'
  ];

  const adTypes = [
    'popup',
    'video',
    'notification'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Apply real-time input filtering and validation based on field type
    let validationType = 'text';
    let additionalParam = '';
    let filteredValue = value;
    
    switch (name) {
      case 'name':
      case 'company_name':
      case 'contact_person':
        validationType = 'textOnly';
        // Filter out numbers and special characters in real-time
        filteredValue = value.replace(/[^a-zA-Z\s]/g, '');
        break;
      case 'email':
      case 'secondary_email':
        validationType = 'email';
        break;
      case 'phone':
      case 'secondary_phone':
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
    
    setFormData(prev => ({ ...prev, [name]: filteredValue }));
    
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
      case 'company_name':
      case 'contact_person':
        validationType = 'textOnly';
        break;
      case 'email':
      case 'secondary_email':
        validationType = 'email';
        break;
      case 'phone':
      case 'secondary_phone':
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

  const handleAdTypeToggle = (adType: string) => {
    setFormData(prev => ({
      ...prev,
      preferred_ad_types: prev.preferred_ad_types.includes(adType)
        ? prev.preferred_ad_types.filter(type => type !== adType)
        : [...prev.preferred_ad_types, adType]
    }));
  };

  const validateStep1 = () => {
    const validationRules = {
      name: { type: 'textOnly' },
      email: { type: 'email' },
      phone: { type: 'mobile' },
      password: { type: 'password' },
      confirmPassword: { type: 'confirmPassword', param: formData.password }
    };
    
    return validateAllFields(formData, validationRules);
  };

  const validateStep2 = () => {
    const validationRules = {
      company_name: { type: 'textOnly' },
      contact_person: { type: 'textOnly' }
    };
    
    return validateAllFields(formData, validationRules);
  };

  const handleNextStep = () => {
    setErrorMessage('');
    
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validateStep1() || !validateStep2()) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Register user with vendor role
      const success = await register(formData.name, formData.email, formData.password, 'vendor' as any, formData.phone);
      
      if (success) {
        clearErrors();
        // Get the current user to create vendor profile
        const user = JSON.parse(localStorage.getItem('billboardhub_user') || '{}');
        
        // Create vendor profile
        await createVendorProfile({
          user_id: user.id,
          company_name: formData.company_name.trim(),
          business_type: formData.business_type,
          company_website: formData.company_website.trim() || undefined,
          business_registration_number: formData.business_registration_number.trim() || undefined,
          gst_number: formData.gst_number.trim() || undefined,
          billing_address: formData.billing_address.trim(),
          contact_person: formData.contact_person.trim() || undefined,
          contact_designation: formData.contact_designation.trim() || undefined,
          secondary_email: formData.secondary_email.trim() || undefined,
          secondary_phone: formData.secondary_phone.trim() || undefined,
          business_description: formData.business_description.trim() || undefined,
          target_markets: formData.target_markets.trim() ? formData.target_markets.split(',').map(m => m.trim()) : undefined,
          annual_ad_budget: formData.annual_ad_budget ? parseFloat(formData.annual_ad_budget) : undefined,
          preferred_ad_types: formData.preferred_ad_types.length > 0 ? formData.preferred_ad_types : undefined,
          is_verified: false
        });

        navigate('/vendor/dashboard');
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
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl mt-8">
        <Link to="/" className="flex items-center justify-center">
          <span className="text-3xl font-bold text-blue-900 dark:text-blue-400">POSTERBAZAR</span>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900 dark:text-white">
          Register as Advertiser/Vendor
        </h2>
        <p className="mt-2 text-center text-gray-600 dark:text-gray-400">
          Join our advertising network and promote your business
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow rounded-lg sm:px-10">
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                1
              </div>
              <div className={`w-16 h-1 ${currentStep > 1 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                2
              </div>
              <div className={`w-16 h-1 ${currentStep > 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                3
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/50 border-l-4 border-red-500 p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-red-700 dark:text-red-200">{errorMessage}</p>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Basic Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Full Name *
                    </label>
                    <div className="mt-1 relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        id="name"
                        name="name"
                        type="text"
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email Address *
                      </label>
                      <div className="mt-1 relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          id="email"
                          name="email"
                          type="email"
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
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Password *
                      </label>
                      <div className="mt-1 relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
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
                        Confirm Password *
                      </label>
                      <div className="mt-1 relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
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
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="bg-blue-900 dark:bg-blue-700 text-white px-6 py-2 rounded-md hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors"
                  >
                    Next: Company Details
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Company Information */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Company Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Company Name *
                    </label>
                    <div className="mt-1 relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        id="company_name"
                        name="company_name"
                        type="text"
                        required
                        value={formData.company_name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`pl-10 appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                          hasFieldError('company_name') 
                            ? 'border-red-500 dark:border-red-500' 
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      />
                    </div>
                    {getFieldError('company_name') && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {getFieldError('company_name')}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="business_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Business Type *
                    </label>
                    <select
                      id="business_type"
                      name="business_type"
                      required
                      value={formData.business_type}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select Business Type</option>
                      {businessTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="company_website" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Company Website
                    </label>
                    <div className="mt-1 relative">
                      <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        id="company_website"
                        name="company_website"
                        type="url"
                        value={formData.company_website}
                        onChange={handleChange}
                        className="pl-10 appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="https://www.example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="business_registration_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Business Registration Number
                    </label>
                    <div className="mt-1 relative">
                      <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        id="business_registration_number"
                        name="business_registration_number"
                        type="text"
                        value={formData.business_registration_number}
                        onChange={handleChange}
                        className="pl-10 appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="gst_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      GST Number
                    </label>
                    <div className="mt-1 relative">
                      <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        id="gst_number"
                        name="gst_number"
                        type="text"
                        value={formData.gst_number}
                        onChange={handleChange}
                        className="pl-10 appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="annual_ad_budget" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Annual Advertising Budget (₹)
                    </label>
                    <input
                      id="annual_ad_budget"
                      name="annual_ad_budget"
                      type="number"
                      value={formData.annual_ad_budget}
                      onChange={handleChange}
                      className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="500000"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="billing_address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Billing Address *
                  </label>
                  <div className="mt-1 relative">
                    <MapPin className="absolute left-3 top-3 text-gray-400" />
                    <textarea
                      id="billing_address"
                      name="billing_address"
                      required
                      rows={3}
                      value={formData.billing_address}
                      onChange={handleChange}
                      className="pl-10 appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="business_description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Business Description
                  </label>
                  <textarea
                    id="business_description"
                    name="business_description"
                    rows={3}
                    value={formData.business_description}
                    onChange={handleChange}
                    className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Brief description of your business and advertising goals"
                  />
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="bg-blue-900 dark:bg-blue-700 text-white px-6 py-2 rounded-md hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors"
                  >
                    Next: Preferences
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Preferences & Contact */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Preferences & Additional Contact</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Preferred Ad Types
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {adTypes.map(type => (
                      <label key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.preferred_ad_types.includes(type)}
                          onChange={() => handleAdTypeToggle(type)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">
                          {type} Ads
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contact_person" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Contact Person
                    </label>
                    <input
                      id="contact_person"
                      name="contact_person"
                      type="text"
                      value={formData.contact_person}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`mt-1 appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                        hasFieldError('contact_person') 
                          ? 'border-red-500 dark:border-red-500' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {getFieldError('contact_person') && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {getFieldError('contact_person')}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="contact_designation" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Designation
                    </label>
                    <input
                      id="contact_designation"
                      name="contact_designation"
                      type="text"
                      value={formData.contact_designation}
                      onChange={handleChange}
                      className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Marketing Manager"
                    />
                  </div>

                  <div>
                    <label htmlFor="secondary_email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Secondary Email
                    </label>
                    <input
                      id="secondary_email"
                      name="secondary_email"
                      type="email"
                      value={formData.secondary_email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`mt-1 appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                        hasFieldError('secondary_email') 
                          ? 'border-red-500 dark:border-red-500' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {getFieldError('secondary_email') && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {getFieldError('secondary_email')}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="secondary_phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Secondary Phone
                    </label>
                    <input
                      id="secondary_phone"
                      name="secondary_phone"
                      type="tel"
                      value={formData.secondary_phone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`mt-1 appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                        hasFieldError('secondary_phone') 
                          ? 'border-red-500 dark:border-red-500' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      maxLength={10}
                    />
                    {getFieldError('secondary_phone') && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {getFieldError('secondary_phone')}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="target_markets" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Target Markets (comma-separated)
                  </label>
                  <input
                    id="target_markets"
                    name="target_markets"
                    type="text"
                    value={formData.target_markets}
                    onChange={handleChange}
                    className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Mumbai, Delhi, Bangalore"
                  />
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`bg-blue-900 dark:bg-blue-700 text-white px-6 py-2 rounded-md hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors flex items-center ${
                      isLoading ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-5 w-5 mr-2" />
                        Create Vendor Account
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  Already have an account?
                </span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link to="/login" className="text-blue-900 dark:text-blue-400 hover:underline">
                Sign in to your existing account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorRegister;