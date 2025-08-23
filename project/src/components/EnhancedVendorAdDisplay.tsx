import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ExternalLink, Play, Eye, MousePointer, Bell } from 'lucide-react';
import { VendorAdWorkflowService, VendorAdPlacement } from '../services/vendorAdWorkflow';

interface EnhancedVendorAdDisplayProps {
  position: 'header_banner' | 'sidebar' | 'footer' | 'popup' | 'notification' | 'video_overlay';
  maxAds?: number;
  autoRotate?: boolean;
  rotationInterval?: number;
}

const EnhancedVendorAdDisplay: React.FC<EnhancedVendorAdDisplayProps> = ({ 
  position, 
  maxAds = 3,
  autoRotate = true,
  rotationInterval = 10000
}) => {
  const navigate = useNavigate();
  const [placements, setPlacements] = useState<VendorAdPlacement[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivePlacements();
  }, [position]);

  useEffect(() => {
    // Auto-rotate ads
    if (autoRotate && placements.length > 1) {
      const interval = setInterval(() => {
        setCurrentAdIndex((prev) => (prev + 1) % placements.length);
      }, rotationInterval);
      
      return () => clearInterval(interval);
    }
  }, [placements.length, autoRotate, rotationInterval]);

  useEffect(() => {
    // Show popup ads after delay
    if (position === 'popup' && placements.length > 0) {
      const timer = setTimeout(() => {
        setShowPopup(true);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [position, placements.length]);

  const loadActivePlacements = async () => {
    try {
      const activePlacements = await VendorAdWorkflowService.getActiveAdPlacements(position, maxAds);
      setPlacements(activePlacements);
    } catch (error) {
      console.error('Error loading active placements:', error);
      setPlacements([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdClick = async (placement: VendorAdPlacement) => {
    // Track click interaction
    try {
      await VendorAdWorkflowService.trackAdInteraction(placement.id, 'click', {
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        referrer: window.location.href
      });
    } catch (error) {
      console.error('Error tracking ad click:', error);
    }

    // Navigate to ad landing page or external URL
    if (placement.ad_request?.ad_type === 'billboard_offer') {
      navigate('/explore');
    } else {
      navigate(`/vendor-ad/${placement.ad_request_id}`);
    }
  };

  const handleAdImpression = async (placement: VendorAdPlacement) => {
    // Track impression
    try {
      await VendorAdWorkflowService.trackAdInteraction(placement.id, 'impression', {
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      });
    } catch (error) {
      console.error('Error tracking ad impression:', error);
    }
  };

  // Track impressions when ads are displayed
  useEffect(() => {
    if (placements.length > 0 && currentAdIndex < placements.length) {
      const currentPlacement = placements[currentAdIndex];
      handleAdImpression(currentPlacement);
    }
  }, [currentAdIndex, placements]);

  const closePopup = () => {
    setShowPopup(false);
  };

  if (loading || placements.length === 0) {
    return null;
  }

  const currentPlacement = placements[currentAdIndex];
  const adRequest = currentPlacement.ad_request;

  if (!adRequest) return null;

  // Popup Ad Display
  if (position === 'popup' && showPopup) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 relative">
          <button
            onClick={closePopup}
            className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 z-10"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="p-6">
            {adRequest.image_url && (
              <div className="mb-4">
                <img 
                  src={adRequest.image_url} 
                  alt={adRequest.title}
                  className="w-full h-32 object-cover rounded-lg"
                />
              </div>
            )}
            
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {adRequest.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {adRequest.content}
              </p>
              
              <button
                onClick={() => handleAdClick(currentPlacement)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center justify-center mx-auto"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Learn More
              </button>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 rounded-b-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Sponsored by {adRequest.vendor?.name}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Header Banner Ad
  if (position === 'header_banner') {
    return (
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium">{adRequest.title}</span>
              <span className="text-sm opacity-90">{adRequest.content}</span>
            </div>
            <button
              onClick={() => handleAdClick(currentPlacement)}
              className="bg-white text-blue-600 px-4 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Learn More
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Notification Ad
  if (position === 'notification') {
    return (
      <div className="fixed top-4 right-4 max-w-sm bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-40">
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3 flex-1">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                {adRequest.title}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {adRequest.content.length > 80 
                  ? `${adRequest.content.substring(0, 80)}...` 
                  : adRequest.content}
              </p>
              <button
                onClick={() => handleAdClick(currentPlacement)}
                className="mt-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
              >
                View Details →
              </button>
            </div>
            <button
              onClick={() => setCurrentAdIndex((prev) => (prev + 1) % placements.length)}
              className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-4 w-4" />
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
          
          {adRequest.ad_type === 'video' && adRequest.video_url ? (
            <div className="mb-3 bg-gray-100 dark:bg-gray-700 rounded-lg p-6 flex items-center justify-center">
              <Play className="h-8 w-8 text-gray-400" />
            </div>
          ) : adRequest.image_url ? (
            <div className="mb-3">
              <img 
                src={adRequest.image_url} 
                alt={adRequest.title}
                className="w-full h-24 object-cover rounded-lg"
              />
            </div>
          ) : null}
          
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            {adRequest.title}
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
            {adRequest.content.length > 80 
              ? `${adRequest.content.substring(0, 80)}...` 
              : adRequest.content}
          </p>
          
          <button
            onClick={() => handleAdClick(currentPlacement)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors"
          >
            Learn More
          </button>
          
          <div className="mt-2 text-xs text-gray-400">
            by {adRequest.vendor?.name}
          </div>
        </div>
        
        {placements.length > 1 && (
          <div className="flex justify-center mt-3 space-x-1">
            {placements.map((_, index) => (
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

        {/* Performance Indicators */}
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center">
              <Eye className="h-3 w-3 mr-1" />
              <span>{currentPlacement.total_impressions.toLocaleString()}</span>
            </div>
            <div className="flex items-center">
              <MousePointer className="h-3 w-3 mr-1" />
              <span>{currentPlacement.total_clicks}</span>
            </div>
            <div>
              CTR: {currentPlacement.click_through_rate.toFixed(2)}%
            </div>
          </div>
        </div>
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
              <span className="text-sm font-medium text-gray-900 dark:text-white">{adRequest.title}</span>
              <span className="text-sm text-gray-600 dark:text-gray-300">{adRequest.content}</span>
            </div>
            <button
              onClick={() => handleAdClick(currentPlacement)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition-colors"
            >
              Learn More
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Video Overlay Ad
  if (position === 'video_overlay' && adRequest.video_url) {
    return (
      <div className="fixed bottom-4 right-4 max-w-sm bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-30">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{adRequest.title}</h4>
            <button
              onClick={() => setCurrentAdIndex((prev) => (prev + 1) % placements.length)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-3 flex items-center justify-center">
            <Play className="h-8 w-8 text-gray-400" />
          </div>
          
          <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
            {adRequest.content}
          </p>
          
          <button
            onClick={() => handleAdClick(currentPlacement)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors"
          >
            Watch Video
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default EnhancedVendorAdDisplay;