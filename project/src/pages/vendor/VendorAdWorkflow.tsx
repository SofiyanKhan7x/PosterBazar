import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Target, CheckCircle, AlertTriangle,
  Clock, CreditCard, Eye, BarChart
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { VendorAdWorkflowService, VendorAdRequest } from '../../services/vendorAdWorkflow';
import VendorAdRequestForm from '../../components/VendorAdRequestForm';
import VendorNotificationCenter from '../../components/VendorNotificationCenter';
import VendorPaymentProcessor from '../../components/VendorPaymentProcessor';

const VendorAdWorkflow: React.FC = () => {
  const { user } = useAuth();
  const [adRequests, setAdRequests] = useState<VendorAdRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedRequestForPayment, setSelectedRequestForPayment] = useState<VendorAdRequest | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      loadAdRequests();
    }
  }, [user]);

  const loadAdRequests = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const requests = await VendorAdWorkflowService.getVendorAdRequests(user.id);
      setAdRequests(requests);
    } catch (error) {
      console.error('Error loading ad requests:', error);
      setMessage('Failed to load ad requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSuccess = (requestId: string) => {
    console.log('Ad request created:', requestId);
    setMessage('Ad request submitted successfully!');
    loadAdRequests(); // Refresh the list
  };

  const handlePaymentRequired = (adRequestId: string) => {
    const request = adRequests.find(req => req.id === adRequestId);
    if (request) {
      setSelectedRequestForPayment(request);
      setShowPaymentModal(true);
    }
  };

  const handlePaymentSuccess = (paymentId: string) => {
    console.log('Payment completed:', paymentId);
    setMessage('Payment completed successfully! Your ad will be live shortly.');
    loadAdRequests(); // Refresh to show updated status
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400';
      case 'approved': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400';
      case 'payment_pending': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-400';
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400';
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400';
      case 'completed': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-400';
      case 'cancelled': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <AlertTriangle className="h-4 w-4" />;
      case 'payment_pending': return <CreditCard className="h-4 w-4" />;
      case 'paid': case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'pending': return 'Under admin review';
      case 'approved': return 'Approved - Payment required';
      case 'rejected': return 'Rejected - See details';
      case 'payment_pending': return 'Payment required';
      case 'paid': return 'Payment completed - Going live';
      case 'active': return 'Live on platform';
      case 'completed': return 'Campaign completed';
      case 'cancelled': return 'Campaign cancelled';
      default: return 'Unknown status';
    }
  };

  if (!user || (user.role !== 'vendor' && user.role !== 'user')) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Only vendors and advertisers can access the ad workflow.
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
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading ad campaigns...</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Advertisement Campaigns</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  Manage your advertising campaigns from request to display.
                </p>
              </div>
              <button
                onClick={() => setShowRequestForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                New Ad Request
              </button>
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-lg border ${
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

          {/* Ad Requests List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Your Ad Requests ({adRequests.length})
              </h2>
            </div>

            <div className="p-6">
              {adRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Target className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No ad requests yet</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Create your first advertisement request to start promoting your business.
                  </p>
                  <button
                    onClick={() => setShowRequestForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    Create Your First Ad
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {adRequests.map((request) => (
                    <div key={request.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{request.title}</h3>
                            <div className="ml-3 flex items-center space-x-2">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${getStatusColor(request.status)}`}>
                                {getStatusIcon(request.status)}
                                <span className="ml-1 capitalize">{request.status.replace('_', ' ')}</span>
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                            {getStatusMessage(request.status)}
                          </p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Campaign Period</p>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {request.requested_start_date} - {request.requested_end_date}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Daily Budget</p>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                ₹{request.daily_budget.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Total Budget</p>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                ₹{request.total_budget.toLocaleString()}
                              </p>
                            </div>
                          </div>

                          <p className="text-gray-700 dark:text-gray-300 text-sm">
                            {request.content}
                          </p>

                          {request.rejection_reason && (
                            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                              <p className="text-red-800 dark:text-red-200 text-sm">
                                <strong>Rejection Reason:</strong> {request.rejection_reason}
                              </p>
                            </div>
                          )}

                          {request.admin_notes && (
                            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                              <p className="text-blue-800 dark:text-blue-200 text-sm">
                                <strong>Admin Notes:</strong> {request.admin_notes}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          {request.status === 'approved' && (
                            <button
                              onClick={() => handlePaymentRequired(request.id)}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                            >
                              <CreditCard className="h-4 w-4 mr-1" />
                              Make Payment
                            </button>
                          )}
                          
                          {(request.status === 'active' || request.status === 'completed') && (
                            <button
                              onClick={() => window.location.href = `/vendor/campaigns/${request.id}/analytics`}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                            >
                              <BarChart className="h-4 w-4 mr-1" />
                              Analytics
                            </button>
                          )}

                          <button
                            onClick={() => window.location.href = `/vendor/campaigns/${request.id}`}
                            className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center hover:bg-gray-200 dark:hover:bg-gray-600"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Notification Center */}
          <VendorNotificationCenter onPaymentRequired={handlePaymentRequired} />

          {/* Quick Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Campaign Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Requests:</span>
                <span className="font-medium text-gray-900 dark:text-white">{adRequests.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Pending Review:</span>
                <span className="font-medium text-yellow-600 dark:text-yellow-400">
                  {adRequests.filter(req => req.status === 'pending').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Active Campaigns:</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {adRequests.filter(req => req.status === 'active').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Spent:</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  ₹{adRequests
                    .filter(req => req.status === 'paid' || req.status === 'active' || req.status === 'completed')
                    .reduce((sum, req) => sum + req.total_budget, 0)
                    .toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Workflow Guide */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-4">Ad Workflow</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">1</div>
                <span className="text-blue-800 dark:text-blue-200 text-sm">Submit ad request</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">2</div>
                <span className="text-blue-800 dark:text-blue-200 text-sm">Admin reviews & approves</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">3</div>
                <span className="text-blue-800 dark:text-blue-200 text-sm">Complete payment</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">4</div>
                <span className="text-blue-800 dark:text-blue-200 text-sm">Ad goes live on platform</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">5</div>
                <span className="text-blue-800 dark:text-blue-200 text-sm">Track performance & analytics</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <VendorAdRequestForm
        isOpen={showRequestForm}
        onClose={() => setShowRequestForm(false)}
        onSuccess={handleRequestSuccess}
      />

      {selectedRequestForPayment && (
        <VendorPaymentProcessor
          adRequestId={selectedRequestForPayment.id}
          amount={selectedRequestForPayment.total_budget}
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedRequestForPayment(null);
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default VendorAdWorkflow;