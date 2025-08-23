import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { 
   ArrowLeft, Plus, Edit, Trash2, Save, CheckCircle, 
  AlertTriangle, Search, Play, Pause, BarChart, Calendar,
   IndianRupee, Target, TrendingUp, Clock, Monitor
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { 
  createVendorAd, 
  updateVendorAd, 
  deleteVendorAd, 
  getUserVendorAds,
  uploadVendorAdImage,
  uploadVendorAdVideo,
  VendorAd
} from '../../services/supabase';

const VendorAdManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ads, setAds] = useState<VendorAd[]>([]);
  
  // Redirect to new workflow page
  if (user && (user.role === 'vendor' || user.role === 'user')) {
    return <Navigate to="/vendor/ad-workflow" replace />;
  }

  const [loading, setLoading] = useState(true);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAd, setEditingAd] = useState<VendorAd | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'completed'>('all');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const [newAd, setNewAd] = useState({
    title: '',
    ad_type: 'banner' as 'banner' | 'video' | 'popup',
    content: '',
    target_audience: '',
    start_date: '',
    end_date: '',
    daily_budget: ''
  });

  useEffect(() => {
    if (user) {
      loadUserAds();
    }
  }, [user]);

  const loadUserAds = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userAds = await getUserVendorAds(user.id);
      setAds(userAds);
    } catch (error) {
      console.error('Error loading user ads:', error);
      setMessage('Failed to load your ads');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (file: File) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];

    if (file.size > maxSize) {
      setMessage('Image file size must be less than 10MB');
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setMessage('Only JPG, PNG, and GIF images are allowed');
      return;
    }

    setImageFile(file);
  };

  const handleVideoUpload = (file: File) => {
    const maxSize = 100 * 1024 * 1024; // 100MB
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];

    if (file.size > maxSize) {
      setMessage('Video file size must be less than 100MB');
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setMessage('Only MP4, WebM, and OGG video files are allowed');
      return;
    }

    setVideoFile(file);
  };

  const handleAddAd = async () => {
    if (!newAd.title.trim() || !newAd.content.trim() || !newAd.start_date || !newAd.end_date || !newAd.daily_budget) {
      setMessage('Please fill in all required fields');
      return;
    }

    if (newAd.ad_type === 'video' && !videoFile) {
      setMessage('Please upload a video file for video ads');
      return;
    }

    const startDate = new Date(newAd.start_date);
    const endDate = new Date(newAd.end_date);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const dailyBudget = parseFloat(newAd.daily_budget);
    const totalCost = totalDays * dailyBudget;

    if (!user) {
      setMessage('User not authenticated');
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      // Create the ad first
      const adData = {
        user_id: user.id,
        title: newAd.title.trim(),
        ad_type: newAd.ad_type,
        content: newAd.content.trim(),
        target_audience: newAd.target_audience.trim(),
        start_date: newAd.start_date,
        end_date: newAd.end_date,
        total_days: totalDays,
        daily_budget: dailyBudget,
        total_cost: totalCost,
        status: 'draft' as const,
        is_active: false
      };

      const createdAd = await createVendorAd(adData);

      // Upload image if provided
      if (imageFile) {
        const imageUrl = await uploadVendorAdImage(imageFile, user.id, createdAd.id);
        await updateVendorAd(createdAd.id, { image_url: imageUrl });
        createdAd.image_url = imageUrl;
      }

      // Upload video if provided
      if (videoFile) {
        const videoUrl = await uploadVendorAdVideo(videoFile, user.id, createdAd.id);
        await updateVendorAd(createdAd.id, { video_url: videoUrl });
        createdAd.video_url = videoUrl;
      }

      setAds([createdAd, ...ads]);
      setNewAd({
        title: '',
        ad_type: 'banner',
        content: '',
        target_audience: '',
        start_date: '',
        end_date: '',
        daily_budget: ''
      });
      setImageFile(null);
      setVideoFile(null);
      setShowAddForm(false);
      setMessage('Vendor ad created successfully');
    } catch (error: any) {
      setMessage('Failed to create ad: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateAd = async () => {
    if (!editingAd) return;

    setSubmitting(true);
    setMessage('');

    try {
      const updatedAd = await updateVendorAd(editingAd.id, {
        title: editingAd.title,
        content: editingAd.content,
        target_audience: editingAd.target_audience,
        daily_budget: editingAd.daily_budget
      });

      setAds(ads.map(ad => 
        ad.id === editingAd.id ? updatedAd : ad
      ));
      setEditingAd(null);
      setMessage('Vendor ad updated successfully');
    } catch (error: any) {
      setMessage('Failed to update ad: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAd = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ad campaign?')) {
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      await deleteVendorAd(id);
      setAds(ads.filter(ad => ad.id !== id));
      setMessage('Vendor ad deleted successfully');
    } catch (error: any) {
      setMessage('Failed to delete ad: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: VendorAd['status']) => {
    setSubmitting(true);
    setMessage('');

    try {
      const updatedAd = await updateVendorAd(id, { 
        status: newStatus,
        is_active: newStatus === 'active'
      });
      
      setAds(ads.map(ad => 
        ad.id === id ? updatedAd : ad
      ));
      setMessage(`Vendor ad ${newStatus} successfully`);
    } catch (error: any) {
      setMessage('Failed to update status: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitForApproval = async (id: string) => {
    await handleStatusChange(id, 'pending');
  };

  const filteredAds = ads.filter(ad => {
    const matchesSearch = ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ad.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ad.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400';
      case 'approved': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400';
      case 'paused': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-400';
      case 'completed': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-400';
      case 'draft': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-400';
    }
  };

  const getAdTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Play className="h-4 w-4" />;
      case 'popup': return <Monitor className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  if (!user || user.role !== 'user') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Only advertisers can manage vendor ads.
        </p>
        <Link to="/dashboard" className="text-blue-900 dark:text-blue-400 hover:underline">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your ads...</p>
        </div>
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vendor Ad Management</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Create and manage your advertising campaigns across our network.
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              disabled={submitting}
              className="bg-blue-900 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors flex items-center disabled:opacity-50"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Ad Campaign
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
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>

            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
              {filteredAds.length} of {ads.length} campaigns
            </div>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className="mb-6 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create New Ad Campaign</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Campaign Title *
                  </label>
                  <input
                    type="text"
                    value={newAd.title}
                    onChange={(e) => setNewAd({...newAd, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                    placeholder="e.g., Summer Sale Campaign"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ad Type *
                  </label>
                  <select
                    value={newAd.ad_type}
                    onChange={(e) => setNewAd({...newAd, ad_type: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                  >
                    <option value="banner">Banner Ad</option>
                    <option value="video">Video Ad</option>
                    <option value="popup">Pop-up Ad</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ad Content *
                  </label>
                  <textarea
                    value={newAd.content}
                    onChange={(e) => setNewAd({...newAd, content: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                    placeholder="Describe your ad content..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Target Audience
                  </label>
                  <input
                    type="text"
                    value={newAd.target_audience}
                    onChange={(e) => setNewAd({...newAd, target_audience: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                    placeholder="e.g., Young Adults 18-35"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Daily Budget (₹) *
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      value={newAd.daily_budget}
                      onChange={(e) => setNewAd({...newAd, daily_budget: e.target.value})}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                      placeholder="1000"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={newAd.start_date}
                    onChange={(e) => setNewAd({...newAd, start_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={newAd.end_date}
                    onChange={(e) => setNewAd({...newAd, end_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                  />
                </div>
                
                {/* Image Upload */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Upload Image (Optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {imageFile ? `Selected: ${imageFile.name}` : 'Click to upload image (JPG, PNG, GIF up to 10MB)'}
                    </p>
                  </div>
                </div>
                
                {/* Video Upload for Video Ads */}
                {newAd.ad_type === 'video' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Upload Video *
                    </label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors relative">
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleVideoUpload(file);
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {videoFile ? `Selected: ${videoFile.name}` : 'Click to upload video (MP4, WebM, OGG up to 100MB)'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => setShowAddForm(false)}
                  disabled={submitting}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddAd}
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-900 dark:bg-blue-700 text-white rounded-md hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Campaign'}
                </button>
              </div>
            </div>
          )}

          {/* Ads List */}
          <div className="space-y-4">
            {filteredAds.map((ad) => (
              <div key={ad.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                {editingAd?.id === ad.id ? (
                  // Edit Form
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Campaign Title
                        </label>
                        <input
                          type="text"
                          value={editingAd.title}
                          onChange={(e) => setEditingAd({...editingAd, title: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Daily Budget (₹)
                        </label>
                        <input
                          type="number"
                          value={editingAd.daily_budget}
                          onChange={(e) => setEditingAd({...editingAd, daily_budget: parseFloat(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Ad Content
                        </label>
                        <textarea
                          value={editingAd.content}
                          onChange={(e) => setEditingAd({...editingAd, content: e.target.value})}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => setEditingAd(null)}
                        disabled={submitting}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdateAd}
                        disabled={submitting}
                        className="px-4 py-2 bg-blue-900 dark:bg-blue-700 text-white rounded-md hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors flex items-center disabled:opacity-50"
                      >
                        <Save className="h-4 w-4 mr-1" />
                        {submitting ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : (
                  // Display Mode
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg mr-3">
                          {getAdTypeIcon(ad.ad_type)}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{ad.title}</h3>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ad.status)}`}>
                              {ad.status.charAt(0).toUpperCase() + ad.status.slice(1)}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                              {ad.ad_type} Ad
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span className="text-sm">{ad.start_date} to {ad.end_date}</span>
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <IndianRupee className="h-4 w-4 mr-2" />
                          <span className="text-sm">₹{ad.daily_budget}/day</span>
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Clock className="h-4 w-4 mr-2" />
                          <span className="text-sm">₹{ad.total_cost.toLocaleString()} total</span>
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <TrendingUp className="h-4 w-4 mr-2" />
                          <span className="text-sm">{Math.ceil((new Date(ad.end_date).getTime() - new Date(ad.start_date).getTime()) / (1000 * 60 * 60 * 24))} days</span>
                        </div>
                      </div>

                      <p className="text-gray-700 dark:text-gray-300 mb-4">{ad.content}</p>
                      
                      {ad.target_audience && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Target: {ad.target_audience}
                        </p>
                      )}

                      {ad.admin_notes && (
                        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            <strong>Admin Notes:</strong> {ad.admin_notes}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {ad.status === 'draft' && (
                        <button
                          onClick={() => handleSubmitForApproval(ad.id)}
                          disabled={submitting}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm transition-colors disabled:opacity-50"
                        >
                          Submit for Approval
                        </button>
                      )}
                      
                      {ad.status === 'active' && (
                        <button
                          onClick={() => handleStatusChange(ad.id, 'paused')}
                          disabled={submitting}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded-md text-sm transition-colors flex items-center disabled:opacity-50"
                        >
                          <Pause className="h-3 w-3 mr-1" />
                          Pause
                        </button>
                      )}
                      
                      {ad.status === 'paused' && (
                        <button
                          onClick={() => handleStatusChange(ad.id, 'active')}
                          disabled={submitting}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm transition-colors flex items-center disabled:opacity-50"
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Resume
                        </button>
                      )}

                      <button
                        onClick={() => navigate(`/user/vendor-ads/${ad.id}/analytics`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm transition-colors flex items-center"
                      >
                        <BarChart className="h-3 w-3 mr-1" />
                        Analytics
                      </button>

                      <button
                        onClick={() => setEditingAd(ad)}
                        disabled={submitting}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50"
                        title="Edit campaign"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteAd(ad.id)}
                        disabled={submitting}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md transition-colors disabled:opacity-50"
                        title="Delete campaign"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredAds.length === 0 && (
            <div className="text-center py-12">
              <Target className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No ad campaigns found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No campaigns match your current filters.' 
                  : 'Create your first ad campaign to start advertising.'}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <button
                  onClick={() => setShowAddForm(true)}
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

export default VendorAdManagement;