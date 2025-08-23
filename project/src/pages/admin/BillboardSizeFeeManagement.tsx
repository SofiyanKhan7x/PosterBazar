import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Edit, Trash2, Save, CheckCircle, 
  AlertCircle, IndianRupee, Search, Ruler
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { 
  getBillboardSizeFees,
  createBillboardSizeFee,
  updateBillboardSizeFee,
  deleteBillboardSizeFee,
  BillboardSizeFee
} from '../../services/supabase';

const PosterSizeFeeManagement: React.FC = () => {
  const { user } = useAuth();
  const [sizeFees, setSizeFees] = useState<BillboardSizeFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFee, setEditingFee] = useState<BillboardSizeFee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [newFee, setNewFee] = useState({
    size_name: '',
    fee_amount: '',
    description: '',
    is_active: true
  });

  useEffect(() => {
    loadSizeFees();
  }, []);

  const loadSizeFees = async () => {
    try {
      setLoading(true);
      const fees = await getBillboardSizeFees();
      setSizeFees(fees);
    } catch (error) {
      console.error('Error loading billboard size fees:', error);
      setMessage('Failed to load billboard size fees');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFee = async () => {
    if (!newFee.size_name.trim() || !newFee.fee_amount) {
      setMessage('Size name and fee amount are required');
      return;
    }

    try {
      const feeData = {
        size_name: newFee.size_name.trim(),
        fee_amount: parseFloat(newFee.fee_amount),
        description: newFee.description.trim(),
        is_active: newFee.is_active,
        updated_by: user?.id
      };

      const createdFee = await createBillboardSizeFee(feeData);
      setSizeFees([...sizeFees, createdFee]);
      setNewFee({
        size_name: '',
        fee_amount: '',
        description: '',
        is_active: true
      });
      setShowAddForm(false);
      setMessage('Billboard size fee added successfully');
    } catch (error: any) {
      setMessage('Failed to add billboard size fee: ' + error.message);
    }
  };

  const handleUpdateFee = async () => {
    if (!editingFee || !editingFee.size_name.trim() || !editingFee.fee_amount) {
      setMessage('Size name and fee amount are required');
      return;
    }

    try {
      const updatedFee = await updateBillboardSizeFee(editingFee.id.toString(), {
        size_name: editingFee.size_name.trim(),
        fee_amount: typeof editingFee.fee_amount === 'string' 
          ? parseFloat(editingFee.fee_amount) 
          : editingFee.fee_amount,
        description: editingFee.description?.trim(),
        is_active: editingFee.is_active,
        updated_by: user?.id
      });
      
      setSizeFees(sizeFees.map(fee => 
        fee.id === editingFee.id ? updatedFee : fee
      ));
      
      setEditingFee(null);
      setMessage('Billboard size fee updated successfully');
    } catch (error: any) {
      setMessage('Failed to update billboard size fee: ' + error.message);
    }
  };

  const handleDeleteFee = async (id: number) => {
    if (!confirm('Are you sure you want to delete this size fee? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteBillboardSizeFee(id.toString());
      setSizeFees(sizeFees.filter(fee => fee.id !== id));
      setMessage('Billboard size fee deleted successfully');
    } catch (error: any) {
      setMessage('Failed to delete billboard size fee: ' + error.message);
    }
  };

  const handleToggleStatus = async (fee: BillboardSizeFee) => {
    try {
      const updatedFee = await updateBillboardSizeFee(fee.id.toString(), { 
        is_active: !fee.is_active,
        updated_by: user?.id
      });
      
      setSizeFees(sizeFees.map(f => 
        f.id === fee.id ? updatedFee : f
      ));
      
      setMessage(`Billboard size fee ${updatedFee.is_active ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      setMessage('Failed to update status: ' + error.message);
    }
  };

  const filteredFees = sizeFees.filter(fee =>
    fee.size_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fee.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Only administrators can manage poster size fees.
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
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading billboard size fees...</p>
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">PosterBazar Size Fee Management</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Manage joining fees that PosterBazar owners must pay based on poster size.
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-900 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add PosterBazar Size Fee
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
                placeholder="Search PosterBazar size fees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className="mb-6 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New PosterBazar Size Fee</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Size Name *
                  </label>
                  <input
                    type="text"
                    value={newFee.size_name}
                    onChange={(e) => setNewFee({...newFee, size_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                    placeholder="e.g., Small (< 100 sq ft)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fee Amount (₹) *
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      value={newFee.fee_amount}
                      onChange={(e) => setNewFee({...newFee, fee_amount: e.target.value})}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                      placeholder="5000"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newFee.description}
                    onChange={(e) => setNewFee({...newFee, description: e.target.value})}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                    placeholder="Brief description of this size category"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newFee.is_active}
                    onChange={(e) => setNewFee({...newFee, is_active: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</span>
                </label>
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddFee}
                  className="px-4 py-2 bg-blue-900 dark:bg-blue-700 text-white rounded-md hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors"
                >
                  Add PosterBazar Size Fee
                </button>
              </div>
            </div>
          )}

          {/* Size Fees List */}
          <div className="space-y-4">
            {filteredFees.map((fee) => (
              <div key={fee.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                {editingFee?.id === fee.id ? (
                  // Edit Form
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Size Name *
                        </label>
                        <input
                          type="text"
                          value={editingFee.size_name}
                          onChange={(e) => setEditingFee({...editingFee, size_name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Fee Amount (₹) *
                        </label>
                        <div className="relative">
                          <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="number"
                            value={typeof editingFee.fee_amount === 'number' ? editingFee.fee_amount : editingFee.fee_amount}
                            onChange={(e) => setEditingFee({...editingFee, fee_amount: parseFloat(e.target.value)})}
                            className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Description
                        </label>
                        <textarea
                          value={editingFee.description || ''}
                          onChange={(e) => setEditingFee({...editingFee, description: e.target.value})}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editingFee.is_active}
                          onChange={(e) => setEditingFee({...editingFee, is_active: e.target.checked})}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</span>
                      </label>
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => setEditingFee(null)}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdateFee}
                        className="px-4 py-2 bg-blue-900 dark:bg-blue-700 text-white rounded-md hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors flex items-center"
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  // Display Mode
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <Ruler className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{fee.size_name}</h3>
                        <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${
                          fee.is_active 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400'
                        }`}>
                          {fee.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400 mb-2">
                        <IndianRupee className="h-4 w-4 mr-1" />
                        <span className="text-lg font-semibold text-blue-900 dark:text-blue-400">
                          {typeof fee.fee_amount === 'number' 
                            ? fee.fee_amount.toLocaleString() 
                            : parseFloat(fee.fee_amount).toLocaleString()}
                        </span>
                      </div>
                      {fee.description && (
                        <p className="text-gray-600 dark:text-gray-400 mb-2">{fee.description}</p>
                      )}
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Last updated: {new Date(fee.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleStatus(fee)}
                        className={`p-2 rounded-md transition-colors ${
                          fee.is_active
                            ? 'text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50'
                            : 'text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50'
                        }`}
                        title={fee.is_active ? 'Deactivate' : 'Activate'}
                      >
                        <CheckCircle className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setEditingFee(fee)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                        title="Edit fee"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteFee(fee.id)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md transition-colors"
                        title="Delete fee"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredFees.length === 0 && (
            <div className="text-center py-12">
              <Ruler className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No size fees found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchTerm ? 'No fees match your search criteria.' : 'Add your first size fee to get started.'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-blue-900 dark:bg-blue-700 text-white px-6 py-3 rounded-lg hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors"
                >
                  Add Your First Size Fee
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PosterSizeFeeManagement;