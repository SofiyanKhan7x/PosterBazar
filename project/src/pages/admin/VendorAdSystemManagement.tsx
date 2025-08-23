import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
   ArrowLeft, IndianRupee, Target, Video, Monitor,
   Edit, Save, X, CheckCircle, AlertTriangle,
  Search, Filter, Eye, ThumbsUp, ThumbsDown, User, Calendar
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { 
  getAllAdTypes, 
  updateAdType, 
  getAllAdRequests,
  approveAdRequest,
  rejectAdRequest,
  getAdminSetting,
  updateAdminSetting,
  createVendorNotification
} from '../../services/vendor';
import { AdType, AdRequest } from '../../types/vendor';

const VendorAdSystemManagement: React.FC = () => {
  const { user } = useAuth();
  const [adTypes, setAdTypes] = useState<AdType[]>([]);
  const [adRequests, setAdRequests] = useState<AdRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pricing' | 'requests' | 'settings'>('requests');
  const [editingType, setEditingType] = useState<AdType | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<AdRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // System settings
  const [settings, setSettings] = useState({
    approval_required: true,
    max_campaign_duration_days: 90,
    min_campaign_duration_days: 1,
    platform_commission_percentage: 10,
    gst_percentage: 18,
    auto_approve_verified_vendors: false
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [adTypesData, adRequestsData] = await Promise.all([
        getAllAdTypes(),
        getAllAdRequests()
      ]);
      
      setAdTypes(adTypesData);
      setAdRequests(adRequestsData);
      
      // Load system settings
      await loadSettings();
    } catch (error) {
      console.error('Error loading vendor ad system data:', error);
      setMessage('Failed to load system data');
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const settingsKeys = [
        'approval_required',
        'max_campaign_duration_days', 
        'min_campaign_duration_days',
        'platform_commission_percentage',
        'gst_percentage',
        'auto_approve_verified_vendors'
      ];

      const settingsData: any = {};
      for (const key of settingsKeys) {
        const value = await getAdminSetting('vendor_ads', key);
        if (value !== null) {
          settingsData[key] = key.includes('percentage') || key.includes('days') 
            ? parseFloat(value) 
            : value === 'true';
        }
      }
      
      setSettings(prev => ({ ...prev, ...settingsData }));
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleUpdateAdType = async () => {
    if (!editingType) return;

    try {
      setSubmitting(true);
      const updatedType = await updateAdType(editingType.id, {
        type_name: editingType.type_name,
        description: editingType.description,
        base_price: editingType.base_price,
        is_active: editingType.is_active
      });

      setAdTypes(adTypes.map(type => 
        type.id === editingType.id ? updatedType : type
      ));
      
      setEditingType(null);
      setMessage('Ad type updated successfully');
    } catch (error: any) {
      setMessage('Failed to update ad type: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveRequest = async () => {
    if (!selectedRequest || !user) return;

    try {
      setSubmitting(true);
      const approvedRequest = await approveAdRequest(selectedRequest.id, user.id, adminNotes);
      
      // Create notification for vendor
      await createVendorNotification(
        selectedRequest.vendor_id,
        'Ad Request Approved',
        `Your ad campaign "${selectedRequest.title}" has been approved and is now live.`,
        'success',
        selectedRequest.id,
        `/vendor/campaigns/${selectedRequest.id}`
      );
      
      setAdRequests(adRequests.map(req => 
        req.id === selectedRequest.id ? approvedRequest : req
      ));
      
      setSelectedRequest(null);
      setAdminNotes('');
      setMessage('Ad request approved successfully');
    } catch (error: any) {
      setMessage('Failed to approve request: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      setMessage('Please provide a reason for rejection');
      return;
    }

    try {
      setSubmitting(true);
      const rejectedRequest = await rejectAdRequest(selectedRequest.id, rejectionReason, adminNotes);
      
      // Create notification for vendor
      await createVendorNotification(
        selectedRequest.vendor_id,
        'Ad Request Rejected',
        `Your ad campaign "${selectedRequest.title}" has been rejected. Reason: ${rejectionReason}`,
        'error',
        selectedRequest.id,
        `/vendor/campaigns/${selectedRequest.id}`
      );
      
      setAdRequests(adRequests.map(req => 
        req.id === selectedRequest.id ? rejectedRequest : req
      ));
      
      setSelectedRequest(null);
      setAdminNotes('');
      setRejectionReason('');
      setMessage('Ad request rejected successfully');
    } catch (error: any) {
      setMessage('Failed to reject request: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSetting = async (key: string, value: any) => {
    if (!user) return;

    try {
      await updateAdminSetting('vendor_ads', key, value.toString(), user.id);
      setSettings(prev => ({ ...prev, [key]: value }));
      setMessage('Setting updated successfully');
    } catch (error: any) {
      setMessage('Failed to update setting: ' + error.message);
    }
  };

  const filteredRequests = adRequests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.vendor?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400';
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400';
      case 'active': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-400';
    }
  };

  const getAdTypeIcon = (typeName: string) => {
    switch (typeName.toLowerCase()) {
      case 'video': return <Video className="h-5 w-5" />;
      case 'popup': return <Monitor className="h-5 w-5" />;
      default: return <Target className="h-5 w-5" />;
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Only administrators can access vendor ad system management.
        </p>
        <Link to="/dashboard" className="text-blue-900 dark:text-blue-400 hover:underline">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading vendor ad system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link 
        to="/dashboard" 
        className="inline-flex items-center text-blue-900 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-8"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to Dashboard
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vendor Advertising System</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Manage vendor ad requests, pricing, and system settings.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('requests')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'requests'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Ad Requests ({adRequests.filter(r => r.status === 'pending').length})
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pricing'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Pricing Management
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              System Settings
            </button>
          </nav>
        </div>

        <div className="p-6">
          {message && (
            <div className={`mb-6 p-4 rounded-lg border ${
              message.includes('successfully') 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
            }`}>
              <div className="flex items-center">
                {message.includes('successfully') ? (
                  <CheckCircle className="h-5 w-5 mr-2" />
                ) : (
                  <AlertTriangle className="h-5 w-5 mr-2" />
                )}
                {message}
              </div>
            </div>
          )}

          {/* Ad Requests Tab */}
          {activeTab === 'requests' && (
            <div>
              <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search ad requests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>

                <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                  <Filter className="h-4 w-4 mr-1" />
                  {filteredRequests.length} of {adRequests.length} requests
                </div>
              </div>

              <div className="space-y-4">
                {filteredRequests.map((request) => (
                  <div key={request.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{request.title}</h3>
                          <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <User className="h-4 w-4 mr-2" />
                            <span className="text-sm">{request.vendor?.name}</span>
                          </div>
                          <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <Target className="h-4 w-4 mr-2" />
                            <span className="text-sm capitalize">{request.ad_type?.type_name}</span>
                          </div>
                          <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span className="text-sm">{request.start_date} - {request.end_date}</span>
                          </div>
                          <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <IndianRupee className="h-4 w-4 mr-2" />
                            <span className="text-sm">₹{request.total_budget.toLocaleString()}</span>
                          </div>
                        </div>

                        <p className="text-gray-700 dark:text-gray-300 mb-2">{request.content}</p>
                        
                        {request.target_audience && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Target: {request.target_audience}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedRequest(request)}
                          className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </button>
                        
                        {request.status === 'pending' && (
                          <>
                            <button
                              onClick={() => {
                                setAdminNotes('');
                                setRejectionReason('');
                                setSelectedRequest(request);
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setAdminNotes('');
                                setRejectionReason('');
                                setSelectedRequest(request);
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredRequests.length === 0 && (
                <div className="text-center py-12">
                  <Target className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No ad requests found</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchTerm || statusFilter !== 'all'
                      ? 'No requests match your current filters.' 
                      : 'No vendor ad requests have been submitted yet.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Pricing Management Tab */}
          {activeTab === 'pricing' && (
            <div className="space-y-6">
              {adTypes.map((adType) => (
                <div key={adType.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  {editingType?.id === adType.id ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Type Name
                          </label>
                          <input
                            type="text"
                            value={editingType.type_name}
                            onChange={(e) => setEditingType({...editingType, type_name: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Base Price (₹/day)
                          </label>
                          <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="number"
                              value={editingType.base_price}
                              onChange={(e) => setEditingType({...editingType, base_price: parseFloat(e.target.value)})}
                              className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Description
                          </label>
                          <textarea
                            value={editingType.description || ''}
                            onChange={(e) => setEditingType({...editingType, description: e.target.value})}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editingType.is_active}
                            onChange={(e) => setEditingType({...editingType, is_active: e.target.checked})}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</span>
                        </label>
                      </div>
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => setEditingType(null)}
                          className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleUpdateAdType}
                          disabled={submitting}
                          className="px-4 py-2 bg-blue-900 dark:bg-blue-700 text-white rounded-md hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors flex items-center disabled:opacity-50"
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg mr-4">
                          {getAdTypeIcon(adType.type_name)}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                            {adType.type_name} Ads
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">{adType.description}</p>
                          <div className="flex items-center mt-2">
                            <IndianRupee className="h-4 w-4 text-green-600 dark:text-green-400 mr-1" />
                            <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                              ₹{adType.base_price}/day
                            </span>
                            <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${
                              adType.is_active 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400'
                            }`}>
                              {adType.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setEditingType(adType)}
                        className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* System Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Campaign Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.approval_required}
                          onChange={(e) => handleUpdateSetting('approval_required', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Require admin approval for ads</span>
                      </label>
                    </div>
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.auto_approve_verified_vendors}
                          onChange={(e) => handleUpdateSetting('auto_approve_verified_vendors', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Auto-approve verified vendors</span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Max Campaign Duration (days)
                      </label>
                      <input
                        type="number"
                        value={settings.max_campaign_duration_days}
                        onChange={(e) => handleUpdateSetting('max_campaign_duration_days', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Min Campaign Duration (days)
                      </label>
                      <input
                        type="number"
                        value={settings.min_campaign_duration_days}
                        onChange={(e) => handleUpdateSetting('min_campaign_duration_days', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Financial Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Platform Commission (%)
                      </label>
                      <input
                        type="number"
                        value={settings.platform_commission_percentage}
                        onChange={(e) => handleUpdateSetting('platform_commission_percentage', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                        step="0.1"
                        min="0"
                        max="50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        GST Rate (%)
                      </label>
                      <input
                        type="number"
                        value={settings.gst_percentage}
                        onChange={(e) => handleUpdateSetting('gst_percentage', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                        step="0.1"
                        min="0"
                        max="30"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Review Ad Request</h2>
              <button 
                onClick={() => {
                  setSelectedRequest(null);
                  setAdminNotes('');
                  setRejectionReason('');
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{selectedRequest.title}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Vendor</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedRequest.vendor?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Ad Type</p>
                      <p className="font-medium text-gray-900 dark:text-white capitalize">{selectedRequest.ad_type?.type_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Campaign Duration</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedRequest.total_days} days</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Budget</p>
                      <p className="font-medium text-gray-900 dark:text-white">₹{selectedRequest.total_budget.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Ad Content</p>
                  <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    {selectedRequest.content}
                  </p>
                </div>

                {selectedRequest.target_audience && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Target Audience</p>
                    <p className="text-gray-700 dark:text-gray-300">{selectedRequest.target_audience}</p>
                  </div>
                )}

                {selectedRequest.status === 'pending' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Admin Notes
                      </label>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Add notes about this ad request..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Rejection Reason (Required for rejection)
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Explain why this ad request is being rejected..."
                      />
                    </div>

                    <div className="flex space-x-4">
                      <button
                        onClick={handleApproveRequest}
                        disabled={submitting}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-md transition-colors flex items-center justify-center disabled:opacity-50"
                      >
                        {submitting ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <ThumbsUp className="h-4 w-4 mr-2" />
                        )}
                        Approve Request
                      </button>
                      <button
                        onClick={handleRejectRequest}
                        disabled={submitting || !rejectionReason.trim()}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-md transition-colors flex items-center justify-center disabled:opacity-50"
                      >
                        {submitting ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <ThumbsDown className="h-4 w-4 mr-2" />
                        )}
                        Reject Request
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorAdSystemManagement;