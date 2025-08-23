import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, CheckCircle, X, AlertTriangle, MapPin, 
  User, Calendar, Eye, Search, Filter, FileText, 
  ThumbsUp, ThumbsDown, RotateCcw
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { 
  approveBillboard, 
  rejectBillboard, 
  requestReverification,
  supabase,
  assignBillboardToSubAdmin,
  getUsers
} from '../../services/supabase';
import { Billboard } from '../../services/supabase';

interface ExtendedBillboard extends Billboard {
  site_visits?: {
    id: string;
    is_verified: boolean;
    verification_notes: string;
    visit_date: string;
    sub_admin: {
      name: string;
    };
  }[];
  assignment?: {
    sub_admin_id: string;
    sub_admin_name: string;
    assigned_at: string;
    status: string;
  };
}

const AdminBillboardApprovals: React.FC = () => {
  const { user } = useAuth();
  const [billboards, setBillboards] = useState<ExtendedBillboard[]>([]);
  const [subAdmins, setSubAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'active'>('all');
  const [selectedBillboard, setSelectedBillboard] = useState<ExtendedBillboard | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedSubAdmin, setSelectedSubAdmin] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [assignmentPriority, setAssignmentPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');

  useEffect(() => {
    loadBillboards();
    loadSubAdmins();
  }, [user]);

  const loadBillboards = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get all billboards with their site visits and owner information
      const { data, error } = await supabase
        .from('billboards')
        .select(`
          *,
          owner:users!billboards_owner_id_fkey(name, email),
          billboard_images(id, image_url, image_type),
          billboard_type:billboard_types(type_name),
          assignment:billboard_assignments!billboard_assignments_billboard_id_fkey(
            sub_admin_id,
            status,
            assigned_at,
            sub_admin:users!billboard_assignments_sub_admin_id_fkey(name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading billboards:', error);
        return;
      }
      
      // Convert to extended billboard type with site visits
      const extendedBillboards: ExtendedBillboard[] = (data || []).map((billboard: any) => ({
        ...billboard,
        site_visits: [], // We'll fetch site visits separately
        assignment: billboard.assignment && billboard.assignment.length > 0 ? {
          sub_admin_id: billboard.assignment[0].sub_admin_id,
          sub_admin_name: billboard.assignment[0].sub_admin?.name || 'Unknown',
          assigned_at: billboard.assignment[0].assigned_at,
          status: billboard.assignment[0].status
        } : undefined
      }));
      
      // Fetch site visits for each billboard
      for (const billboard of extendedBillboards) {
        try {
          const { data: siteVisits } = await supabase
            .from('site_visits')
            .select(`
              id, 
              is_verified, 
              verification_notes, 
              visit_date,
              sub_admin:users!site_visits_sub_admin_id_fkey(name)
            `)
            .eq('billboard_id', billboard.id);
            
          if (siteVisits) {
            billboard.site_visits = siteVisits;
          }
        } catch (error) {
          console.error(`Error fetching site visits for billboard ${billboard.id}:`, error);
        }
      }
      
      setBillboards(extendedBillboards);
    } catch (error) {
      console.error('Error loading billboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSubAdmins = async () => {
    try {
      const users = await getUsers('sub_admin');
      setSubAdmins(users.filter(u => u.is_active));
    } catch (error) {
      console.error('Error loading sub-admins:', error);
    }
  };

  const handleApprove = async () => {
    if (!selectedBillboard || !user) return;
    
    setSubmitting(true);
    setMessage('');

    try {
      await approveBillboard(selectedBillboard.id, adminNotes);
      
      setMessage('Billboard approved successfully!');
      
      // Update local state
      setBillboards(billboards.map(b => 
        b.id === selectedBillboard.id 
          ? { ...b, status: 'approved' as const, admin_notes: adminNotes }
          : b
      ));
      
      // Close modal after a delay
      setTimeout(() => {
        setSelectedBillboard(null);
        setAdminNotes('');
        // Show assignment modal for approved billboards
        setShowAssignModal(true);
        // Refresh the billboard list
        loadBillboards();
      }, 2000);

    } catch (error: any) {
      setMessage('Error: ' + error.message);
      console.error('Approval error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignToSubAdmin = async () => {
    if (!selectedBillboard || !selectedSubAdmin || !user) return;

    try {
      setSubmitting(true);
      
      console.log('🔄 Assigning billboard to sub-admin:', {
        billboardId: selectedBillboard.id,
        subAdminId: selectedSubAdmin,
        adminId: user.id,
        priority: assignmentPriority
      });
      
      const result = await assignBillboardToSubAdmin(
        selectedBillboard.id,
        selectedSubAdmin,
        user.id,
        assignmentPriority,
        assignmentNotes
      );

      console.log('📊 Assignment result:', result);

      if (result.success) {
        setMessage(`Billboard assigned to sub-admin successfully!`);
        setShowAssignModal(false);
        setSelectedSubAdmin('');
        setAssignmentNotes('');
        setAssignmentPriority('medium');
        
        // Update local state immediately for better UX
        setBillboards(billboards.map(b => 
          b.id === selectedBillboard.id 
            ? { 
                ...b, 
                assignment: {
                  sub_admin_id: selectedSubAdmin,
                  sub_admin_name: subAdmins.find(sa => sa.id === selectedSubAdmin)?.name || 'Unknown',
                  assigned_at: new Date().toISOString(),
                  status: 'pending'
                }
              }
            : b
        ));
        
        // Also reload to ensure data consistency
        setTimeout(() => {
          loadBillboards();
        }, 1000);
      } else {
        console.warn('⚠️ Assignment failed:', result.error);
        
        // Handle specific error types
        if (result.error && (
          result.error.includes('duplicate key value violates unique constraint') ||
          result.error.includes('already assigned') ||
          result.error.includes('assignment already exists')
        )) {
          setMessage('This billboard is already assigned to the selected sub-admin. The assignment has been updated with new details.');
          
          // Still update the UI to show the assignment
          setBillboards(billboards.map(b => 
            b.id === selectedBillboard.id 
              ? { 
                  ...b, 
                  assignment: {
                    sub_admin_id: selectedSubAdmin,
                    sub_admin_name: subAdmins.find(sa => sa.id === selectedSubAdmin)?.name || 'Unknown',
                    assigned_at: new Date().toISOString(),
                    status: 'pending'
                  }
                }
              : b
          ));
          
          setShowAssignModal(false);
          setSelectedSubAdmin('');
          setAssignmentNotes('');
          setAssignmentPriority('medium');
        } else if (result.error && result.error.includes('Sub-admin not found')) {
          setMessage('The selected sub-admin account could not be found. Please refresh the page and try again.');
        } else if (result.error && result.error.includes('Billboard not found')) {
          setMessage('The billboard could not be found. Please refresh the page and try again.');
        } else {
          setMessage(`Failed to assign billboard: ${result.error || 'Unknown error occurred'}`);
        }
      }
    } catch (error: any) {
      console.error('❌ Assignment error:', error);
      setMessage(`Error assigning billboard: ${error.message || 'System error occurred'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedBillboard) return;
    
    if (!rejectionReason.trim()) {
      setMessage('Please provide a reason for rejection');
      return;
    }
    
    setSubmitting(true);
    setMessage('');

    try {
      await rejectBillboard(selectedBillboard.id, rejectionReason);
      
      setMessage('Billboard rejected successfully!');
      
      // Update local state
      setBillboards(billboards.map(b => 
        b.id === selectedBillboard.id 
          ? { 
              ...b, 
              status: 'rejected' as const, 
              admin_notes: adminNotes,
              rejection_reason: rejectionReason
            }
          : b
      ));
      
      // Close modal after a delay
      setTimeout(() => {
        setSelectedBillboard(null);
        setAdminNotes('');
        setRejectionReason('');
        // Refresh the billboard list
        loadBillboards();
      }, 2000);

    } catch (error: any) {
      setMessage('Error: ' + error.message);
      console.error('Rejection error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestReverification = async (billboardId: string) => {
    if (!confirm('Are you sure you want to request re-verification for this billboard?')) {
      return;
    }

    try {
      await requestReverification(billboardId);
      alert('Re-verification requested successfully');
      // Refresh the billboard list
      loadBillboards();
    } catch (error) {
      console.error('Error requesting re-verification:', error);
      alert('Failed to request re-verification');
    }
  };

  const filteredBillboards = billboards.filter(billboard => {
    const matchesSearch = billboard.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         billboard.location_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         billboard.owner?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || billboard.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400';
      case 'approved': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400';
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-400';
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Only administrators can access this page.
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
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading billboards...</p>
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Billboard Approvals</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Review, approve, or reject billboard submissions and manage verification requests.
          </p>
        </div>

        <div className="p-6">
          {/* Filters */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search billboards..."
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
              <option value="pending">Pending Approval</option>
              <option value="approved">Pending Verification</option>
              <option value="active">Active</option>
              <option value="rejected">Rejected</option>
            </select>

            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
              <Filter className="h-4 w-4 mr-1" />
              {filteredBillboards.length} of {billboards.length} billboards
            </div>
          </div>

          {/* Billboards List */}
          <div className="space-y-4">
            {filteredBillboards.map((billboard) => (
              <div key={billboard.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{billboard.title}</h3>
                      <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(billboard.status)}`}>
                        {billboard.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span className="text-sm">{billboard.location_address}</span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <User className="h-4 w-4 mr-2" />
                        <span className="text-sm">Owner: {billboard.owner?.name}</span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span className="text-sm">{new Date(billboard.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {billboard.site_visits && billboard.site_visits.length > 0 && (
                      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                          Verification by {billboard.site_visits[0].sub_admin.name} on {new Date(billboard.site_visits[0].visit_date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                          {billboard.site_visits[0].verification_notes}
                        </p>
                      </div>
                    )}

                    {billboard.billboard_images && billboard.billboard_images.length > 0 && (
                      <div className="flex space-x-4 mb-4">
                        {billboard.billboard_images.slice(0, 3).map((image) => (
                          <div key={image.id} className="cursor-pointer" onClick={() => window.open(image.image_url, '_blank')}>
                            <img 
                              src={image.image_url} 
                              alt={`Billboard ${image.image_type}`} 
                              className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-600 hover:opacity-80 transition-opacity"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center capitalize">
                              {image.image_type}
                            </p>
                          </div>
                        ))}
                        {billboard.billboard_images.length > 3 && (
                          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">+{billboard.billboard_images.length - 3}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedBillboard(billboard)}
                      className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </button>
                    
                    {billboard.status === 'pending' && (
                      <>
                        <button
                          onClick={() => {
                            setAdminNotes('');
                            setRejectionReason('');
                            setSelectedBillboard(billboard);
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
                            setSelectedBillboard(billboard);
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </button>
                      </>
                    )}
                    
                    {billboard.status === 'approved' && !billboard.assignment && (
                      <button
                        onClick={() => {
                          setSelectedBillboard(billboard);
                          setShowAssignModal(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                      >
                        <User className="h-4 w-4 mr-1" />
                        Assign to Sub-Admin
                      </button>
                    )}

                    {billboard.assignment && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p>Assigned to: <strong>{billboard.assignment.sub_admin_name}</strong></p>
                        <p>Status: <span className="capitalize">{billboard.assignment.status}</span></p>
                      </div>
                    )}

                    {billboard.status === 'active' && (
                      <button
                        onClick={() => handleRequestReverification(billboard.id)}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Re-verify
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredBillboards.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No billboards found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchTerm || statusFilter !== 'all'
                  ? 'No billboards match your current filters.' 
                  : 'There are no billboards in the system yet.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Billboard Details Modal */}
      {selectedBillboard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Billboard Details</h2>
              <button 
                onClick={() => {
                  setSelectedBillboard(null);
                  setAdminNotes('');
                  setRejectionReason('');
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Title</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedBillboard.title}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedBillboard.location_address}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">State / City</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedBillboard.state}, {selectedBillboard.city}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Owner</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedBillboard.owner?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                      <p className="font-medium text-gray-900 dark:text-white capitalize">{selectedBillboard.status}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Specifications</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Dimensions</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedBillboard.dimensions}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Price Per Day</p>
                      <p className="font-medium text-gray-900 dark:text-white">₹{selectedBillboard.price_per_day.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Daily Views</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedBillboard.daily_views.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Features</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedBillboard.features}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Description</h3>
                <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  {selectedBillboard.description}
                </p>
              </div>

              {selectedBillboard.billboard_images && selectedBillboard.billboard_images.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Images</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedBillboard.billboard_images.map((image) => (
                      <div key={image.id}>
                        <img 
                          src={image.image_url} 
                          alt={`Billboard ${image.image_type}`} 
                          className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">
                          {image.image_type} image
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedBillboard.site_visits && selectedBillboard.site_visits.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Verification History</h3>
                  <div className="space-y-4">
                    {selectedBillboard.site_visits.map((visit) => (
                      <div key={visit.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center mb-2">
                          {visit.is_verified ? (
                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                          )}
                          <span className="font-medium text-gray-900 dark:text-white">
                            {visit.is_verified ? 'Verified' : 'Rejected'} by {visit.sub_admin.name}
                          </span>
                          <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
                            {new Date(visit.visit_date).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300">
                          {visit.verification_notes}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedBillboard.status === 'pending' && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Admin Review</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Admin Notes (Optional)
                      </label>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Add any notes about this billboard..."
                      />
                    </div>

                    <div className="flex space-x-4">
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
                        Approve Billboard
                      </button>
                      <button
                        onClick={() => {
                          document.getElementById('rejectionReason')?.focus();
                        }}
                        disabled={submitting}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-md transition-colors flex items-center justify-center disabled:opacity-50"
                      >
                        <ThumbsDown className="h-4 w-4 mr-2" />
                        Reject Billboard
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Rejection Reason (Required for rejection)
                      </label>
                      <textarea
                        id="rejectionReason"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Explain why this billboard is being rejected..."
                      />
                      {rejectionReason && (
                        <button
                          onClick={handleReject}
                          disabled={submitting || !rejectionReason.trim()}
                          className="mt-2 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition-colors flex items-center disabled:opacity-50"
                        >
                          {submitting ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <X className="h-4 w-4 mr-2" />
                          )}
                          Confirm Rejection
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {selectedBillboard.status === 'active' && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Re-verification</h3>
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <p className="text-yellow-800 dark:text-yellow-200 mb-4">
                      If you believe this billboard needs to be re-verified, you can request a new site visit from a sub-admin.
                    </p>
                    <button
                      onClick={() => handleRequestReverification(selectedBillboard.id)}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-md transition-colors flex items-center"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Request Re-verification
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignModal && selectedBillboard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Assign to Sub-Admin</h2>
              <button 
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedSubAdmin('');
                  setAssignmentNotes('');
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Billboard: {selectedBillboard.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedBillboard.location_address}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Assign to Sub-Admin *
                  </label>
                  <select
                    value={selectedSubAdmin}
                    onChange={(e) => setSelectedSubAdmin(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select Sub-Admin</option>
                    {subAdmins.map((subAdmin) => (
                      <option key={subAdmin.id} value={subAdmin.id}>
                        {subAdmin.name} ({subAdmin.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <select
                    value={assignmentPriority}
                    onChange={(e) => setAssignmentPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Assignment Notes (Optional)
                  </label>
                  <textarea
                    value={assignmentNotes}
                    onChange={(e) => setAssignmentNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Add any specific instructions for the sub-admin..."
                  />
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    onClick={() => {
                      setShowAssignModal(false);
                      setSelectedSubAdmin('');
                      setAssignmentNotes('');
                    }}
                    className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignToSubAdmin}
                    disabled={!selectedSubAdmin || submitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Assigning...' : 'Assign Billboard'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBillboardApprovals;