import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ExternalLink, Play } from 'lucide-react';
import { getApprovedVendorAds } from '../services/supabase';
import { VendorAd } from '../services/supabase';
import { VendorAdWorkflowService } from '../services/vendorAdWorkflow';
import EnhancedVendorAdDisplay from './EnhancedVendorAdDisplay';

interface VendorAdDisplayProps {
  position?: 'header' | 'sidebar' | 'footer' | 'popup';
  maxAds?: number;
}

const VendorAdDisplay: React.FC<VendorAdDisplayProps> = ({ 
  position = 'sidebar', 
  maxAds = 3 
}) => {
  const navigate = useNavigate();
  const [ads, setAds] = useState<VendorAd[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [useEnhancedDisplay] = useState(true);

  useEffect(() => {
    loadApprovedAds();
  }, []);

  useEffect(() => {
    // Auto-rotate ads every 10 seconds for banner/sidebar positions
    if (ads.length > 1 && position === 'sidebar') {
      const interval = setInterval(() => {
        setCurrentAdIndex((prev) => (prev + 1) % ads.length);
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [ads.length, position]);

  useEffect(() => {
    // Show popup ads after 5 seconds on page load
    if (position === 'popup' && ads.length > 0) {
      const timer = setTimeout(() => {
        setShowPopup(true);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [position, ads.length]);

  const loadApprovedAds = async () => {
    try {
      // Try enhanced workflow first
      if (useEnhancedDisplay) {
        const placements = await VendorAdWorkflowService.getActiveAdPlacements(
          position === 'header' ? 'header_banner' :
          position === 'sidebar' ? 'sidebar' :
          position === 'footer' ? 'footer' :
          position === 'popup' ? 'popup' : 'sidebar',
          maxAds
        );
        
        if (placements.length > 0) {
          // Use enhanced display
          setLoading(false);
          return;
        }
      }
      
      // Fallback to original system
      const vendorAds = await getApprovedVendorAds(maxAds);
      setAds(vendorAds);
    } catch (error) {
      console.error('Error loading vendor ads:', error);
      setAds([]);
    } finally {
      setLoading(false);
    }
  };

  // Use enhanced display if available
  if (useEnhancedDisplay) {
    return (
      <EnhancedVendorAdDisplay
        position={
          position === 'header' ? 'header_banner' :
          position === 'sidebar' ? 'sidebar' :
          position === 'footer' ? 'footer' :
          position === 'popup' ? 'popup' : 'sidebar'
        }
        maxAds={maxAds}
        autoRotate={true}
        rotationInterval={10000}
      />
    );
  }

  const handleAdClick = (ad: VendorAd) => {
    // Track ad click analytics
    console.log('Ad clicked:', ad.id);
    
    // Navigate to vendor ad landing page
    navigate(`/vendor-ad/${ad.id}`);
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  if (loading || ads.length === 0) {
    return null;
  }

  const currentAd = ads[currentAdIndex];

  // Popup Ad Display
  if (position === 'popup' && showPopup) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 relative">
          <button
            onClick={closePopup}
            className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="p-6">
            <div className="text-center">
              {currentAd.ad_type === 'video' && (
                <div className="mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg p-8 flex items-center justify-center">
                  <Play className="h-12 w-12 text-gray-400" />
                </div>
              )}
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {currentAd.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {currentAd.content}
              </p>
              
              <button
                onClick={() => handleAdClick(currentAd)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center justify-center mx-auto"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Learn More
              </button>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 rounded-b-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Sponsored by {currentAd.user?.name}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Header Banner Ad
  if (position === 'header') {
    return (
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium">{currentAd.title}</span>
              <span className="text-sm opacity-90">{currentAd.content}</span>
            </div>
            <button
              onClick={() => handleAdClick(currentAd)}
              className="bg-white text-blue-600 px-4 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Learn More
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Sidebar Ad
  if (position === 'sidebar') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
        <div className="text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Sponsored</div>
          
          {currentAd.ad_type === 'video' && (
            <div className="mb-3 bg-gray-100 dark:bg-gray-700 rounded-lg p-6 flex items-center justify-center">
              <Play className="h-8 w-8 text-gray-400" />
            </div>
          )}
          
          {currentAd.image_url && (
            <div className="mb-3">
              <img 
                src={currentAd.image_url} 
                alt={currentAd.title}
                className="w-full h-24 object-cover rounded-lg"
              />
            </div>
          )}
          
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            {currentAd.title}
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
            {currentAd.content.length > 80 
              ? `${currentAd.content.substring(0, 80)}...` 
              : currentAd.content}
          </p>
          
          <button
            onClick={() => handleAdClick(currentAd)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors"
          >
            Learn More
          </button>
          
          <div className="mt-2 text-xs text-gray-400">
            by {currentAd.user?.name}
          </div>
        </div>
        
        {ads.length > 1 && (
          <div className="flex justify-center mt-3 space-x-1">
            {ads.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentAdIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentAdIndex 
                    ? 'bg-blue-600' 
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Footer Banner Ad
  if (position === 'footer') {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-xs text-gray-500 dark:text-gray-400">Sponsored:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{currentAd.title}</span>
              <span className="text-sm text-gray-600 dark:text-gray-300">{currentAd.content}</span>
            </div>
            <button
              onClick={() => handleAdClick(currentAd)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition-colors"
            >
              Learn More
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default VendorAdDisplay;