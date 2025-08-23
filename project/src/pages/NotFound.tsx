import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Prevent browser back/forward navigation to dashboard after logout
  useEffect(() => {
    const handlePopState = () => {
      if (!user && window.location.pathname === '/dashboard') {
        navigate('/', { replace: true });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user, navigate]);

  const handleGoHome = () => {
    navigate('/', { replace: true });
  };

  const handleGoToDashboard = () => {
    if (user) {
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <span className="text-4xl font-bold text-blue-900 dark:text-blue-400 block mb-6">POSTERBAZAR</span>
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Page Not Found</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="space-y-4">
          {user ? (
            <button 
              onClick={handleGoToDashboard}
              className="w-full inline-flex items-center justify-center bg-blue-900 dark:bg-blue-700 text-white py-3 px-6 rounded-md font-semibold hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Go Back to Dashboard
            </button>
          ) : (
            <button 
              onClick={handleGoHome}
              className="w-full inline-flex items-center justify-center bg-blue-900 dark:bg-blue-700 text-white py-3 px-6 rounded-md font-semibold hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors"
            >
              <Home className="h-5 w-5 mr-2" />
              Go Back Home
            </button>
          )}

          <Link 
            to="/explore" 
            className="w-full inline-flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white py-3 px-6 rounded-md font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Explore Billboards
          </Link>
        </div>

        <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>Need help? <Link to="/faq" className="text-blue-900 dark:text-blue-400 hover:underline">Visit our FAQ</Link></p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;