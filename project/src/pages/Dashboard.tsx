import React, { useState, useEffect } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { CheckCircle } from 'lucide-react';
import UserDashboard from './user/UserDashboard';
import OwnerDashboard from './owner/OwnerDashboard';
import AdminDashboard from './admin/AdminDashboard';
import SubAdminDashboard from './subadmin/SubAdminDashboard';
import VendorDashboard from './vendor/VendorDashboard';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  useEffect(() => {
    // Check if returning from successful booking
    const params = new URLSearchParams(location.search);
    const bookingSuccess = params.get('booking') === 'success';
    
    if (bookingSuccess) {
      setShowSuccessMessage(true);
      // Hide success message after 5 seconds
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [location]);

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Get user initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get role display name
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'user': return 'Advertiser';
      case 'owner': return 'Billboard Owner';
      case 'vendor': return 'Vendor/Advertiser';
      case 'admin': return 'Administrator';
      case 'sub_admin': return 'Sub Administrator';
      default: return role;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Welcome back, manage your billboard activities
              </p>
            </div>
            
            {/* User Info */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{getRoleDisplayName(user.role)}</p>
              </div>
              <div className="relative">
                {user.profile_photo ? (
                  <img
                    src={user.profile_photo}
                    alt={user.name}
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-blue-500 dark:ring-blue-400"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 flex items-center justify-center ring-2 ring-blue-500 dark:ring-blue-400">
                    <span className="text-sm font-medium text-white">
                      {getInitials(user.name)}
                    </span>
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showSuccessMessage && (
          <div className="mb-8 bg-green-50 dark:bg-green-900/50 border-l-4 border-green-500 p-4 rounded-md animate-fade-in-down">
            <div className="flex">
              <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
              <div>
                <p className="text-green-800 dark:text-green-200 font-medium">Booking Successful!</p>
                <p className="text-green-700 dark:text-green-300 mt-1">
                  Your booking request has been submitted successfully. You'll receive a confirmation when it's approved.
                </p>
              </div>
            </div>
          </div>
        )}

        {user.role === 'user' && <UserDashboard />}
        {user.role === 'owner' && <OwnerDashboard />}
        {user.role === 'vendor' && <VendorDashboard />}
        {user.role === 'admin' && <AdminDashboard />}
        {user.role === 'sub_admin' && <SubAdminDashboard />}
      </div>
    </div>
  );
};

export default Dashboard;