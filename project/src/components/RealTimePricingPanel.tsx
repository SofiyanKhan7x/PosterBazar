import React, { useState, useEffect } from 'react';
import { 
  IndianRupee, Edit, Save, X, RefreshCw, Wifi, WifiOff,
  TrendingUp, TrendingDown, Clock, AlertTriangle, CheckCircle,
  History, Target, Video, Monitor
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useRealTimePricing } from '../hooks/useRealTimePricing';

interface EditingPrice {
  adTypeId: string;
  currentPrice: number;
  newPrice: string;
  changeReason: string;
}

const RealTimePricingPanel: React.FC = () => {
  const { user } = useAuth();
  const {
    pricing,
    history,
    loading,
    updating,
    error,
    connectionStatus,
    lastUpdated,
    updatePricing,
    refreshPricing,
    validatePricing,
    formatCurrency,
    calculatePriceChange
  } = useRealTimePricing();

  const [editingPrice, setEditingPrice] = useState<EditingPrice | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  // Clear messages after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleStartEdit = (adTypeId: string, currentPrice: number) => {
    setEditingPrice({
      adTypeId,
      currentPrice,
      newPrice: currentPrice.toString(),
      changeReason: ''
    });
  };

  const handleCancelEdit = () => {
    setEditingPrice(null);
  };

  const handleSavePrice = async () => {
    if (!editingPrice || !user) return;

    const newPrice = parseFloat(editingPrice.newPrice);
    const validation = validatePricing(newPrice);

    if (!validation.valid) {
      setMessage(validation.error || 'Invalid price');
      setMessageType('error');
      return;
    }

    try {
      await updatePricing(
        editingPrice.adTypeId,
        newPrice,
        editingPrice.changeReason || 'Admin price update'
      );

      setMessage('Pricing updated successfully and broadcasted to all vendors!');
      setMessageType('success');
      setEditingPrice(null);
    } catch (error) {
      console.error('Error saving price:', error);
      setMessage(error instanceof Error ? error.message : 'Failed to update pricing');
      setMessageType('error');
    }
  };

  const getAdTypeIcon = (typeName: string) => {
    switch (typeName.toLowerCase()) {
      case 'video': return <Video className="h-5 w-5" />;
      case 'popup': return <Monitor className="h-5 w-5" />;
      default: return <Target className="h-5 w-5" />;
    }
  };

  const getAdTypeColor = (typeName: string) => {
    switch (typeName.toLowerCase()) {
      case 'video': return 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400';
      case 'popup': return 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400';
      default: return 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400';
    }
  };

  const getPriceChangeColor = (direction: string) => {
    switch (direction) {
      case 'increase': return 'text-red-600 dark:text-red-400';
      case 'decrease': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">Access Denied</h3>
        <p className="text-red-600 dark:text-red-300">Only administrators can manage vendor ad pricing.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Connection Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Real-time Vendor Ad Pricing</h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Manage pricing for vendor advertisements with instant updates
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              {connectionStatus === 'connected' ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-500" />
              )}
              <span className={`text-sm font-medium ${
                connectionStatus === 'connected' 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {connectionStatus === 'connected' ? 'Live Updates' : 'Offline'}
              </span>
            </div>

            {/* Last Updated */}
            {lastUpdated && (
              <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                <Clock className="h-4 w-4" />
                <span className="text-sm">
                  Updated {lastUpdated.toLocaleTimeString()}
                </span>
              </div>
            )}

            {/* Refresh Button */}
            <button
              onClick={refreshPricing}
              disabled={loading}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Refresh pricing data"
            >
              <RefreshCw className={`h-5 w-5 text-gray-600 dark:text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* History Toggle */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-800/70 transition-colors"
              title="View pricing history"
            >
              <History className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </button>
          </div>
        </div>

        {/* Status Messages */}
        {message && (
          <div className={`mt-4 p-4 rounded-lg border ${
            messageType === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
              : messageType === 'error'
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
              : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
          }`}>
            <div className="flex items-center">
              {messageType === 'success' ? (
                <CheckCircle className="h-5 w-5 mr-2" />
              ) : messageType === 'error' ? (
                <AlertTriangle className="h-5 w-5 mr-2" />
              ) : (
                <AlertTriangle className="h-5 w-5 mr-2" />
              )}
              {message}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 rounded-lg border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              {error}
            </div>
          </div>
        )}
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          // Loading skeletons
          [...Array(3)].map((_, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-lg mr-3"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
              <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))
        ) : (
          pricing.map((priceData) => (
            <div key={priceData.ad_type_id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg mr-3 ${getAdTypeColor(priceData.ad_type_name)}`}>
                    {getAdTypeIcon(priceData.ad_type_name)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {priceData.ad_type_name === 'notification' ? 'Notification Ads' :
                       priceData.ad_type_name === 'banner' ? 'Banner Ads' :
                       priceData.ad_type_name === 'popup' ? 'Popup Ads' : 
                       `${priceData.ad_type_name} Ads`}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {priceData.ad_type_name === 'notification' ? 'Small notification-style ads' :
                       priceData.ad_type_name === 'banner' ? 'Traditional banner advertisements' :
                       priceData.ad_type_name === 'popup' ? 'Interactive popup advertisements' : 
                       'Advertisement type'}
                    </p>
                  </div>
                </div>
                
                {editingPrice?.adTypeId !== priceData.ad_type_id && (
                  <button
                    onClick={() => handleStartEdit(priceData.ad_type_id, priceData.base_price)}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                    title="Edit pricing"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                )}
              </div>

              {editingPrice?.adTypeId === priceData.ad_type_id ? (
                // Edit Mode
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      New Price (₹/day)
                    </label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        value={editingPrice.newPrice}
                        onChange={(e) => setEditingPrice({
                          ...editingPrice,
                          newPrice: e.target.value
                        })}
                        className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Enter new price"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Change Reason
                    </label>
                    <input
                      type="text"
                      value={editingPrice.changeReason}
                      onChange={(e) => setEditingPrice({
                        ...editingPrice,
                        changeReason: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Reason for price change"
                    />
                  </div>

                  {/* Price Change Preview */}
                  {editingPrice.newPrice && !isNaN(parseFloat(editingPrice.newPrice)) && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Price Change:</span>
                        <div className="flex items-center">
                          {(() => {
                            const change = calculatePriceChange(editingPrice.currentPrice, parseFloat(editingPrice.newPrice));
                            return (
                              <>
                                {change.direction === 'increase' ? (
                                  <TrendingUp className="h-4 w-4 text-red-500 mr-1" />
                                ) : change.direction === 'decrease' ? (
                                  <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
                                ) : null}
                                <span className={`text-sm font-medium ${getPriceChangeColor(change.direction)}`}>
                                  {change.direction === 'no_change' ? 'No change' : `${change.percentage.toFixed(1)}%`}
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                    >
                      <X className="h-4 w-4 mr-1 inline" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSavePrice}
                      disabled={updating}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 flex items-center justify-center"
                    >
                      {updating ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Save className="h-4 w-4 mr-1" />
                      )}
                      Save & Broadcast
                    </button>
                  </div>
                </div>
              ) : (
                // Display Mode
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                      {formatCurrency(priceData.base_price)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">per day</div>
                  </div>

                  <div className="text-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Effective from
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {new Date(priceData.effective_from).toLocaleDateString()}
                    </div>
                  </div>

                  {priceData.updated_by_name && (
                    <div className="text-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Last updated by
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {priceData.updated_by_name}
                      </div>
                    </div>
                  )}

                  {/* Real-time Update Indicator */}
                  <div className="flex items-center justify-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                    }`}></div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {connectionStatus === 'connected' ? 'Live pricing' : 'Offline mode'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pricing History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Pricing History</h3>
              <button 
                onClick={() => setShowHistory(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto">
              {history.length === 0 ? (
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">No pricing history available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((record) => (
                    <div key={record.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`p-2 rounded-lg mr-3 ${getAdTypeColor(record.ad_type_name)}`}>
                            {getAdTypeIcon(record.ad_type_name)}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white capitalize">
                              {record.ad_type_name} Ads
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {record.change_reason}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {formatCurrency(record.old_price)}
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {formatCurrency(record.new_price)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {new Date(record.change_timestamp).toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            by {record.changed_by_name}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimePricingPanel;