import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, Search, Filter, Eye, CheckCircle, X, 
  AlertTriangle, FileText, User, Building, Calendar,
  Clock, Shield,
  Phone, Mail, CreditCard, Paperclip
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useDebounce } from '../../hooks/useDebounce';
import { mockKycSubmissions } from '../../data/mockData';
import { 
  supabase,
  getUserKYCDocuments,
  updateUserKYCStatus,
  getUsers
} from '../../services/supabase';
import { User as UserType, KYCDocument } from '../../services/supabase';

interface KYCSubmission extends UserType {
  kyc_documents: KYCDocument[];
  submission_date: string;
  business_name?: string;
  business_type?: string;
  total_documents: number;
  pending_documents: number;
}

const KYCVerificationManagement: React.FC = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'submitted' | 'approved' | 'rejected'>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<KYCSubmission | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  
  // Debounced search term for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  const [checklist, setChecklist] = useState({
    identity_verified: false,
    business_documents_valid: false,
    address_confirmed: false,
    bank_details_verified: false,
    contact_information_verified: false
  });

  useEffect(() => {
    loadKYCSubmissions();
  }, []);

  const loadKYCSubmissions = async () => {
    try {
      setLoading(true);
      
      // Get all billboard owners
      const owners = await getUsers('owner');
      
      // Load KYC documents for each owner
      const submissionsWithDocs: KYCSubmission[] = await Promise.all(
        owners.map(async (owner) => {
          try {
            const documents = await getUserKYCDocuments(owner.id);
            const submissionDate = documents.length > 0 
              ? documents[0].uploaded_at 
              : owner.created_at;
            
            return {
              ...owner,
              kyc_documents: documents,
              submission_date: submissionDate,
              business_name: `${owner.name} Enterprises`, // Mock business name
              business_type: 'Outdoor Advertising',
              total_documents: documents.length,
              pending_documents: documents.filter(doc => doc.status === 'pending').length
            };
          } catch (error) {
            console.warn(`Error loading documents for user ${owner.id}:`, error);
            return {
              ...owner,
              kyc_documents: [],
              submission_date: owner.created_at,
              business_name: `${owner.name} Enterprises`,
              business_type: 'Outdoor Advertising',
              total_documents: 0,
              pending_documents: 0
            };
          }
        })
      );

      // Add mock data if no real submissions exist
      setSubmissions(submissionsWithDocs);
    } catch (error) {
      console.error('Error loading KYC submissions:', error);
      setMessage('Failed to load KYC submissions from database. Using demo data.');
      
      // Use mock data as fallback when Supabase fails
      setSubmissions(mockKycSubmissions);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveKYC = async () => {
    if (!selectedSubmission) return;
    
    setSubmitting(true);
    setMessage('');

    try {
      await updateUserKYCStatus(selectedSubmission.id, 'approved');
      
      // Update local state
      setSubmissions(submissions.map(sub => 
        sub.id === selectedSubmission.id 
          ? { ...sub, kyc_status: 'approved' as const }
          : sub
      ));
      
      // Create notification for user
      await createNotification(
        selectedSubmission.id,
        'KYC Approved',
        'Your KYC verification has been approved. You can now add billboards to your account.',
        'success'
      );
      
      setMessage('KYC approved successfully! User has been notified.');
      setSelectedSubmission(null);
      setReviewNotes('');
      setChecklist({
        identity_verified: false,
        business_documents_valid: false,
        address_confirmed: false,
        bank_details_verified: false,
        contact_information_verified: false
      });
    } catch (error: any) {
      setMessage('Failed to approve KYC: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectKYC = async () => {
    if (!selectedSubmission || !reviewNotes.trim()) {
      setMessage('Please provide a reason for rejection');
      return;
    }
    
    setSubmitting(true);
    setMessage('');

    try {
      await updateUserKYCStatus(selectedSubmission.id, 'rejected', reviewNotes);
      
      // Update local state
      setSubmissions(submissions.map(sub => 
        sub.id === selectedSubmission.id 
          ? { ...sub, kyc_status: 'rejected' as const }
          : sub
      ));
      
      // Create notification for user
      await createNotification(
        selectedSubmission.id,
        'KYC Rejected',
        `Your KYC verification has been rejected. Reason: ${reviewNotes}`,
        'error'
      );
      
      setMessage('KYC rejected successfully! User has been notified.');
      setSelectedSubmission(null);
      setReviewNotes('');
      setChecklist({
        identity_verified: false,
        business_documents_valid: false,
        address_confirmed: false,
        bank_details_verified: false,
        contact_information_verified: false
      });
    } catch (error: any) {
      setMessage('Failed to reject KYC: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const createNotification = async (userId: string, title: string, message: string, type: string) => {
    try {
      if (supabase) {
        await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            title,
            message,
            type,
            is_read: false
          });
      }
    } catch (error) {
      console.warn('Failed to create notification:', error);
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = submission.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                         submission.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                         submission.business_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || submission.kyc_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-400';
      case 'submitted': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400';
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-400';
    }
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'profile_photo': return <User className="h-4 w-4" />;
      case 'aadhar_card': return <CreditCard className="h-4 w-4" />;
      case 'pan_card': return <FileText className="h-4 w-4" />;
      case 'bank_document': return <Building className="h-4 w-4" />;
      default: return <Paperclip className="h-4 w-4" />;
    }
  };

  const getDocumentLabel = (type: string) => {
    switch (type) {
      case 'profile_photo': return 'Profile Photo';
      case 'aadhar_card': return 'Aadhar Card';
      case 'pan_card': return 'PAN Card';
      case 'bank_document': return 'Bank Document';
      default: return 'Document';
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Only administrators can access KYC verification management.
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
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading KYC submissions...</p>
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">KYC Verification Management</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Review and verify billboard owner KYC submissions to enable their account features.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">{filteredSubmissions.length}</span> of <span className="font-medium">{submissions.length}</span> submissions
              </div>
            </div>
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
                placeholder="Search by name, email, or business..."
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
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
              <Filter className="h-4 w-4 mr-1" />
              {filteredSubmissions.length} results
            </div>
          </div>

          {/* KYC Submissions Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700">
                  <th className="text-left p-4 border-b border-gray-200 dark:border-gray-600 font-semibold text-gray-900 dark:text-white">
                    Owner Details
                  </th>
                  <th className="text-left p-4 border-b border-gray-200 dark:border-gray-600 font-semibold text-gray-900 dark:text-white">
                    Business Information
                  </th>
                  <th className="text-left p-4 border-b border-gray-200 dark:border-gray-600 font-semibold text-gray-900 dark:text-white">
                    Documents
                  </th>
                  <th className="text-left p-4 border-b border-gray-200 dark:border-gray-600 font-semibold text-gray-900 dark:text-white">
                    Status
                  </th>
                  <th className="text-left p-4 border-b border-gray-200 dark:border-gray-600 font-semibold text-gray-900 dark:text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map((submission, index) => (
                  <tr key={submission.id} className={`${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700/50'} hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors`}>
                    <td className="p-4 border-b border-gray-200 dark:border-gray-600">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mr-3">
                          <span className="text-white font-semibold text-sm">
                            {submission.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{submission.name}</h3>
                          <div className="flex items-center text-gray-600 dark:text-gray-400 mt-1">
                            <Mail className="h-3 w-3 mr-1" />
                            <span className="text-sm">{submission.email}</span>
                          </div>
                          {submission.phone && (
                            <div className="flex items-center text-gray-600 dark:text-gray-400 mt-1">
                              <Phone className="h-3 w-3 mr-1" />
                              <span className="text-sm">{submission.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 border-b border-gray-200 dark:border-gray-600">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{submission.business_name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{submission.business_type}</p>
                        <div className="flex items-center text-gray-600 dark:text-gray-400 mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span className="text-xs">Submitted: {new Date(submission.submission_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 border-b border-gray-200 dark:border-gray-600">
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {submission.total_documents} document(s)
                          </span>
                        </div>
                        {submission.pending_documents > 0 && (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mr-2" />
                            <span className="text-sm text-yellow-800 dark:text-yellow-300">
                              {submission.pending_documents} pending review
                            </span>
                          </div>
                        )}
                        <div className="flex space-x-1 mt-2">
                          {submission.kyc_documents.slice(0, 3).map((doc, docIndex) => (
                            <div key={docIndex} className="relative group">
                              <img 
                                src={doc.document_url} 
                                alt={getDocumentLabel(doc.document_type)}
                                className="w-8 h-8 object-cover rounded border border-gray-200 dark:border-gray-600 cursor-pointer hover:scale-110 transition-transform"
                                onClick={() => window.open(doc.document_url, '_blank')}
                              />
                              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                                {getDocumentLabel(doc.document_type)}
                              </div>
                            </div>
                          ))}
                          {submission.kyc_documents.length > 3 && (
                            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 flex items-center justify-center">
                              <span className="text-xs text-gray-600 dark:text-gray-400">+{submission.kyc_documents.length - 3}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 border-b border-gray-200 dark:border-gray-600">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(submission.kyc_status)}`}>
                        {submission.kyc_status.charAt(0).toUpperCase() + submission.kyc_status.slice(1)}
                      </span>
                    </td>
                    <td className="p-4 border-b border-gray-200 dark:border-gray-600">
                      <button
                        onClick={() => setSelectedSubmission(submission)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm transition-colors flex items-center"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredSubmissions.length === 0 && (
            <div className="text-center py-12">
              <Shield className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No KYC submissions found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchTerm || statusFilter !== 'all'
                  ? 'No submissions match your current filters.' 
                  : 'There are no KYC submissions to review at the moment.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* KYC Review Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">KYC Review - {selectedSubmission.name}</h2>
              <button 
                onClick={() => {
                  setSelectedSubmission(null);
                  setReviewNotes('');
                  setChecklist({
                    identity_verified: false,
                    business_documents_valid: false,
                    address_confirmed: false,
                    bank_details_verified: false,
                    contact_information_verified: false
                  });
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Owner Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Owner Information</h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Full Name</p>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedSubmission.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Email Address</p>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedSubmission.email}</p>
                      </div>
                    </div>
                    {selectedSubmission.phone && (
                      <div className="flex items-center">
                        <Phone className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Phone Number</p>
                          <p className="font-medium text-gray-900 dark:text-white">{selectedSubmission.phone}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center">
                      <Building className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Business Name</p>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedSubmission.business_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Shield className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Current Status</p>
                        <span className={`inline-block px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedSubmission.kyc_status)}`}>
                          {selectedSubmission.kyc_status.charAt(0).toUpperCase() + selectedSubmission.kyc_status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verification Checklist */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Verification Checklist</h3>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={checklist.identity_verified}
                        onChange={(e) => setChecklist({...checklist, identity_verified: e.target.checked})}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">Identity documents verified</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={checklist.business_documents_valid}
                        onChange={(e) => setChecklist({...checklist, business_documents_valid: e.target.checked})}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">Business documents valid</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={checklist.address_confirmed}
                        onChange={(e) => setChecklist({...checklist, address_confirmed: e.target.checked})}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">Address confirmed</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={checklist.bank_details_verified}
                        onChange={(e) => setChecklist({...checklist, bank_details_verified: e.target.checked})}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">Bank details verified</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={checklist.contact_information_verified}
                        onChange={(e) => setChecklist({...checklist, contact_information_verified: e.target.checked})}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">Contact information verified</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Documents Section */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Submitted Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {selectedSubmission.kyc_documents.map((document) => (
                    <div key={document.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg mr-3">
                          {getDocumentIcon(document.document_type)}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{getDocumentLabel(document.document_type)}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Uploaded: {new Date(document.uploaded_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <img 
                          src={document.document_url} 
                          alt={getDocumentLabel(document.document_type)}
                          className="w-full h-32 object-cover rounded border border-gray-200 dark:border-gray-600 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => window.open(document.document_url, '_blank')}
                        />
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>
                          {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                        </span>
                        <button
                          onClick={() => window.open(document.document_url, '_blank')}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review Notes */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Review Notes</h3>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Add notes about the verification decision (required for rejection)..."
                />
              </div>

              {/* Action Buttons */}
              {selectedSubmission.kyc_status === 'submitted' && (
                <div className="mt-8 flex justify-end space-x-4">
                  <button
                    onClick={handleRejectKYC}
                    disabled={submitting || !reviewNotes.trim()}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-md transition-colors flex items-center disabled:opacity-50"
                  >
                    {submitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <X className="h-4 w-4 mr-2" />
                    )}
                    Reject KYC
                  </button>
                  <button
                    onClick={handleApproveKYC}
                    disabled={submitting}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md transition-colors flex items-center disabled:opacity-50"
                  >
                    {submitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Approve KYC
                  </button>
                </div>
              )}

              {/* Status Information */}
              {selectedSubmission.kyc_status !== 'submitted' && (
                <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center">
                    <Shield className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-gray-700 dark:text-gray-300">
                      This KYC submission has already been {selectedSubmission.kyc_status}.
                      {selectedSubmission.kyc_status === 'approved' && ' The owner can now add billboards to their account.'}
                      {selectedSubmission.kyc_status === 'rejected' && ' The owner needs to resubmit their documents.'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KYCVerificationManagement;