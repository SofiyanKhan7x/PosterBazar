import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, Search, Filter, MapPin, User, Calendar, 
  Trash2, Eye, AlertTriangle, CheckCircle, X, IndianRupee,
  Building, Clock, Target
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { 
  updateBillboard,
  deleteBillboard,
  supabase
} from '../../services/supabase';
import { Billboard } from '../../services/supabase';

interface ActiveHoardingWithStats extends Billboard {
  totalBookings: number;
  monthlyRevenue: number;
  lastBooking: string;
}

const ActiveHoardingsManagement: React.FC = () => {
  const { user } = useAuth();
  const [hoardings, setHoardings] = useState<ActiveHoardingWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [message, setMessage] = useState('');
  const [selectedHoarding, setSelectedHoarding] = useState<ActiveHoardingWithStats | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<ActiveHoardingWithStats | null>(null);

  useEffect(() => {
    loadActiveHoardings();
  }, []);

  const loadActiveHoardings = async () => {
    try {
      setLoading(true);
      
      // Get all active billboards
      const { data: billboards, error } = await supabase
        .from('billboards')
        .select(`
          *,
          owner:users!billboards_owner_id_fkey(name, email, phone),
          billboard_images(image_url, image_type),
          billboard_type:billboard_types(type_name)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get booking statistics for each billboard
      const hoardingsWithStats: ActiveHoardingWithStats[] = await Promise.all(
        (billboards || []).map(async (billboard: any) => {
          // Get booking count and revenue (mock data for now)
          const totalBookings = Math.floor(Math.random() * 20) + 1;
          const monthlyRevenue = billboard.price_per_day * 30 * 0.7; // Estimate 70% occupancy
          const lastBooking = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString();

          return {
            ...billboard,
            totalBookings,
            monthlyRevenue,
            lastBooking
          };
        })
      );
      
      setHoardings(hoardingsWithStats);
    } catch (error) {
      console.error('Error loading active hoardings:', error);
      setMessage('Failed to load active hoardings');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateHoarding = async (hoardingId: string) => {
    if (!confirm('Are you sure you want to deactivate this hoarding? It will no longer be available for booking.')) {
      return;
    }

    try {
      setActionLoading(hoardingId);
      
      await updateBillboard(hoardingId, { 
        status: 'inactive',
        updated_at: new Date().toISOString()
      });
      
      setHoardings(hoardings.filter(h => h.id !== hoardingId));
      setMessage('Hoarding deactivated successfully');
    } catch (error: any) {
      setMessage('Failed to deactivate hoarding: ' + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteHoarding = async (hoardingId: string) => {
    try {
      setActionLoading(hoardingId);
      
      await deleteBillboard(hoardingId);
      
      setHoardings(hoardings.filter(h => h.id !== hoardingId));
      setShowDeleteConfirm(null);
      setMessage('Hoarding deleted successfully');
    } catch (error: any) {
      setMessage('Failed to delete hoarding: ' + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredHoardings = hoardings.filter(hoarding => {
    const matchesSearch = hoarding.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hoarding.location_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hoarding.owner?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = !locationFilter || 
                           hoarding.state.toLowerCase().includes(locationFilter.toLowerCase()) ||
                           hoarding.city.toLowerCase().includes(locationFilter.toLowerCase());
    
    return matchesSearch && matchesLocation;
  });

  const getRevenueColor = (revenue: number) => {
    if (revenue >= 50000) return 'text-green-600 dark:text-green-400';
    if (revenue >= 20000) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Only administrators can access active hoardings management.
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
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading active hoardings...</p>
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Active Hoardings Management</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Manage all active billboard hoardings in the system.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">{filteredHoardings.length}</span> of <span className="font-medium">{hoardings.length}</span> hoardings
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
                placeholder="Search hoardings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Filter by location..."
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
              <Filter className="h-4 w-4 mr-1" />
              {filteredHoardings.length} results
            </div>
          </div>

          {/* Hoardings List */}
          <div className="space-y-4">
            {filteredHoardings.map((hoarding) => (
              <div key={hoarding.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <div className="h-16 w-24 rounded-lg overflow-hidden mr-4 border border-gray-200 dark:border-gray-600">
                        {hoarding.billboard_images && hoarding.billboard_images.length > 0 ? (
                          <img 
                            src={hoarding.billboard_images[0].image_url} 
                            alt={hoarding.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                            <Building className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{hoarding.title}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400">
                            Active
                          </span>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400">
                            {hoarding.billboard_type?.type_name || 'Standard'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span className="text-sm">{hoarding.city}, {hoarding.state}</span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <User className="h-4 w-4 mr-2" />
                        <span className="text-sm">Owner: {hoarding.owner?.name}</span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <IndianRupee className="h-4 w-4 mr-2" />
                        <span className="text-sm">₹{hoarding.price_per_day.toLocaleString()}/day</span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span className="text-sm">Added: {new Date(hoarding.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                        <div className="flex items-center">
                          <Target className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                          <div>
                            <p className="text-sm text-blue-600 dark:text-blue-400">Total Bookings</p>
                            <p className="text-lg font-semibold text-blue-900 dark:text-blue-300">{hoarding.totalBookings}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                        <div className="flex items-center">
                          <IndianRupee className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                          <div>
                            <p className="text-sm text-green-600 dark:text-green-400">Monthly Revenue</p>
                            <p className={`text-lg font-semibold ${getRevenueColor(hoarding.monthlyRevenue)}`}>
                              ₹{hoarding.monthlyRevenue.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                        <div className="flex items-center">
                          <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                          <div>
                            <p className="text-sm text-yellow-600 dark:text-yellow-400">Last Booking</p>
                            <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-300">
                              {new Date(hoarding.lastBooking).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p className="mb-1"><strong>Location:</strong> {hoarding.location_address}</p>
                      <p className="mb-1"><strong>Dimensions:</strong> {hoarding.dimensions}</p>
                      <p><strong>Features:</strong> {hoarding.features}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedHoarding(hoarding)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                      title="View details"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                    
                    <button
                      onClick={() => handleDeactivateHoarding(hoarding.id)}
                      disabled={actionLoading === hoarding.id}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded-md text-sm transition-colors flex items-center disabled:opacity-50"
                      title="Deactivate hoarding"
                    >
                      {actionLoading === hoarding.id ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                      ) : (
                        <X className="h-3 w-3 mr-1" />
                      )}
                      Deactivate
                    </button>
                    
                    <button
                      onClick={() => setShowDeleteConfirm(hoarding)}
                      disabled={actionLoading === hoarding.id}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm transition-colors flex items-center disabled:opacity-50"
                      title="Delete hoarding"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredHoardings.length === 0 && (
            <div className="text-center py-12">
              <Building className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No active hoardings found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchTerm || locationFilter
                  ? 'No hoardings match your current filters.' 
                  : 'There are no active hoardings in the system yet.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Hoarding Details Modal */}
      {selectedHoarding && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Hoarding Details</h2>
              <button 
                onClick={() => setSelectedHoarding(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Title</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedHoarding.title}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedHoarding.location_address}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">State / City</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedHoarding.state}, {selectedHoarding.city}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Owner</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedHoarding.owner?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Contact</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedHoarding.owner?.email}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Metrics</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Price Per Day</p>
                      <p className="font-medium text-gray-900 dark:text-white">₹{selectedHoarding.price_per_day.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Daily Views</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedHoarding.daily_views.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Bookings</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedHoarding.totalBookings}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Revenue</p>
                      <p className={`font-medium ${getRevenueColor(selectedHoarding.monthlyRevenue)}`}>
                        ₹{selectedHoarding.monthlyRevenue.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Dimensions</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedHoarding.dimensions}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Description</h3>
                <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  {selectedHoarding.description}
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Features</h3>
                <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  {selectedHoarding.features}
                </p>
              </div>

              {selectedHoarding.billboard_images && selectedHoarding.billboard_images.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Images</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedHoarding.billboard_images.map((image, index) => (
                      <div key={index}>
                        <img 
                          src={image.image_url} 
                          alt={`Hoarding ${image.image_type}`} 
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

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    handleDeactivateHoarding(selectedHoarding.id);
                    setSelectedHoarding(null);
                  }}
                  disabled={actionLoading === selectedHoarding.id}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md transition-colors flex items-center disabled:opacity-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Deactivate Hoarding
                </button>
                
                <button
                  onClick={() => {
                    setSelectedHoarding(null);
                    setShowDeleteConfirm(selectedHoarding);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors flex items-center"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Hoarding
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-full mr-4">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Hoarding</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">This action cannot be undone</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Are you sure you want to permanently delete <strong>{showDeleteConfirm.title}</strong>?
                </p>
                
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                    <div>
                      <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">Warning</p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        This hoarding has {showDeleteConfirm.totalBookings} booking(s) and generates ₹{showDeleteConfirm.monthlyRevenue.toLocaleString()} monthly revenue.
                      </p>
                    </div>
                  </div>
                </div>
                
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• All hoarding data will be permanently deleted</li>
                  <li>• Associated bookings and revenue history will be removed</li>
                  <li>• Owner will be notified of the deletion</li>
                  <li>• This action cannot be reversed</li>
                </ul>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteHoarding(showDeleteConfirm.id)}
                  disabled={actionLoading === showDeleteConfirm.id}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors flex items-center disabled:opacity-50"
                >
                  {actionLoading === showDeleteConfirm.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Permanently
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveHoardingsManagement;