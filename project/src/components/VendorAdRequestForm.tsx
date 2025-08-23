import React, { useState, useEffect } from 'react';
import { 
  Target, Upload, Calendar, IndianRupee,
  Video, Monitor, Bell, CheckCircle, AlertTriangle,
  Send, X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { VendorAdWorkflowService } from '../services/vendorAdWorkflow';

interface VendorAdRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (requestId: string) => void;
}

const VendorAdRequestForm: React.FC<VendorAdRequestFormProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    ad_type: 'notification' as 'notification' | 'video' | 'banner' | 'popup' | 'billboard_offer',
    title: '',
    description: '',
    content: '',
    target_audience: '',
    campaign_objectives: '',
    requested_start_date: '',
    requested_end_date: '',
    daily_budget: '',
    priority_level: 1
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  useEffect(() => {
    if (isOpen) {
      // Set default start date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setFormData(prev => ({
        ...prev,
        requested_start_date: tomorrow.toISOString().split('T')[0]
      }));
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (file: File, type: 'image' | 'video') => {
    const maxSize = type === 'image' ? 10 * 1024 * 1024 : 100 * 1024 * 1024; // 10MB for images, 100MB for videos
    const allowedTypes = type === 'image' 
      ? ['image/jpeg', 'image/png', 'image/gif']
      : ['video/mp4', 'video/webm', 'video/mov'];

    if (file.size > maxSize) {
      setMessage(`${type === 'image' ? 'Image' : 'Video'} file size must be less than ${type === 'image' ? '10MB' : '100MB'}`);
      setMessageType('error');
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setMessage(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
      setMessageType('error');
      return;
    }

    if (type === 'image') {
      setImageFile(file);
    } else {
      setVideoFile(file);
    }
    
    setMessage('');
  };

  const calculatePricing = () => {
    if (!formData.daily_budget || !formData.requested_start_date || !formData.requested_end_date) {
      return null;
    }

    const startDate = new Date(formData.requested_start_date);
    const endDate = new Date(formData.requested_end_date);
    const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (durationDays <= 0) return null;

    return VendorAdWorkflowService.calculateAdPricing(
      parseFloat(formData.daily_budget),
      durationDays
    );
  };

  const handleSubmit = async () => {
    if (!user) {
      setMessage('User not authenticated');
      setMessageType('error');
      return;
    }

    // Validate required fields
    if (!formData.title.trim() || !formData.content.trim() || !formData.requested_start_date || !formData.requested_end_date || !formData.daily_budget) {
      setMessage('Please fill in all required fields');
      setMessageType('error');
      return;
    }

    // Validate video file for video ads
    if (formData.ad_type === 'video' && !videoFile) {
      setMessage('Video file is required for video advertisements');
      setMessageType('error');
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      // Upload media files first
      let imageUrl = '';
      let videoUrl = '';

      if (imageFile) {
        const imageUpload = await VendorAdWorkflowService.uploadAdMedia(
          imageFile, user.id, 'temp', 'image'
        );
        if (imageUpload.success) {
          imageUrl = imageUpload.url || '';
        }
      }

      if (videoFile) {
        const videoUpload = await VendorAdWorkflowService.uploadAdMedia(
          videoFile, user.id, 'temp', 'video'
        );
        if (videoUpload.success) {
          videoUrl = videoUpload.url || '';
        }
      }

      // Submit ad request
      const result = await VendorAdWorkflowService.submitAdRequest({
        vendor_id: user.id,
        ad_type: formData.ad_type,
        title: formData.title,
        description: formData.description,
        content: formData.content,
        image_url: imageUrl,
        video_url: videoUrl,
        target_audience: formData.target_audience,
        campaign_objectives: formData.campaign_objectives,
        requested_start_date: formData.requested_start_date,
        requested_end_date: formData.requested_end_date,
        daily_budget: parseFloat(formData.daily_budget),
        priority_level: formData.priority_level
      });

      if (result.success && result.request) {
        setMessage('Ad request submitted successfully! It will be reviewed by our admin team.');
        setMessageType('success');
        
        setTimeout(() => {
          onSuccess(result.request!.id);
          onClose();
        }, 2000);
      } else {
        setMessage(result.error || 'Failed to submit ad request');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error submitting ad request:', error);
      setMessage('Failed to submit ad request. Please try again.');
      setMessageType('error');
    } finally {
      setSubmitting(false);
    }
  };

  const getAdTypeIcon = (type: string) => {
    switch (type) {
      case 'notification': return <Bell className="h-5 w-5" />;
      case 'video': return <Video className="h-5 w-5" />;
      case 'popup': return <Monitor className="h-5 w-5" />;
      default: return <Target className="h-5 w-5" />;
    }
  };

  const getAdTypeDescription = (type: string) => {
    switch (type) {
      case 'notification': return 'Small notification-style ads with high visibility';
      case 'video': return 'Full motion video ads with audio support';
      case 'banner': return 'Traditional banner advertisements';
      case 'popup': return 'Interactive popup ads with call-to-action';
      case 'billboard_offer': return 'Special offers for billboard bookings';
      default: return 'Advertisement type';
    }
  };

  const pricing = calculatePricing();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Submit Advertisement Request</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6">
          {message && (
            <div className={`mb-6 p-4 rounded-lg border ${
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Fields */}
            <div className="lg:col-span-2 space-y-6">
              {/* Ad Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Advertisement Type *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(['notification', 'video', 'banner', 'popup', 'billboard_offer'] as const).map((type) => (
                    <div
                      key={type}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        formData.ad_type === type
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, ad_type: type }))}
                    >
                      <div className="flex items-center mb-2">
                        <div className={`p-2 rounded-lg mr-3 ${
                          formData.ad_type === type
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}>
                          {getAdTypeIcon(type)}
                        </div>
                        <h3 className="font-medium text-gray-900 dark:text-white capitalize">
                          {type === 'billboard_offer' ? 'Billboard Offer' : `${type} Ad`}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {getAdTypeDescription(type)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Campaign Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Summer Sale Campaign"
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
                      name="daily_budget"
                      value={formData.daily_budget}
                      onChange={handleInputChange}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="1000"
                      min="100"
                    />
                  </div>
                </div>
              </div>

              {/* Campaign Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      name="requested_start_date"
                      value={formData.requested_start_date}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      name="requested_end_date"
                      value={formData.requested_end_date}
                      onChange={handleInputChange}
                      min={formData.requested_start_date || new Date().toISOString().split('T')[0]}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Content Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Advertisement Content *
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="The main content that will be displayed in your advertisement"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Campaign Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Brief description of your campaign goals and strategy"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Target Audience
                  </label>
                  <input
                    type="text"
                    name="target_audience"
                    value={formData.target_audience}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Young adults 18-35"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Campaign Objectives
                  </label>
                  <input
                    type="text"
                    name="campaign_objectives"
                    value={formData.campaign_objectives}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Brand awareness, lead generation"
                  />
                </div>
              </div>

              {/* File Uploads */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Upload Image {formData.ad_type === 'video' ? '(Optional)' : '(Recommended)'}
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

                {formData.ad_type === 'video' && (
                  <div>
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
              </div>
            </div>

            {/* Pricing Summary */}
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pricing Summary</h3>
                
                {pricing ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Base Amount:</span>
                      <span className="font-medium text-gray-900 dark:text-white">₹{pricing.baseAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Platform Fee (10%):</span>
                      <span className="font-medium text-gray-900 dark:text-white">₹{pricing.platformFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">GST (18%):</span>
                      <span className="font-medium text-gray-900 dark:text-white">₹{pricing.gstAmount.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                      <div className="flex justify-between">
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">Total Amount:</span>
                        <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">₹{pricing.totalAmount.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {pricing.breakdown.calculation}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">Enter campaign details to see pricing</p>
                )}
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-4">What Happens Next?</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">1</div>
                    <span className="text-blue-800 dark:text-blue-200 text-sm">Admin reviews your request (24-48 hours)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">2</div>
                    <span className="text-blue-800 dark:text-blue-200 text-sm">You'll receive approval notification</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">3</div>
                    <span className="text-blue-800 dark:text-blue-200 text-sm">Complete payment to activate your ad</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">4</div>
                    <span className="text-blue-800 dark:text-blue-200 text-sm">Your ad goes live on the platform</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-4">
            <button
              onClick={onClose}
              disabled={submitting}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 flex items-center"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit for Review
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorAdRequestForm;