import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, CheckCircle, X, AlertTriangle, Search, 
  Filter, Eye, Play, Monitor, Target, Calendar, IndianRupee,
  ThumbsUp, ThumbsDown, User
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase, VendorAd } from '../../services/supabase';
import { VendorAdWorkflowService } from '../../services/vendorAdWorkflow';

const VendorAdApprovals: React.FC = () => {
  const { user } = useAuth();
  const [vendorAds, setVendorAds] = useState<VendorAd[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'active'>('all');
  const [selectedAd, setSelectedAd] = useState<VendorAd | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadVendorAds();
    }
  }, [statusFilter, user]);

  const loadVendorAds = async () => {
    try {
      setLoading(true);
      
      // Load all vendor ad requests
      const { data: requests, error } = await supabase
        .from('vendor_ad_requests')
        .select(`
          *,
          vendor:users!vendor_ad_requests_vendor_id_fkey(name, email),
          reviewer:users!vendor_ad_requests_reviewed_by_fkey(name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      
      // Convert to VendorAd format for compatibility with existing UI
      const convertedAds = requests.map((request: any) => ({
        id: request.id,
        user_id: request.vendor_id,
        title: request.title,
        ad_type: request.ad_type as 'banner' | 'video' | 'popup',
        content: request.content,
        target_audience: request.target_audience,
        start_date: request.requested_start_date,
        end_date: request.requested_end_date,
        daily_budget: request.daily_budget,
        total_cost: request.total_budget,
        status: request.status as 'draft' | 'pending' | 'approved' | 'rejected' | 'active' | 'paused' | 'completed',
        is_active: request.status === 'active',
        admin_notes: request.admin_notes,
        created_at: request.created_at,
        updated_at: request.updated_at,
        image_url: request.image_url || undefined,
        video_url: request.video_url || undefined,
        rejection_reason: request.rejection_reason, // Include rejection_reason
        user: request.vendor
      }));
      
      setVendorAds(convertedAds);
    } catch (error) {
      console.error('Error loading vendor ad requests:', error);
      setMessage('Failed to load vendor ad requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedAd) return;
    
    setSubmitting(true);
    setMessage('');

    try {
      // Try new workflow service first, fallback to old method
      try {
        const result = await VendorAdWorkflowService.approveAdRequest(
          selectedAd.id,
          user!.id,
          adminNotes
        );

        if (result.success) {
          setMessage('Vendor ad approved successfully!');
          await loadVendorAds();
          setSelectedAd(null);
          setAdminNotes('');
        } else {
          setMessage(result.error || 'Failed to approve ad request');
        }
      } catch (workflowError) {
        // Fallback to direct database update
        console.warn('Workflow service failed, using direct update:', workflowError);
        
        // Fallback to direct database update
        const { error: updateError } = await supabase
          .from('vendor_ad_requests')
          .update({
            status: 'approved',
            admin_notes: adminNotes,
            reviewed_by: user!.id,
            reviewed_at: new Date().toISOString()
          })
          .eq('id', selectedAd.id)
          .select()
          .single();

        if (updateError) throw updateError;

        setVendorAds(vendorAds.map(ad => 
          ad.id === selectedAd.id ? { ...ad, status: 'approved', admin_notes: adminNotes } : ad
        ));
        setMessage('Vendor ad approved successfully!');
        setSelectedAd(null);
        setAdminNotes('');
      }
    } catch (error: any) {
      setMessage('Error: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedAd || !rejectionReason.trim()) {
      setMessage('Please provide a reason for rejection');
      return;
    }
    
    setSubmitting(true);
    setMessage('');

    try {
      // Try new workflow service first, fallback to old method
      try {
        const result = await VendorAdWorkflowService.rejectAdRequest(
          selectedAd.id,
          user!.id,
          rejectionReason,
          adminNotes
        );

        if (result.success) {
          setMessage('Vendor ad rejected successfully!');
          await loadVendorAds();
          setSelectedAd(null);
          setAdminNotes('');
          setRejectionReason('');
        } else {
          setMessage(result.error || 'Failed to reject ad request');
        }
      } catch (workflowError) {
        // Fallback to direct database update
        console.warn('Workflow service failed, using direct update:', workflowError);
        
        // Fallback to direct database update
        const { error: updateError } = await supabase
          .from('vendor_ad_requests')
          .update({
            status: 'rejected',
            rejection_reason: rejectionReason,
            admin_notes: adminNotes,
            reviewed_by: user!.id,
            reviewed_at: new Date().toISOString()
          })
          .eq('id', selectedAd.id)
          .select()
          .single();

        if (updateError) throw updateError;

        setVendorAds(vendorAds.map(ad => 
          ad.id === selectedAd.id ? { ...ad, status: 'rejected', rejection_reason: rejectionReason, admin_notes: adminNotes } : ad
        ));
        setMessage('Vendor ad rejected successfully!');
        setSelectedAd(null);
        setAdminNotes('');
        setRejectionReason('');
      }
    } catch (error: any) {
      setMessage('Error: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAds = vendorAds.filter(ad => {
    const matchesSearch = ad.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ad.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ad.user?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ad.status === statusFilter;
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

  const getAdTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Play className="h-4 w-4" />;
      case 'popup': return <Monitor className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Only administrators can access vendor ad approvals.
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
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading pending ads...</p>
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vendor Ad Approvals</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Review and approve vendor advertising campaigns.
          </p>
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
                placeholder="Search vendor ads..."
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
              <option value="active">Active</option>
            </select>

            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
              <Filter className="h-4 w-4 mr-1" />
              {filteredAds.length} of {vendorAds.length} ads
            </div>
          </div>

          {/* Vendor Ads List */}
          <div className="space-y-4">
            {filteredAds.map((ad) => (
              <div key={ad.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow">
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
                        <User className="h-4 w-4 mr-2" />
                        <span className="text-sm">{ad.user?.name}</span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span className="text-sm">{ad.start_date} to {ad.end_date}</span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <IndianRupee className="h-4 w-4 mr-2" />
                        <span className="text-sm">₹{ad.daily_budget}/day</span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Target className="h-4 w-4 mr-2" />
                        <span className="text-sm">₹{ad.total_cost.toLocaleString()} total</span>
                      </div>
                    </div>

                    <p className="text-gray-700 dark:text-gray-300 mb-4">{ad.content}</p>
                    
                    {ad.target_audience && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Target Audience: {ad.target_audience}
                      </p>
                    )}

                    {ad.admin_notes && (
                      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <strong>Admin Notes:</strong> {ad.admin_notes}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedAd(ad)}
                      className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Review
                    </button>
                    
                    {ad.status === 'pending' && (
                      <>
                        <button
                          onClick={() => {
                            setAdminNotes('');
                            setSelectedAd(ad);
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setAdminNotes('');
                            setSelectedAd(ad);
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </button>
                      </>
                    )}
                    
                    {ad.status === 'approved' && (
                      <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                        ✓ Approved - Live on Platform
                      </span>
                    )}
                    
                    {ad.status === 'rejected' && (
                      <span className="text-red-600 dark:text-red-400 text-sm font-medium">
                        ✗ Rejected
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredAds.length === 0 && (
            <div className="text-center py-12">
              <Target className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No vendor ads found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchTerm || statusFilter !== 'all'
                  ? 'No ads match your current filters.' 
                  : 'There are no vendor ads in the system yet.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {selectedAd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Review Vendor Ad</h2>
              <button 
                onClick={() => {
                  setSelectedAd(null);
                  setAdminNotes('');
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4 mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{selectedAd.title}</h3>
                  <div className="flex items-center space-x-4 mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedAd.status)}`}>
                      {selectedAd.status.charAt(0).toUpperCase() + selectedAd.status.slice(1)}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {selectedAd.ad_type} Advertisement
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Advertiser</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedAd.user?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedAd.user?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Campaign Duration</p>
                     <p className="font-medium text-gray-900 dark:text-white">{Math.ceil((new Date(selectedAd.end_date).getTime() - new Date(selectedAd.start_date).getTime()) / (1000 * 60 * 60 * 24))} days</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Budget</p>
                    <p className="font-medium text-gray-900 dark:text-white">₹{selectedAd.total_cost.toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Ad Content</p>
                  <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    {selectedAd.content}
                  </p>
                </div>

                {selectedAd.target_audience && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Target Audience</p>
                    <p className="text-gray-700 dark:text-gray-300">{selectedAd.target_audience}</p>
                  </div>
                )}
              </div>

              {selectedAd.status === 'pending' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Admin Notes {selectedAd.status === 'pending' ? '(Required for rejection)' : ''}
                    </label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder={selectedAd.status === 'pending' ? 'Add approval notes or rejection reason...' : 'View admin notes...'}
                      readOnly={selectedAd.status !== 'pending'}
                    />
                  </div>

                  {selectedAd.status === 'pending' && (
                    <div className="space-y-4 mt-6">
                      <button
                        onClick={handleApprove}
                        disabled={submitting}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-md transition-colors flex items-center justify-center disabled:opacity-50"
                      >
                        {submitting ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <ThumbsUp className="h-4 w-4 mr-2" />
                        )}
                        Approve Ad
                      </button>
                      <button
                        onClick={handleReject}
                        disabled={submitting || !adminNotes.trim()}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-md transition-colors flex items-center justify-center disabled:opacity-50"
                      >
                        {submitting ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <ThumbsDown className="h-4 w-4 mr-2" />
                        )}
                        Reject Ad
                      </button>
                    </div>
                  )}
                  
                  {selectedAd.status !== 'pending' && (
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                        This ad has already been {selectedAd.status}. 
                        {selectedAd.status === 'approved' && ' It is now live on the platform.'}
                        {selectedAd.status === 'rejected' && ' The owner has been notified.'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorAdApprovals;