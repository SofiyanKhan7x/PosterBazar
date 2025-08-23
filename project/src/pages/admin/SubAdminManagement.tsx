import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Edit, Trash2, Save, X, CheckCircle, 
   AlertCircle, Search, User, Mail, Lock, Eye, EyeOff, Shield, Phone, Calendar, Clock
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { 
  getUsers, 
  updateUser, 
  deactivateUser,
  supabase
} from '../../services/supabase';
import { AuthService } from '../../services/auth';
import { User as UserType } from '../../services/supabase';

const SubAdminManagement: React.FC = () => {
  const { user, createSubAdmin } = useAuth();
  const [subAdmins, setSubAdmins] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [newSubAdmin, setNewSubAdmin] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    is_active: true
  });

  useEffect(() => {
    loadSubAdmins();
  }, []);

  const loadSubAdmins = async () => {
    try {
      setLoading(true);
      const users = await getUsers('sub_admin');
      setSubAdmins(users);
    } catch (error) {
      console.error('Error loading sub-admins:', error);
      setMessage('Failed to load sub-admins');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubAdmin = async () => {
    // Validate name (text only)
    if (!newSubAdmin.name.trim()) {
      setMessage('Full name is required');
      return;
    }
    
    if (!/^[a-zA-Z\s]+$/.test(newSubAdmin.name.trim())) {
      setMessage('Name can only contain letters and spaces');
      return;
    }
    
    // Validate email
    if (!newSubAdmin.email.trim()) {
      setMessage('Email address is required');
      return;
    }
    
    if (!newSubAdmin.email.includes('@')) {
      setMessage('Email address must contain @ symbol');
      return;
    }
    
    // Validate phone number
    if (newSubAdmin.phone && newSubAdmin.phone.length !== 10) {
      setMessage('Phone number must be exactly 10 digits');
      return;
    }
    
    // Validate passwords
    if (!newSubAdmin.password || !newSubAdmin.confirmPassword) {
      setMessage('All fields are required');
      return;
    }

    if (newSubAdmin.password !== newSubAdmin.confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    // Validate password complexity
    const passwordValidation = AuthService.validatePassword(newSubAdmin.password);
    if (!passwordValidation.valid) {
      setMessage(passwordValidation.errors.join(', '));
      return;
    }

    try {
      setSubmitting(true);
      setMessage('');
      
      // Create new sub-admin using auth context
      const success = await createSubAdmin(user!.id, {
        name: newSubAdmin.name.trim(),
        email: newSubAdmin.email.trim(),
        password: newSubAdmin.password,
        phone: newSubAdmin.phone.trim() || undefined
      });

      if (success) {
        // Reload the sub-admins list
        await loadSubAdmins();
        
        // Reset form
        setNewSubAdmin({
          name: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: '',
          is_active: true
        });
        
        setShowAddForm(false);
        setMessage('Sub-admin created successfully with secure authentication');
      }
      
    } catch (error: any) {
      setMessage('Failed to create sub-admin: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSubAdmin = async () => {
    if (!editingUser || !editingUser.name.trim() || !editingUser.email.trim()) {
      setMessage('Name and email are required');
      return;
    }

    try {
      setLoading(true);
      
      // Update sub-admin
      const updatedUser = await updateUser(editingUser.id, {
        name: editingUser.name.trim(),
        email: editingUser.email.trim(),
        phone: editingUser.phone?.trim(),
        is_active: editingUser.is_active
      });

      // Update local state
      setSubAdmins(subAdmins.map(admin => 
        admin.id === editingUser.id ? updatedUser : admin
      ));
      
      setEditingUser(null);
      setMessage('Sub-admin updated successfully');
    } catch (error: any) {
      setMessage('Failed to update sub-admin: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateSubAdmin = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this sub-admin? They will no longer be able to log in.')) {
      return;
    }

    try {
      setLoading(true);
      
      // Deactivate sub-admin and revoke access immediately
      await deactivateUser(id, user!.id);
      
      // Revoke all active sessions for immediate effect
      if (supabase) {
        try {
          await supabase.rpc('revoke_subadmin_access', { 
            p_user_id: id
          });
        } catch (revokeError) {
          console.warn('Failed to revoke sessions, but user deactivated:', revokeError);
        }
      }

      // Update local state
      setSubAdmins(subAdmins.map(admin => 
        admin.id === id ? { ...admin, is_active: false } : admin
      ));
      
      setMessage('Sub-admin deactivated successfully. All active sessions have been terminated.');
    } catch (error: any) {
      setMessage('Failed to deactivate sub-admin: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateSubAdmin = async (id: string) => {
    try {
      setLoading(true);
      
      // Activate sub-admin
      const updatedUser = await updateUser(id, { is_active: true });

      // Update local state
      setSubAdmins(subAdmins.map(admin => 
        admin.id === id ? updatedUser : admin
      ));
      
      setMessage('Sub-admin activated successfully');
    } catch (error: any) {
      setMessage('Failed to activate sub-admin: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubAdmin = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this sub-admin? This action cannot be undone and will remove all associated data.')) {
      return;
    }

    try {
      setLoading(true);
      
      // Revoke access immediately before deletion
      try {
        await supabase.rpc('revoke_subadmin_access', { 
          p_user_id: id
        });
      } catch (revokeError) {
        console.warn('Failed to revoke sessions before deletion:', revokeError);
      }
      
      // Delete sub-admin permanently using secure function
      const { data, error } = await supabase.rpc('secure_delete_user_with_notifications', {
        deletion_reason: 'Admin deletion via sub-admin management',
        requesting_admin_id: user!.id,
        user_id_to_delete: id
      });

      if (error) {
        throw new Error(error.message || 'Failed to delete user');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete user');
      }

      // Update local state
      setSubAdmins(subAdmins.filter(admin => admin.id !== id));
      
      setMessage('Sub-admin deleted successfully');
    } catch (error: any) {
      setMessage('Failed to delete sub-admin: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  const filteredSubAdmins = subAdmins.filter(admin =>
    admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (admin.phone && admin.phone.includes(searchTerm))
  );

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Only administrators can manage sub-admins.
        </p>
        <Link to="/dashboard" className="text-blue-900 dark:text-blue-400 hover:underline">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  if (loading && subAdmins.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading sub-admins...</p>
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sub-Admin Management</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Manage sub-administrators who verify billboards in the field.
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-900 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Sub-Admin
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
                  <AlertCircle className="h-5 w-5 mr-2" />
                )}
                {message}
              </div>
            </div>
          )}

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search sub-admins..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className="mb-6 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New Sub-Admin</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-full">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={newSubAdmin.name}
                      onChange={(e) => {
                        const filteredValue = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                        setNewSubAdmin({...newSubAdmin, name: filteredValue});
                        if (e.target.value !== filteredValue) {
                          setMessage('Name can only contain letters and spaces');
                        } else if (message.includes('Name can only contain')) {
                          setMessage('');
                        }
                      }}
                      className={`pl-10 w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white ${
                        newSubAdmin.name && !/^[a-zA-Z\s]+$/.test(newSubAdmin.name) 
                          ? 'border-red-500 dark:border-red-500' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="John Doe"
                    />
                  </div>
                  {newSubAdmin.name && !/^[a-zA-Z\s]+$/.test(newSubAdmin.name) && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      Name can only contain letters and spaces
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={newSubAdmin.email}
                      onChange={(e) => {
                        setNewSubAdmin({...newSubAdmin, email: e.target.value});
                        if (e.target.value && !e.target.value.includes('@')) {
                          setMessage('Email address must contain @ symbol');
                        } else if (message.includes('Email address must contain')) {
                          setMessage('');
                        }
                      }}
                      className={`pl-10 w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white ${
                        newSubAdmin.email && !newSubAdmin.email.includes('@') 
                          ? 'border-red-500 dark:border-red-500' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="johndoe@example.com"
                    />
                  </div>
                  {newSubAdmin.email && !newSubAdmin.email.includes('@') && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      Email address must contain @ symbol
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number (10 digits)
                  </label>
                  <input
                    type="tel"
                    value={newSubAdmin.phone}
                    onChange={(e) => {
                      const filteredValue = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setNewSubAdmin({...newSubAdmin, phone: filteredValue});
                    }}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white ${
                      newSubAdmin.phone && newSubAdmin.phone.length !== 10 && newSubAdmin.phone.length > 0
                        ? 'border-red-500 dark:border-red-500' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="9876543210"
                    maxLength={10}
                  />
                  {newSubAdmin.phone && newSubAdmin.phone.length !== 10 && newSubAdmin.phone.length > 0 && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      Phone number must be exactly 10 digits
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newSubAdmin.password}
                      onChange={(e) => setNewSubAdmin({...newSubAdmin, password: e.target.value})}
                      className="pl-10 pr-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Must be 8+ chars with uppercase, lowercase, number, and special character
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newSubAdmin.confirmPassword}
                      onChange={(e) => {
                        setNewSubAdmin({...newSubAdmin, confirmPassword: e.target.value});
                      }}
                      className={`pl-10 w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white ${
                        newSubAdmin.confirmPassword && newSubAdmin.confirmPassword !== newSubAdmin.password
                          ? 'border-red-500 dark:border-red-500' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="••••••••"
                    />
                  </div>
                  {newSubAdmin.confirmPassword && newSubAdmin.confirmPassword !== newSubAdmin.password && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      Passwords do not match
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newSubAdmin.is_active}
                    onChange={(e) => setNewSubAdmin({...newSubAdmin, is_active: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</span>
                </label>
              </div>
              
              {/* Security Information */}
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Security Features</h4>
                <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Password complexity validation enforced</li>
                  <li>• Account lockout after 5 failed login attempts</li>
                  <li>• Secure session management with 24-hour expiry</li>
                  <li>• Automatic permission assignment for billboard verification</li>
                  <li>• Login attempt monitoring and IP tracking</li>
                </ul>
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
                  onClick={handleAddSubAdmin}
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-900 dark:bg-blue-700 text-white rounded-md hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors flex items-center disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Secure Account...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-1" />
                      Create Sub-Admin
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Sub-Admins List */}
          <div className="space-y-4">
            {filteredSubAdmins.map((admin) => (
              <div key={admin.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                {editingUser?.id === admin.id ? (
                  // Edit Form
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={editingUser.name}
                          onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          value={editingUser.email}
                          onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={editingUser.phone || ''}
                          onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editingUser.is_active}
                          onChange={(e) => setEditingUser({...editingUser, is_active: e.target.checked})}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</span>
                      </label>
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => setEditingUser(null)}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdateSubAdmin}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-900 dark:bg-blue-700 text-white rounded-md hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors flex items-center"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-1" />
                            Save
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  // Display Mode
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mr-3">
                          <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{admin.name}</h3>
                          <div className="flex items-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              admin.is_active 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400'
                            }`}>
                              {admin.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400">
                              Sub-Admin
                            </span>
                            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400">
                              Secure Auth
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-13 pl-13 mt-3 space-y-1">
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Mail className="h-4 w-4 mr-2" />
                          <span>{admin.email}</span>
                        </div>
                        {admin.phone && (
                          <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <Phone className="h-4 w-4 mr-2" />
                            <span>{admin.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>Joined: {new Date(admin.created_at).toLocaleDateString()}</span>
                        </div>
                        {admin.last_login && (
                          <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <Clock className="h-4 w-4 mr-2" />
                            <span>Last login: {new Date(admin.last_login).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {admin.is_active ? (
                        <button
                          onClick={() => handleDeactivateSubAdmin(admin.id)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md transition-colors"
                          title="Deactivate account"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivateSubAdmin(admin.id)}
                          className="p-2 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-md transition-colors"
                          title="Activate account"
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => setEditingUser(admin)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                        title="Edit sub-admin"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSubAdmin(admin.id)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md transition-colors"
                        title="Delete sub-admin"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredSubAdmins.length === 0 && (
            <div className="text-center py-12">
              <Shield className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No sub-admins found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchTerm ? 'No sub-admins match your search criteria.' : 'Add your first sub-admin to help with billboard verification.'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-blue-900 dark:bg-blue-700 text-white px-6 py-3 rounded-lg hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors"
                >
                  Add Your First Sub-Admin
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubAdminManagement;