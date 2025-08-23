import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Wifi, WifiOff, RefreshCw, AlertTriangle,
  Target, Video, Monitor, Bell
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { RealTimePricingService, VendorAdPricing, PricingNotification } from '../services/realTimePricing';

interface PricingDisplayProps {
  showNotifications?: boolean;
  compact?: boolean;
}

const VendorPricingDisplay: React.FC<PricingDisplayProps> = ({ 
  showNotifications = true, 
  compact = false 
}) => {
  const { user } = useAuth();
  const [pricing, setPricing] = useState<VendorAdPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [notifications, setNotifications] = useState<PricingNotification[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && (user.role === 'vendor' || user.role === 'user')) {
      loadInitialPricing();
      setupRealTimeSubscription();
    }
  }, [user]);

  const loadInitialPricing = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const pricingData = await RealTimePricingService.getCurrentPricing();
      setPricing(pricingData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading initial pricing:', error);
      setError(error instanceof Error ? error.message : 'Failed to load pricing');
    } finally {
      setLoading(false);
    }
  };

  const setupRealTimeSubscription = () => {
    if (!user) return;

    // Subscribe to pricing updates
    const unsubscribePricing = RealTimePricingService.subscribeToRealTimePricing(
      (updatedPricing) => {
        console.log('Vendor received pricing update:', updatedPricing);
        setPricing(updatedPricing);
        setConnectionStatus('connected');
        setLastUpdated(new Date());
        setError(null);
      },
      (error) => {
        console.error('Real-time pricing error:', error);
        setConnectionStatus('disconnected');
        setError(error.message);
      }
    );

    // Subscribe to vendor notifications
    const unsubscribeNotifications = RealTimePricingService.subscribeToVendorNotifications(
      user.id,
      (notification) => {
        console.log('Vendor received pricing notification:', notification);
        setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep last 5 notifications
        
        // Show browser notification if supported
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Pricing Update', {
            body: `Ad pricing has been updated. Check your dashboard for details.`,
            icon: '/marketing_and_seo_57-removebg.png'
          });
        }
      }
    );

    // Update connection status
    setConnectionStatus(RealTimePricingService.getConnectionStatus());

    // Cleanup function
    return () => {
      unsubscribePricing();
      unsubscribeNotifications();
    };
  };

  const handleRefresh = async () => {
    try {
      setError(null);
      const updatedPricing = await RealTimePricingService.refreshPricing();
      setPricing(updatedPricing);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error refreshing pricing:', error);
      setError(error instanceof Error ? error.message : 'Failed to refresh pricing');
    }
  };

  const getAdTypeIcon = (typeName: string) => {
    switch (typeName.toLowerCase()) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'popup': return <Monitor className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getAdTypeColor = (typeName: string) => {
    switch (typeName.toLowerCase()) {
      case 'video': return 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400';
      case 'popup': return 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400';
      default: return 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400';
    }
  };

  const formatCurrency = (amount: number) => {
    return RealTimePricingService.formatCurrency(amount);
  };

  if (!user || (user.role !== 'vendor' && user.role !== 'user')) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Connection Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mr-4">
              Current Ad Pricing
            </h3>
            
            {/* Connection Status Indicator */}
            <div className="flex items-center space-x-2">
              {connectionStatus === 'connected' ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-xs font-medium ${
                connectionStatus === 'connected' 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {connectionStatus === 'connected' ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Last Updated */}
            {lastUpdated && (
              <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                <Clock className="h-4 w-4" />
                <span className="text-xs">
                  {lastUpdated.toLocaleTimeString()}
                </span>
              </div>
            )}

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Refresh pricing"
            >
              <RefreshCw className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
              <span className="text-red-800 dark:text-red-200 text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Recent Notifications */}
        {showNotifications && notifications.length > 0 && (
          <div className="mt-4 space-y-2">
            {notifications.slice(0, 2).map((notification) => (
              <div key={notification.id} className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center">
                  <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
                  <span className="text-blue-800 dark:text-blue-200 text-sm">
                    Pricing updated: {formatCurrency(notification.old_price)} → {formatCurrency(notification.new_price)}
                  </span>
                  <span className="ml-auto text-xs text-blue-600 dark:text-blue-400">
                    {new Date(notification.broadcast_timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pricing Cards */}
      <div className={`grid gap-4 ${
        compact 
          ? 'grid-cols-1' 
          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      }`}>
        {pricing.map((priceData) => (
          <div key={priceData.ad_type_id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg mr-3 ${getAdTypeColor(priceData.ad_type_name)}`}>
                  {getAdTypeIcon(priceData.ad_type_name)}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white capitalize">
                    {priceData.ad_type_name === 'notification' ? 'Notification' :
                     priceData.ad_type_name === 'banner' ? 'Banner' :
                     priceData.ad_type_name === 'popup' ? 'Popup' : 
                     priceData.ad_type_name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {priceData.ad_type_name === 'notification' ? 'Notification ads' :
                     priceData.ad_type_name === 'banner' ? 'Banner ads' :
                     priceData.ad_type_name === 'popup' ? 'Popup ads' : 
                     'Ad type'}
                  </p>
                </div>
              </div>
              
              {/* Live Update Indicator */}
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`}></div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(priceData.base_price)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">per day</div>
            </div>

            {!compact && (
              <div className="mt-3 text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Effective from {new Date(priceData.effective_from).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {pricing.length === 0 && !loading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <Target className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Pricing Available</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Vendor ad pricing will appear here once configured by administrators.
          </p>
        </div>
      )}
    </div>
  );
};

export default VendorPricingDisplay;