import React from 'react';
import { Link } from 'react-router-dom';
import { 
   ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import RealTimePricingPanel from '../../components/RealTimePricingPanel';

const VendorAdPricingManagement: React.FC = () => {
  const { user } = useAuth();

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Only administrators can manage vendor ad pricing.
        </p>
        <Link to="/dashboard" className="text-blue-900 dark:text-blue-400 hover:underline">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link 
        to="/dashboard" 
        className="inline-flex items-center text-blue-900 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-8"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to Dashboard
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vendor Ad Pricing Management</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Real-time Vendor Ad Pricing</h1>
          </p>
        </div>

        <div className="p-6">
          <RealTimePricingPanel />
        </div>
      </div>
    </div>
  );
};

export default VendorAdPricingManagement;