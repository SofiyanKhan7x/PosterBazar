import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Edit, Trash2, Save, CheckCircle, 
  AlertCircle, Monitor, Search
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../services/supabase';

interface BillboardType {
  id: number;
  type_name: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

const BillboardTypeManagement: React.FC = () => {
  const { user } = useAuth();
  const [billboardTypes, setBillboardTypes] = useState<BillboardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingType, setEditingType] = useState<BillboardType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [newType, setNewType] = useState({
    type_name: '',
    description: '',
    is_active: true
  });

  useEffect(() => {
    loadBillboardTypes();
  }, []);

  const loadBillboardTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('billboard_types')
        .select('*')
        .order('type_name');

      if (error) {
        console.error('Error loading billboard types:', error);
        setMessage('Failed to load billboard types');
      } else {
        setBillboardTypes(data || []);
      }
    } catch (error) {
      console.error('Error loading billboard types:', error);
      setMessage('Failed to load billboard types');
    } finally {
      setLoading(false);
    }
  };

  const handleAddType = async () => {
    if (!newType.type_name.trim()) {
      setMessage('Type name is required');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('billboard_types')
        .insert({
          type_name: newType.type_name.trim(),
          description: newType.description.trim(),
          is_active: newType.is_active
        })
        .select()
        .single();

      if (error) {
        setMessage('Failed to add billboard type: ' + error.message);
      } else {
        setBillboardTypes([...billboardTypes, data]);
        setNewType({ type_name: '', description: '', is_active: true });
        setShowAddForm(false);
        setMessage('Billboard type added successfully');
      }
    } catch (error: any) {
      setMessage('Failed to add billboard type: ' + error.message);
    }
  };

  const handleUpdateType = async () => {
    if (!editingType || !editingType.type_name.trim()) {
      setMessage('Type name is required');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('billboard_types')
        .update({
          type_name: editingType.type_name.trim(),
          description: editingType.description.trim(),
          is_active: editingType.is_active
        })
        .eq('id', editingType.id)
        .select()
        .single();

      if (error) {
        setMessage('Failed to update billboard type: ' + error.message);
      } else {
        setBillboardTypes(billboardTypes.map(type => 
          type.id === editingType.id ? data : type
        ));
        setEditingType(null);
        setMessage('Billboard type updated successfully');
      }
    } catch (error: any) {
      setMessage('Failed to update billboard type: ' + error.message);
    }
  };

  const handleDeleteType = async (id: number) => {
    if (!confirm('Are you sure you want to delete this billboard type? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('billboard_types')
        .delete()
        .eq('id', id);

      if (error) {
        // Handle foreign key constraint violation
        if (error.code === '23503') {
          setMessage('Cannot delete this billboard type because it is currently being used by existing billboards. Please either reassign those billboards to a different type or use the "Deactivate" button instead to disable this type.');
        } else {
          setMessage('Failed to delete billboard type: ' + error.message);
        }
      } else {
        setBillboardTypes(billboardTypes.filter(type => type.id !== id));
        setMessage('Billboard type deleted successfully');
      }
    } catch (error: any) {
      setMessage('Failed to delete billboard type: ' + error.message);
    }
  };

  const handleToggleStatus = async (type: BillboardType) => {
    try {
      const { data, error } = await supabase
        .from('billboard_types')
        .update({ is_active: !type.is_active })
        .eq('id', type.id)
        .select()
        .single();

      if (error) {
        setMessage('Failed to update status: ' + error.message);
      } else {
        setBillboardTypes(billboardTypes.map(t => 
          t.id === type.id ? data : t
        ));
        setMessage(`Billboard type ${data.is_active ? 'activated' : 'deactivated'} successfully`);
      }
    } catch (error: any) {
      setMessage('Failed to update status: ' + error.message);
    }
  };

  const filteredTypes = billboardTypes.filter(type =>
    type.type_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Only administrators can manage billboard types.
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
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading billboard types...</p>
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Billboard Type Management</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Manage billboard types that owners can select when adding their billboards.
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-900 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Type
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
                placeholder="Search billboard types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className="mb-6 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New Billboard Type</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type Name *
                  </label>
                  <input
                    type="text"
                    value={newType.type_name}
                    onChange={(e) => setNewType({...newType, type_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                    placeholder="e.g., Digital LED"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newType.description}
                    onChange={(e) => setNewType({...newType, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                    placeholder="Brief description of the billboard type"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newType.is_active}
                    onChange={(e) => setNewType({...newType, is_active: e.target.checked})}
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
                  onClick={handleAddType}
                  className="px-4 py-2 bg-blue-900 dark:bg-blue-700 text-white rounded-md hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors"
                >
                  Add Type
                </button>
              </div>
            </div>
          )}

          {/* Types List */}
          <div className="space-y-4">
            {filteredTypes.map((type) => (
              <div key={type.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                {editingType?.id === type.id ? (
                  // Edit Form
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Type Name *
                        </label>
                        <input
                          type="text"
                          value={editingType.type_name}
                          onChange={(e) => setEditingType({...editingType, type_name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={editingType.description}
                          onChange={(e) => setEditingType({...editingType, description: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editingType.is_active}
                          onChange={(e) => setEditingType({...editingType, is_active: e.target.checked})}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</span>
                      </label>
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => setEditingType(null)}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdateType}
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
                        <Monitor className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{type.type_name}</h3>
                        <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${
                          type.is_active 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400'
                        }`}>
                          {type.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {type.description && (
                        <p className="text-gray-600 dark:text-gray-400 mb-2">{type.description}</p>
                      )}
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Created: {new Date(type.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleStatus(type)}
                        className={`p-2 rounded-md transition-colors ${
                          type.is_active
                            ? 'text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50'
                            : 'text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50'
                        }`}
                        title={type.is_active ? 'Deactivate' : 'Activate'}
                      >
                        <CheckCircle className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setEditingType(type)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                        title="Edit type"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteType(type.id)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md transition-colors"
                        title="Delete type"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredTypes.length === 0 && (
            <div className="text-center py-12">
              <Monitor className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No billboard types found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchTerm ? 'No types match your search criteria.' : 'Add your first billboard type to get started.'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-blue-900 dark:bg-blue-700 text-white px-6 py-3 rounded-lg hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors"
                >
                  Add Your First Type
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillboardTypeManagement;