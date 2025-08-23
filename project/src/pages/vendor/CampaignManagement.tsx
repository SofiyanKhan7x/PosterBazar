import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
   ArrowLeft, Plus, BarChart, 
  Search, Filter, Target, Calendar, IndianRupee, Eye,
   CheckCircle, AlertTriangle, Clock, Upload
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { 
  getVendorAdRequests, 
  createAdRequest, 
  updateAdRequest, 
  getAdTypes,
  uploadVendorAdFile,
  calculateAdCost
} from '../../services/vendor';
import { AdRequest, AdType } from '../../types/vendor';

const CampaignManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<AdRequest[]>([]);
  const [adTypes, setAdTypes] = useState<AdType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'pending' | 'approved' | 'active' | 'completed'>('all');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const [newCampaign, setNewCampaign] = useState({
    title: '',
    description: '',
    content: '',
    ad_type_id: '',
    target_audience: '',
    campaign_objectives: '',
    start_date: '',
    end_date: '',
    daily_budget: ''
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const [campaignData, adTypeData] = await Promise.all([
        getVendorAdRequests(user.id),
        getAdTypes()
      ]);
      
      setCampaigns(campaignData);
      setAdTypes(adTypeData);
    } catch (error) {
      console.error('Error loading campaign data:', error);
      setMessage('Failed to load campaign data');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleCreateCampaign = async () => {
    if (!newCampaign.title.trim() || !newCampaign.ad_type_id || !newCampaign.start_date || !newCampaign.end_date || !newCampaign.daily_budget) {
      setMessage('Please fill in all required fields');
      return;
    }

    if (!user) {
      setMessage('User not authenticated');
      return;
    }

    const selectedAdType = adTypes.find(type => type.id === newCampaign.ad_type_id);
    if (!selectedAdType) {
      setMessage('Invalid ad type selected');
      return;
    }

    // Validate video file for video ads
    if (selectedAdType.type_name === 'video' && !videoFile) {
      setMessage('Video file is required for video advertisements');
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      const startDate = new Date(newCampaign.start_date);
      const endDate = new Date(newCampaign.end_date);
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (totalDays <= 0) {
        setMessage('End date must be after start date');
        return;
      }

      // Create the campaign
      const campaignData = {
        vendor_id: user.id,
        ad_type_id: newCampaign.ad_type_id,
        title: newCampaign.title.trim(),
        description: newCampaign.description.trim(),
        content: newCampaign.content.trim(),
        target_audience: newCampaign.target_audience.trim(),
        campaign_objectives: newCampaign.campaign_objectives.trim(),
        start_date: newCampaign.start_date,
        end_date: newCampaign.end_date,
        daily_budget: parseFloat(newCampaign.daily_budget),
        status: 'draft' as const
      };

      const createdCampaign = await createAdRequest(campaignData);

      // Upload files if provided
      if (imageFile) {
        const imageUrl = await uploadVendorAdFile(imageFile, user.id, createdCampaign.id, 'image');
        await updateAdRequest(createdCampaign.id, { image_url: imageUrl });
        createdCampaign.image_url = imageUrl;
      }

      if (videoFile) {
        const videoUrl = await uploadVendorAdFile(videoFile, user.id, createdCampaign.id, 'video');
        await updateAdRequest(createdCampaign.id, { video_url: videoUrl });
        createdCampaign.video_url = videoUrl;
      }

      setCampaigns([createdCampaign, ...campaigns]);
      
      // Reset form
      setNewCampaign({
        title: '',
        description: '',
        content: '',
        ad_type_id: '',
        target_audience: '',
        campaign_objectives: '',
        start_date: '',
        end_date: '',
        daily_budget: ''
      });
      setImageFile(null);
      setVideoFile(null);
      setShowCreateForm(false);
      setMessage('Campaign created successfully');
    } catch (error: any) {
      setMessage('Failed to create campaign: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitForApproval = async (campaignId: string) => {
    try {
      setSubmitting(true);
      const updatedCampaign = await updateAdRequest(campaignId, { status: 'pending' });
      setCampaigns(campaigns.map(c => c.id === campaignId ? updatedCampaign : c));
      setMessage('Campaign submitted for approval');
    } catch (error: any) {
      setMessage('Failed to submit campaign: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = (file: File, type: 'image' | 'video') => {
    const maxSize = type === 'image' ? 10 * 1024 * 1024 : 100 * 1024 * 1024; // 10MB for images, 100MB for videos
    const allowedTypes = type === 'image' 
      ? ['image/jpeg', 'image/png', 'image/gif']
      : ['video/mp4', 'video/webm', 'video/mov'];

    if (file.size > maxSize) {
      setMessage(`${type === 'image' ? 'Image' : 'Video'} file size must be less than ${type === 'image' ? '10MB' : '100MB'}`);
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setMessage(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
      return;
    }

    if (type === 'image') {
      setImageFile(file);
    } else {
      setVideoFile(file);
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400';
      case 'approved': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400';
      case 'completed': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-400';
      case 'paused': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-400';
      case 'draft': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-400';
    }
  };

  const selectedAdType = adTypes.find(type => type.id === newCampaign.ad_type_id);
  const campaignCost = selectedAdType && newCampaign.start_date && newCampaign.end_date && newCampaign.daily_budget
    ? calculateAdCost(
        selectedAdType, 
        Math.ceil((new Date(newCampaign.end_date).getTime() - new Date(newCampaign.start_date).getTime()) / (1000 * 60 * 60 * 24))
      )
    : null;

  if (!user || user.role !== 'vendor') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Only registered vendors can access campaign management.
        </p>
        <Link to="/vendor-register" className="text-blue-900 dark:text-blue-400 hover:underline">
          Register as Vendor
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link 
        to="/vendor/dashboard" 
        className="inline-flex items-center text-blue-900 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-8"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to Dashboard
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Campaign Management</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Create and manage your advertising campaigns.
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              disabled={submitting}
              className="bg-blue-900 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors flex items-center disabled:opacity-50"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Campaign
            </button>
          </div>
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

          {/* Filters */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search campaigns..."
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
              <option value="draft">Draft</option>
              <option value="pending">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>

            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
              <Filter className="h-4 w-4 mr-1" />
              {filteredCampaigns.length} of {campaigns.length} campaigns
            </div>
          </div>

          {/* Create Campaign Form */}
          {showCreateForm && (
            <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Create New Campaign</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Campaign Title *
                  </label>
                  <input
                    type="text"
                    value={newCampaign.title}
                    onChange={(e) => setNewCampaign({...newCampaign, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                    placeholder="Summer Sale Campaign"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ad Type *
                  </label>
                  <select
                    value={newCampaign.ad_type_id}
                    onChange={(e) => setNewCampaign({...newCampaign, ad_type_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                  >
                    <option value="">Select Ad Type</option>
                    {adTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.type_name} - ₹{type.base_price}/day
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Campaign Description
                  </label>
                  <textarea
                    value={newCampaign.description}
                    onChange={(e) => setNewCampaign({...newCampaign, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                    placeholder="Brief description of your campaign"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ad Content *
                  </label>
                  <textarea
                    value={newCampaign.content}
                    onChange={(e) => setNewCampaign({...newCampaign, content: e.target.value})}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                    placeholder="The actual content that will be displayed in your ad"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Target Audience
                  </label>
                  <input
                    type="text"
                    value={newCampaign.target_audience}
                    onChange={(e) => setNewCampaign({...newCampaign, target_audience: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                    placeholder="Young adults 18-35"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Daily Budget (₹) *
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      value={newCampaign.daily_budget}
                      onChange={(e) => setNewCampaign({...newCampaign, daily_budget: e.target.value})}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                      placeholder="1000"
                    />
                  </div>
                  {selectedAdType && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Base rate: ₹{selectedAdType.base_price}/day
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={newCampaign.start_date}
                    onChange={(e) => setNewCampaign({...newCampaign, start_date: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={newCampaign.end_date}
                    onChange={(e) => setNewCampaign({...newCampaign, end_date: e.target.value})}
                    min={newCampaign.start_date || new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                  />
                </div>

                {/* File Uploads */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Upload Image (Optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'image');
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {imageFile ? `Selected: ${imageFile.name}` : 'Click to upload image (JPG, PNG, GIF up to 10MB)'}
                    </p>
                  </div>
                </div>

                {selectedAdType?.type_name === 'video' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Upload Video *
                    </label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors relative">
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'video');
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {videoFile ? `Selected: ${videoFile.name}` : 'Click to upload video (MP4, WebM, MOV up to 100MB)'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Cost Calculation */}
                {campaignCost && (
                  <div className="md:col-span-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Cost Breakdown</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Base Amount:</span>
                        <span>₹{campaignCost.baseAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Platform Fee (10%):</span>
                        <span>₹{campaignCost.platformFee.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>GST (18%):</span>
                        <span>₹{campaignCost.gstAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t border-blue-200 dark:border-blue-700 pt-1">
                        <span>Total Amount:</span>
                        <span>₹{campaignCost.totalAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateForm(false)}
                  disabled={submitting}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCampaign}
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-900 dark:bg-blue-700 text-white rounded-md hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Campaign'}
                </button>
              </div>
            </div>
          )}

          {/* Campaigns List */}
          <div className="space-y-4">
            {filteredCampaigns.map((campaign) => (
              <div key={campaign.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{campaign.title}</h3>
                      <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span className="text-sm">{campaign.start_date} - {campaign.end_date}</span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <IndianRupee className="h-4 w-4 mr-2" />
                        <span className="text-sm">₹{campaign.daily_budget}/day</span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Clock className="h-4 w-4 mr-2" />
                        <span className="text-sm">{campaign.total_days} days</span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Target className="h-4 w-4 mr-2" />
                        <span className="text-sm">₹{campaign.total_budget.toLocaleString()} total</span>
                      </div>
                    </div>

                    {campaign.description && (
                      <p className="text-gray-700 dark:text-gray-300 mb-2">{campaign.description}</p>
                    )}

                    {campaign.rejection_reason && (
                      <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-800 dark:text-red-200">
                          <strong>Rejection Reason:</strong> {campaign.rejection_reason}
                        </p>
                      </div>
                    )}

                    {campaign.admin_notes && (
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          <strong>Admin Notes:</strong> {campaign.admin_notes}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {campaign.status === 'draft' && (
                      <button
                        onClick={() => handleSubmitForApproval(campaign.id)}
                        disabled={submitting}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm transition-colors disabled:opacity-50"
                      >
                        Submit for Approval
                      </button>
                    )}
                    
                    {(campaign.status === 'active' || campaign.status === 'approved') && (
                      <button
                        onClick={() => handleNavigate(`/vendor/campaigns/${campaign.id}/analytics`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm transition-colors flex items-center"
                      >
                        <BarChart className="h-3 w-3 mr-1" />
                        Analytics
                      </button>
                    )}

                    <button
                      onClick={() => handleNavigate(`/vendor/campaigns/${campaign.id}`)}
                      className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-md text-sm transition-colors flex items-center hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredCampaigns.length === 0 && (
            <div className="text-center py-12">
              <Target className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No campaigns found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No campaigns match your current filters.' 
                  : 'Create your first advertising campaign to get started.'}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  disabled={submitting}
                  className="bg-blue-900 dark:bg-blue-700 text-white px-6 py-3 rounded-lg hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  Create Your First Campaign
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignManagement;