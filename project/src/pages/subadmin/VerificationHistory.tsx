import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, CheckCircle, AlertTriangle, 
   Search, Filter, Eye, MapPin, User, Clock, FileText, X
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../services/supabase';

interface VerificationRecord {
  id: string;
  billboard_id: string;
  billboard_title: string;
  location_address: string;
  owner_name: string;
  visit_date: string;
  is_verified: boolean;
  verification_notes: string;
  owner_selfie_url?: string;
  billboard_photo_url?: string;
  location_accuracy?: string;
  structural_condition?: string;
  visibility_rating?: number;
  issues_found?: string[];
  recommendations?: string;
}

const VerificationHistory: React.FC = () => {
  const { user } = useAuth();
  const [verifications, setVerifications] = useState<VerificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'rejected'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month' | 'quarter'>('all');
  const [selectedRecord, setSelectedRecord] = useState<VerificationRecord | null>(null);

  useEffect(() => {
    loadVerificationHistory();
  }, [user]);

  const loadVerificationHistory = async () => {
    if (!user) return;

    try {
      if (!supabase) {
        throw new Error('Database service not available');
      }

      const { data, error } = await supabase
        .from('site_visits')
        .select(`
          *,
          billboard:billboards(title, location_address, owner:users!billboards_owner_id_fkey(name))
        `)
        .eq('sub_admin_id', user.id)
        .order('visit_date', { ascending: false });

      if (error) {
        console.error('Error loading verification history:', error);
      } else {
        const records = (data || []).map((visit: any) => ({
          id: visit.id,
          billboard_id: visit.billboard_id,
          billboard_title: visit.billboard?.title || 'Unknown Billboard',
          location_address: visit.billboard?.location_address || 'Unknown Location',
          owner_name: visit.billboard?.owner?.name || 'Unknown Owner',
          visit_date: visit.visit_date,
          is_verified: visit.is_verified,
          verification_notes: visit.verification_notes || '',
          owner_selfie_url: visit.owner_selfie_url,
          billboard_photo_url: visit.billboard_photo_url,
          location_accuracy: visit.location_accuracy,
          structural_condition: visit.structural_condition,
          visibility_rating: visit.visibility_rating,
          issues_found: visit.issues_found || [],
          recommendations: visit.recommendations
        })) || [];
        
        setVerifications(records);
      }
    } catch (error) {
      console.error('Error loading verification history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVerifications = verifications.filter(record => {
    const matchesSearch = record.billboard_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.location_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.owner_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'verified' && record.is_verified) ||
                         (statusFilter === 'rejected' && !record.is_verified);
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const visitDate = new Date(record.visit_date);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - visitDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      switch (dateFilter) {
        case 'week':
          matchesDate = diffDays <= 7;
          break;
        case 'month':
          matchesDate = diffDays <= 30;
          break;
        case 'quarter':
          matchesDate = diffDays <= 90;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusColor = (isVerified: boolean) => {
    return isVerified 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400'
      : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400';
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'text-green-600 dark:text-green-400';
      case 'good': return 'text-blue-600 dark:text-blue-400';
      case 'fair': return 'text-yellow-600 dark:text-yellow-400';
      case 'poor': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading verification history...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Verification History</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            View all your completed billboard verifications and their details.
          </p>
        </div>

        <div className="p-6">
          {/* Filters */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search verifications..."
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
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Time</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
            </select>

            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
              <Filter className="h-4 w-4 mr-1" />
              {filteredVerifications.length} of {verifications.length} records
            </div>
          </div>

          {/* Verification Records */}
          <div className="space-y-4">
            {filteredVerifications.map((record) => (
              <div key={record.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{record.billboard_title}</h3>
                      <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.is_verified)}`}>
                        {record.is_verified ? 'Verified' : 'Rejected'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span className="text-sm">{record.location_address}</span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <User className="h-4 w-4 mr-2" />
                        <span className="text-sm">Owner: {record.owner_name}</span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span className="text-sm">{new Date(record.visit_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Clock className="h-4 w-4 mr-2" />
                        <span className="text-sm">{new Date(record.visit_date).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    {record.verification_notes && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <strong>Notes:</strong> {record.verification_notes.length > 100 
                            ? `${record.verification_notes.substring(0, 100)}...` 
                            : record.verification_notes}
                        </p>
                      </div>
                    )}

                    {(record.owner_selfie_url || record.billboard_photo_url) && (
                      <div className="flex space-x-4 mb-4">
                        {record.owner_selfie_url && (
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Owner Selfie</p>
                            <img 
                              src={record.owner_selfie_url} 
                              alt="Owner selfie" 
                              className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                            />
                          </div>
                        )}
                        {record.billboard_photo_url && (
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Billboard Photo</p>
                            <img 
                              src={record.billboard_photo_url} 
                              alt="Billboard photo" 
                              className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedRecord(record)}
                    className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredVerifications.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No verification records found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' 
                  ? 'No records match your current filters.' 
                  : 'You haven\'t completed any verifications yet.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Verification Details Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Verification Details</h2>
              <button 
                onClick={() => setSelectedRecord(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Billboard Information</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Title</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedRecord.billboard_title}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedRecord.location_address}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Owner</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedRecord.owner_name}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Verification Results</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <div className={`p-1 rounded-full ${selectedRecord.is_verified ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'}`}>
                        {selectedRecord.is_verified ? (
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {selectedRecord.is_verified ? 'Verified' : 'Rejected'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Visit Date</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(selectedRecord.visit_date).toLocaleString()}
                      </p>
                    </div>
                    {selectedRecord.location_accuracy && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Location Accuracy</p>
                        <p className="font-medium text-gray-900 dark:text-white capitalize">{selectedRecord.location_accuracy}</p>
                      </div>
                    )}
                    {selectedRecord.structural_condition && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Structural Condition</p>
                        <p className={`font-medium capitalize ${getConditionColor(selectedRecord.structural_condition)}`}>
                          {selectedRecord.structural_condition}
                        </p>
                      </div>
                    )}
                    {selectedRecord.visibility_rating && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Visibility Rating</p>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedRecord.visibility_rating}/10</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {selectedRecord.owner_selfie_url && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Owner Selfie</p>
                    <img 
                      src={selectedRecord.owner_selfie_url} 
                      alt="Owner selfie" 
                      className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                    />
                  </div>
                )}
                {selectedRecord.billboard_photo_url && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Billboard Photo</p>
                    <img 
                      src={selectedRecord.billboard_photo_url} 
                      alt="Billboard photo" 
                      className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-2">Verification Notes</h3>
                  <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    {selectedRecord.verification_notes || 'No notes provided.'}
                  </p>
                </div>

                {selectedRecord.issues_found && selectedRecord.issues_found.length > 0 && (
                  <div>
                    <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-2">Issues Found</h3>
                    <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      {selectedRecord.issues_found.map((issue, index) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedRecord.recommendations && (
                  <div>
                    <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-2">Recommendations</h3>
                    <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      {selectedRecord.recommendations}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default VerificationHistory;