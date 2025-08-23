import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
   ArrowLeft, Plus, Edit, Trash2, Save, CheckCircle, 
  AlertTriangle, Search, MessageSquare
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../services/supabase';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
  avatar: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const TestimonialManagement: React.FC = () => {
  const { user } = useAuth();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [newTestimonial, setNewTestimonial] = useState({
    name: '',
    role: '',
    quote: '',
    avatar: '',
    is_active: true
  });

  useEffect(() => {
    loadTestimonials();
  }, []);

  const loadTestimonials = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading testimonials:', error);
        setMessage('Failed to load testimonials');
      } else {
        setTestimonials(data || []);
      }
    } catch (error) {
      console.error('Error loading testimonials:', error);
      setMessage('Failed to load testimonials');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTestimonial = async () => {
    if (!newTestimonial.name.trim() || !newTestimonial.quote.trim()) {
      setMessage('Name and quote are required');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('testimonials')
        .insert({
          name: newTestimonial.name.trim(),
          role: newTestimonial.role.trim(),
          quote: newTestimonial.quote.trim(),
          avatar: newTestimonial.avatar.trim(),
          is_active: newTestimonial.is_active
        })
        .select()
        .single();

      if (error) {
        setMessage('Failed to add testimonial: ' + error.message);
      } else {
        setTestimonials([data, ...testimonials]);
        setNewTestimonial({ name: '', role: '', quote: '', avatar: '', is_active: true });
        setShowAddForm(false);
        setMessage('Testimonial added successfully');
      }
    } catch (error: any) {
      setMessage('Failed to add testimonial: ' + error.message);
    }
  };

  const handleUpdateTestimonial = async () => {
    if (!editingTestimonial || !editingTestimonial.name.trim() || !editingTestimonial.quote.trim()) {
      setMessage('Name and quote are required');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('testimonials')
        .update({
          name: editingTestimonial.name.trim(),
          role: editingTestimonial.role?.trim(),
          quote: editingTestimonial.quote.trim(),
          avatar: editingTestimonial.avatar?.trim(),
          is_active: editingTestimonial.is_active
        })
        .eq('id', editingTestimonial.id)
        .select()
        .single();

      if (error) {
        setMessage('Failed to update testimonial: ' + error.message);
      } else {
        setTestimonials(testimonials.map(t => 
          t.id === editingTestimonial.id ? data : t
        ));
        setEditingTestimonial(null);
        setMessage('Testimonial updated successfully');
      }
    } catch (error: any) {
      setMessage('Failed to update testimonial: ' + error.message);
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    if (!confirm('Are you sure you want to delete this testimonial? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', id);

      if (error) {
        setMessage('Failed to delete testimonial: ' + error.message);
      } else {
        setTestimonials(testimonials.filter(t => t.id !== id));
        setMessage('Testimonial deleted successfully');
      }
    } catch (error: any) {
      setMessage('Failed to delete testimonial: ' + error.message);
    }
  };

  const handleToggleStatus = async (testimonial: Testimonial) => {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .update({ is_active: !testimonial.is_active })
        .eq('id', testimonial.id)
        .select()
        .single();

      if (error) {
        setMessage('Failed to update status: ' + error.message);
      } else {
        setTestimonials(testimonials.map(t => 
          t.id === testimonial.id ? data : t
        ));
        setMessage(`Testimonial ${data.is_active ? 'activated' : 'deactivated'} successfully`);
      }
    } catch (error: any) {
      setMessage('Failed to update status: ' + error.message);
    }
  };

  const filteredTestimonials = testimonials.filter(testimonial =>
    testimonial.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    testimonial.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    testimonial.quote.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Only administrators can manage testimonials.
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
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading testimonials...</p>
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Testimonial Management</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Manage client testimonials that appear on the homepage.
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-900 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Testimonial
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
                  <AlertTriangle className="h-5 w-5 mr-2" />
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
                placeholder="Search testimonials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className="mb-6 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New Testimonial</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={newTestimonial.name}
                    onChange={(e) => setNewTestimonial({...newTestimonial, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                    placeholder="e.g., Rajesh Gupta"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role/Company
                  </label>
                  <input
                    type="text"
                    value={newTestimonial.role}
                    onChange={(e) => setNewTestimonial({...newTestimonial, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                    placeholder="e.g., Marketing Director, TechCorp India"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Quote *
                  </label>
                  <textarea
                    value={newTestimonial.quote}
                    onChange={(e) => setNewTestimonial({...newTestimonial, quote: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                    placeholder="Client testimonial text..."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Avatar URL
                  </label>
                  <input
                    type="url"
                    value={newTestimonial.avatar}
                    onChange={(e) => setNewTestimonial({...newTestimonial, avatar: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                    placeholder="https://example.com/avatar.jpg"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Use a square image from Pexels or another royalty-free source
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newTestimonial.is_active}
                    onChange={(e) => setNewTestimonial({...newTestimonial, is_active: e.target.checked})}
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
                  onClick={handleAddTestimonial}
                  className="px-4 py-2 bg-blue-900 dark:bg-blue-700 text-white rounded-md hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors"
                >
                  Add Testimonial
                </button>
              </div>
            </div>
          )}

          {/* Testimonials List */}
          <div className="space-y-4">
            {filteredTestimonials.map((testimonial) => (
              <div key={testimonial.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                {editingTestimonial?.id === testimonial.id ? (
                  // Edit Form
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Name *
                        </label>
                        <input
                          type="text"
                          value={editingTestimonial.name}
                          onChange={(e) => setEditingTestimonial({...editingTestimonial, name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Role/Company
                        </label>
                        <input
                          type="text"
                          value={editingTestimonial.role || ''}
                          onChange={(e) => setEditingTestimonial({...editingTestimonial, role: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Quote *
                        </label>
                        <textarea
                          value={editingTestimonial.quote}
                          onChange={(e) => setEditingTestimonial({...editingTestimonial, quote: e.target.value})}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Avatar URL
                        </label>
                        <input
                          type="url"
                          value={editingTestimonial.avatar || ''}
                          onChange={(e) => setEditingTestimonial({...editingTestimonial, avatar: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editingTestimonial.is_active}
                          onChange={(e) => setEditingTestimonial({...editingTestimonial, is_active: e.target.checked})}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</span>
                      </label>
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => setEditingTestimonial(null)}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdateTestimonial}
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
                        <div className="h-12 w-12 rounded-full overflow-hidden mr-4 border border-gray-200 dark:border-gray-600">
                          {testimonial.avatar ? (
                            <img 
                              src={testimonial.avatar} 
                              alt={testimonial.name} 
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <span className="text-gray-500 dark:text-gray-400 text-xs font-bold">
                                {testimonial.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{testimonial.name}</h3>
                          {testimonial.role && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">{testimonial.role}</p>
                          )}
                        </div>
                        <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${
                          testimonial.is_active 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400'
                        }`}>
                          {testimonial.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-2">
                        <p className="text-gray-700 dark:text-gray-300 italic">"{testimonial.quote}"</p>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Added: {new Date(testimonial.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleStatus(testimonial)}
                        className={`p-2 rounded-md transition-colors ${
                          testimonial.is_active
                            ? 'text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50'
                            : 'text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50'
                        }`}
                        title={testimonial.is_active ? 'Deactivate' : 'Activate'}
                      >
                        <CheckCircle className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setEditingTestimonial(testimonial)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                        title="Edit testimonial"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTestimonial(testimonial.id)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md transition-colors"
                        title="Delete testimonial"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredTestimonials.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No testimonials found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchTerm ? 'No testimonials match your search criteria.' : 'Add your first testimonial to get started.'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-blue-900 dark:bg-blue-700 text-white px-6 py-3 rounded-lg hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors"
                >
                  Add Your First Testimonial
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestimonialManagement;