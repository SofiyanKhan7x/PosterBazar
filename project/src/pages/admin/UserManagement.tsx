import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, Search, Filter, User, Mail, Phone, Calendar, 
  MapPin, Pause, Trash2, Play, CheckCircle, AlertTriangle,
   X, Eye, Shield, Clock, Building
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAdminSecurity } from '../../hooks/useAdminSecurity';
import { 
  getUsers, 
  updateUser, 
  deactivateUser,
  getBillboards,
} from '../../services/supabase';
import { AdminSecurityService } from '../../services/adminSecurityService';
import { User as UserType } from '../../services/supabase';

interface UserWithStats extends UserType {
  billboardCount: number;
  totalRevenue: number;
  lastActivity: string;
}

const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const { notifications, markNotificationsAsRead } = useAdminSecurity();
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'owner' | 'vendor'>('all');
  const [message, setMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<UserWithStats | null>(null);

  // Check if current user is a demo admin (hardcoded for demo purposes)
  const isDemoAdmin = user?.email === 'admin@posterbazar.com' || user?.id === 'demo-admin-id';
  
  // Check if current admin is active and not a demo account
  const isActiveRealAdmin = user && user.role === 'admin' && user.is_active && !isDemoAdmin;
  useEffect(() => {
    loadUsers();
    
    // Listen for real-time user deletion events
    const handleUserDeleted = (event: CustomEvent) => {
      const deletedUserData = event.detail;
      setUsers(prevUsers => 
        prevUsers.filter(u => u.id !== deletedUserData.deleted_user_id)
      );
      setMessage(`User "${deletedUserData.deleted_user_name}" was deleted by ${deletedUserData.admin_name}`);
    };
    
    window.addEventListener('admin:user_deleted', handleUserDeleted as EventListener);
    
    return () => {
      window.removeEventListener('admin:user_deleted', handleUserDeleted as EventListener);
    };
  }, []);

  // Process real-time notifications
  useEffect(() => {
    const userDeletedNotifications = notifications.filter(
      n => n.notification_type === 'user_deleted'
    );
    
    if (userDeletedNotifications.length > 0) {
      // Mark notifications as processed
      const notificationIds = userDeletedNotifications.map(n => n.id);
      markNotificationsAsRead(notificationIds);
    }
  }, [notifications, markNotificationsAsRead]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Get all users
      const allUsers = await getUsers();
      
      // Get all billboards to calculate stats
      const billboards = await getBillboards();
      
      // Calculate stats for each user
      const usersWithStats: UserWithStats[] = allUsers.map(user => {
        const userBillboards = billboards.filter(b => b.owner_id === user.id);
        const totalRevenue = userBillboards.reduce((sum, b) => sum + (b.price_per_day * 30), 0); // Estimate monthly revenue
        
        return {
          ...user,
          billboardCount: userBillboards.length,
          totalRevenue,
          lastActivity: user.last_login || user.updated_at
        };
      });
      
      setUsers(usersWithStats);
    } catch (error) {
      console.error('Error loading users:', error);
      setMessage('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handlePauseAccount = async (userId: string) => {
    if (!confirm('Are you sure you want to pause this account? The user will not be able to log in until reactivated.')) {
      return;
    }

    try {
      setActionLoading(userId);
      await deactivateUser(userId, user!.id);
      
      setUsers(users.map(u => 
        u.id === userId ? { ...u, is_active: false } : u
      ));
      
      setMessage('Account paused successfully');
    } catch (error: any) {
      setMessage('Failed to pause account: ' + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivateAccount = async (userId: string) => {
    try {
      setActionLoading(userId);
      const updatedUser = await updateUser(userId, { is_active: true });
      
      setUsers(users.map(u => 
        u.id === userId ? { ...u, ...updatedUser } : u
      ));
      
      setMessage('Account reactivated successfully');
    } catch (error: any) {
      setMessage('Failed to reactivate account: ' + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteAccount = async (userId: string) => {
    // Prevent demo admins from deleting users
    if (isDemoAdmin) {
      setMessage('Demo administrators cannot delete users. Please use a real administrator account.');
      setShowDeleteConfirm(null);
      return;
    }

    try {
      setActionLoading(userId);
      
      // Use the secure deletion service for all users
      const result = await AdminSecurityService.secureDeleteUser(userId, 'Admin deletion via user management');
      
      if (result.success) {
        // Remove user from local state
        const deletedUser = users.find(u => u.id === userId);
        setUsers(users.filter(u => u.id !== userId));
        setShowDeleteConfirm(null);
        setMessage(`Account deleted successfully. User "${deletedUser?.name}" has been permanently removed from the system.`);
        
        // Broadcast deletion to other admin sessions for real-time updates
        window.dispatchEvent(new CustomEvent('admin:user_deleted', {
          detail: {
            deleted_user_id: userId,
            deleted_user_name: deletedUser?.name,
            admin_name: user!.name,
            total_records_deleted: result.totalRecordsDeleted || 1
          }
        }));
        
        console.log('User deletion completed:', {
          deletedUser: deletedUser?.name,
          totalRecordsDeleted: result.totalRecordsDeleted,
          executionTime: result.executionTimeMs,
          timestamp: new Date().toISOString()
        });
      } else {
        setMessage(`Failed to delete account: ${result.message}`);
      }
      
    } catch (error: any) {
      console.error('Delete account error:', error);
      setMessage('Failed to delete account: ' + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.phone && user.phone.includes(searchTerm));
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.is_active) ||
                         (statusFilter === 'inactive' && !user.is_active);
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400'
      : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400';
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-400';
      case 'owner': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400';
      case 'user': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-400';
      case 'vendor': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400';
      case 'sub_admin': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-400';
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Only administrators can access user management.
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
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading users...</p>
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Manage all users in the system including billboard owners and advertisers.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">{filteredUsers.length}</span> of <span className="font-medium">{users.length}</span> users
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
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search users..."
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
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Roles</option>
              <option value="user">Advertisers</option>
              <option value="owner">Billboard Owners</option>
              <option value="vendor">Vendors</option>
            </select>

            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
              <Filter className="h-4 w-4 mr-1" />
              {filteredUsers.length} results
            </div>
          </div>

          {/* Users List */}
          <div className="space-y-4">
            {filteredUsers.map((userData) => (
              <div key={userData.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mr-4">
                        <span className="text-white font-semibold">
                          {userData.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{userData.name}</h3>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(userData.is_active)}`}>
                            {userData.is_active ? 'Active' : 'Inactive'}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(userData.role)}`}>
                            {userData.role === 'user' ? 'Advertiser' : 
                             userData.role === 'owner' ? 'Billboard Owner' :
                             userData.role === 'vendor' ? 'Vendor' :
                             userData.role === 'admin' ? 'Administrator' : 'Sub-Admin'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Mail className="h-4 w-4 mr-2" />
                        <span className="text-sm">{userData.email}</span>
                      </div>
                      {userData.phone && (
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Phone className="h-4 w-4 mr-2" />
                          <span className="text-sm">{userData.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span className="text-sm">Joined: {new Date(userData.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Clock className="h-4 w-4 mr-2" />
                        <span className="text-sm">
                          Last active: {userData.lastActivity ? new Date(userData.lastActivity).toLocaleDateString() : 'Never'}
                        </span>
                      </div>
                    </div>

                    {userData.role === 'owner' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                          <div className="flex items-center">
                            <Building className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                            <div>
                              <p className="text-sm text-blue-600 dark:text-blue-400">Billboards</p>
                              <p className="text-lg font-semibold text-blue-900 dark:text-blue-300">{userData.billboardCount}</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                          <div className="flex items-center">
                            <Shield className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                            <div>
                              <p className="text-sm text-green-600 dark:text-green-400">KYC Status</p>
                              <p className="text-sm font-semibold text-green-900 dark:text-green-300 capitalize">{userData.kyc_status}</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                          <div className="flex items-center">
                            <MapPin className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                            <div>
                              <p className="text-sm text-yellow-600 dark:text-yellow-400">Est. Revenue</p>
                              <p className="text-lg font-semibold text-yellow-900 dark:text-yellow-300">₹{userData.totalRevenue.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedUser(userData)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                      title="View details"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                    
                    {userData.is_active ? (
                      <button
                        onClick={() => handlePauseAccount(userData.id)}
                        disabled={actionLoading === userData.id}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded-md text-sm transition-colors flex items-center disabled:opacity-50"
                        title="Pause account"
                      >
                        {actionLoading === userData.id ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                        ) : (
                          <Pause className="h-3 w-3 mr-1" />
                        )}
                        Pause
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReactivateAccount(userData.id)}
                        disabled={actionLoading === userData.id}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm transition-colors flex items-center disabled:opacity-50"
                        title="Reactivate account"
                      >
                        {actionLoading === userData.id ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                        ) : (
                          <Play className="h-3 w-3 mr-1" />
                        )}
                        Activate
                      </button>
                    )}
                    
                    <button
                      onClick={() => setShowDeleteConfirm(userData)}
                      disabled={actionLoading === userData.id || !isActiveRealAdmin}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm transition-colors flex items-center disabled:opacity-50"
                      title={isDemoAdmin ? "Demo administrators cannot delete users" : !isActiveRealAdmin ? "Only active administrators can delete users" : "Delete account"}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <User className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No users found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchTerm || statusFilter !== 'all' || roleFilter !== 'all'
                  ? 'No users match your current filters.' 
                  : 'There are no users in the system yet.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">User Details</h2>
              <button 
                onClick={() => setSelectedUser(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div className="flex items-center">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mr-4">
                    <span className="text-white font-bold text-xl">
                      {selectedUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedUser.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedUser.is_active)}`}>
                        {selectedUser.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(selectedUser.role)}`}>
                        {selectedUser.role === 'user' ? 'Advertiser' : 
                         selectedUser.role === 'owner' ? 'Billboard Owner' :
                         selectedUser.role === 'admin' ? 'Administrator' : 'Sub-Admin'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Contact Information</h4>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-700 dark:text-gray-300">{selectedUser.email}</span>
                      </div>
                      {selectedUser.phone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-gray-700 dark:text-gray-300">{selectedUser.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Account Information</h4>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-700 dark:text-gray-300">
                          Joined: {new Date(selectedUser.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-700 dark:text-gray-300">
                          Last login: {selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleString() : 'Never'}
                        </span>
                      </div>
                      {selectedUser.role === 'owner' && (
                        <div className="flex items-center">
                          <Shield className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-gray-700 dark:text-gray-300">
                            KYC Status: <span className="capitalize">{selectedUser.kyc_status}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {selectedUser.role === 'owner' && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Business Statistics</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <div className="flex items-center">
                          <Building className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
                          <div>
                            <p className="text-sm text-blue-600 dark:text-blue-400">Total Billboards</p>
                            <p className="text-xl font-bold text-blue-900 dark:text-blue-300">{selectedUser.billboardCount}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <div className="flex items-center">
                          <MapPin className="h-6 w-6 text-green-600 dark:text-green-400 mr-2" />
                          <div>
                            <p className="text-sm text-green-600 dark:text-green-400">Wallet Balance</p>
                            <p className="text-xl font-bold text-green-900 dark:text-green-300">₹{selectedUser.wallet_balance.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                        <div className="flex items-center">
                          <Shield className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mr-2" />
                          <div>
                            <p className="text-sm text-yellow-600 dark:text-yellow-400">Est. Revenue</p>
                            <p className="text-xl font-bold text-yellow-900 dark:text-yellow-300">₹{selectedUser.totalRevenue.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                {selectedUser.is_active ? (
                  <button
                    onClick={() => {
                      handlePauseAccount(selectedUser.id);
                      setSelectedUser(null);
                    }}
                    disabled={actionLoading === selectedUser.id}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md transition-colors flex items-center disabled:opacity-50"
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pause Account
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleReactivateAccount(selectedUser.id);
                      setSelectedUser(null);
                    }}
                    disabled={actionLoading === selectedUser.id}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors flex items-center disabled:opacity-50"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Reactivate Account
                  </button>
                )}
                
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setShowDeleteConfirm(selectedUser);
                  }}
                  disabled={!isActiveRealAdmin}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors flex items-center"
                  title={isDemoAdmin ? "Demo administrators cannot delete users" : !isActiveRealAdmin ? "Only active administrators can delete users" : "Delete account"}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
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
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Account</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">This action cannot be undone</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Are you sure you want to permanently delete <strong>{showDeleteConfirm.name}</strong>'s account?
                </p>
                
                {showDeleteConfirm.role === 'owner' && showDeleteConfirm.billboardCount > 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-center">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                      <div>
                        <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">Warning</p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                          This user owns {showDeleteConfirm.billboardCount} billboard(s). Deleting this account will also remove all associated billboards.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <ul className="text-sm text-gray-600 dark:text-gray-400 mt-4 space-y-1">
                  <li>• All user data will be permanently deleted</li>
                  <li>• Associated billboards and bookings will be removed</li>
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
                  onClick={() => handleDeleteAccount(showDeleteConfirm.id)}
                  disabled={actionLoading === showDeleteConfirm.id || !isActiveRealAdmin}
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

export default UserManagement;