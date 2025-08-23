import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
   ArrowLeft, Ruler, Edit, Save, X, Plus,
   Monitor, Lightbulb, Shield, CheckCircle, Zap
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface Specification {
  id: string;
  billboardId: string;
  billboardName: string;
  dimensions: string;
  type: 'digital' | 'static' | 'mobile' | 'transit';
  facing: string;
  illumination: boolean;
  weatherResistant: boolean;
  resolution?: string;
  brightness?: string;
  powerConsumption?: string;
  installationHeight: string;
  viewingDistance: string;
  features: string[];
  lastUpdated: string;
}

const SpecificationManagement: React.FC = () => {
  const { user } = useAuth();
  const [specifications, setSpecifications] = useState<Specification[]>([]);

  const [editingSpec, setEditingSpec] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Specification>>({});
  const [newFeature, setNewFeature] = useState('');

  const handleEdit = (spec: Specification) => {
    setEditingSpec(spec.id);
    setEditForm({ ...spec });
  };

  const handleSave = () => {
    if (editingSpec && editForm) {
      setSpecifications(specs => 
        specs.map(spec => 
          spec.id === editingSpec 
            ? { ...spec, ...editForm, lastUpdated: new Date().toISOString().split('T')[0] }
            : spec
        )
      );
      setEditingSpec(null);
      setEditForm({});
    }
  };

  const handleCancel = () => {
    setEditingSpec(null);
    setEditForm({});
  };

  const handleAddFeature = () => {
    if (newFeature.trim() && editForm.features) {
      setEditForm({
        ...editForm,
        features: [...editForm.features, newFeature.trim()]
      });
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    if (editForm.features) {
      setEditForm({
        ...editForm,
        features: editForm.features.filter((_, i) => i !== index)
      });
    }
  };

  if (!user || user.role !== 'owner') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Only billboard owners can manage specifications.
        </p>
        <Link to="/dashboard" className="text-blue-900 dark:text-blue-400 hover:underline">
          Go to Dashboard
        </Link>
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Specification Management</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Update dimensions, technical details, and features for your billboards.
          </p>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            {specifications.map((spec) => (
              <div key={spec.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{spec.billboardName}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Last updated: {spec.lastUpdated}</p>
                  </div>
                  {editingSpec !== spec.id && (
                    <button
                      onClick={() => handleEdit(spec)}
                      className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                  )}
                </div>

                {editingSpec === spec.id ? (
                  // Edit Form
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Dimensions
                        </label>
                        <input
                          type="text"
                          value={editForm.dimensions || ''}
                          onChange={(e) => setEditForm({...editForm, dimensions: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Type
                        </label>
                        <select
                          value={editForm.type || ''}
                          onChange={(e) => setEditForm({...editForm, type: e.target.value as any})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="digital">Digital</option>
                          <option value="static">Static</option>
                          <option value="mobile">Mobile</option>
                          <option value="transit">Transit</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Facing Direction
                        </label>
                        <select
                          value={editForm.facing || ''}
                          onChange={(e) => setEditForm({...editForm, facing: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="North">North</option>
                          <option value="South">South</option>
                          <option value="East">East</option>
                          <option value="West">West</option>
                          <option value="Northeast">Northeast</option>
                          <option value="Northwest">Northwest</option>
                          <option value="Southeast">Southeast</option>
                          <option value="Southwest">Southwest</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Installation Height
                        </label>
                        <input
                          type="text"
                          value={editForm.installationHeight || ''}
                          onChange={(e) => setEditForm({...editForm, installationHeight: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Viewing Distance
                        </label>
                        <input
                          type="text"
                          value={editForm.viewingDistance || ''}
                          onChange={(e) => setEditForm({...editForm, viewingDistance: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Digital-specific fields */}
                    {editForm.type === 'digital' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Resolution
                          </label>
                          <input
                            type="text"
                            value={editForm.resolution || ''}
                            onChange={(e) => setEditForm({...editForm, resolution: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            placeholder="1920x1080"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Brightness
                          </label>
                          <input
                            type="text"
                            value={editForm.brightness || ''}
                            onChange={(e) => setEditForm({...editForm, brightness: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            placeholder="5000 nits"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Power Consumption
                          </label>
                          <input
                            type="text"
                            value={editForm.powerConsumption || ''}
                            onChange={(e) => setEditForm({...editForm, powerConsumption: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            placeholder="2.5 kW"
                          />
                        </div>
                      </div>
                    )}

                    {/* Checkboxes */}
                    <div className="flex space-x-6">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editForm.illumination || false}
                          onChange={(e) => setEditForm({...editForm, illumination: e.target.checked})}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Illuminated</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editForm.weatherResistant || false}
                          onChange={(e) => setEditForm({...editForm, weatherResistant: e.target.checked})}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Weather Resistant</span>
                      </label>
                    </div>

                    {/* Features */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Features
                      </label>
                      <div className="space-y-2">
                        {editForm.features?.map((feature, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">
                            <span className="text-sm text-gray-900 dark:text-white">{feature}</span>
                            <button
                              onClick={() => handleRemoveFeature(index)}
                              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={newFeature}
                            onChange={(e) => setNewFeature(e.target.value)}
                            placeholder="Add new feature"
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            onKeyPress={(e) => e.key === 'Enter' && handleAddFeature()}
                          />
                          <button
                            onClick={handleAddFeature}
                            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-900 dark:bg-blue-700 text-white rounded-md hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors flex items-center"
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  // Display Mode
                  <div className="space-y-4">
                    {/* Basic Specifications */}
                    <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Specifications</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                          <div className="flex items-center mb-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                              <Ruler className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Dimensions</p>
                              <p className="text-lg font-bold text-gray-900 dark:text-white">{spec.dimensions}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                          <div className="flex items-center mb-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                              <Monitor className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Type</p>
                              <p className="text-lg font-bold text-gray-900 dark:text-white capitalize">{spec.type}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                          <div className="flex items-center mb-3">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                              <div className="h-5 w-5 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                                <span className="text-sm font-bold">N</span>
                              </div>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Facing</p>
                              <p className="text-lg font-bold text-gray-900 dark:text-white">{spec.facing}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                          <div className="flex items-center mb-3">
                            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                              <div className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex items-center justify-center">
                                <span className="text-sm font-bold">H</span>
                              </div>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Height</p>
                              <p className="text-lg font-bold text-gray-900 dark:text-white">{spec.installationHeight}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Digital-Specific Specifications */}
                    {spec.type === 'digital' && (
                      <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Digital Display Specifications</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                            <div className="flex items-center mb-3">
                              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                                <Monitor className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Resolution</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">{spec.resolution}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                            <div className="flex items-center mb-3">
                              <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                                <Lightbulb className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Brightness</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">{spec.brightness}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                            <div className="flex items-center mb-3">
                              <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                                <Zap className="h-5 w-5 text-red-600 dark:text-red-400" />
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Power</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">{spec.powerConsumption}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Additional Features */}
                    <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Additional Features</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                          <div className="flex items-center">
                            <div className={`p-2 rounded-lg ${spec.illumination ? 'bg-yellow-100 dark:bg-yellow-900/50' : 'bg-gray-100 dark:bg-gray-700'}`}>
                              <Lightbulb className={`h-5 w-5 ${spec.illumination ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-400'}`} />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Illumination</p>
                              <p className={`text-lg font-bold ${spec.illumination ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                {spec.illumination ? 'Illuminated' : 'Not Illuminated'}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                          <div className="flex items-center">
                            <div className={`p-2 rounded-lg ${spec.weatherResistant ? 'bg-green-100 dark:bg-green-900/50' : 'bg-gray-100 dark:bg-gray-700'}`}>
                              <Shield className={`h-5 w-5 ${spec.weatherResistant ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Weather Protection</p>
                              <p className={`text-lg font-bold ${spec.weatherResistant ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                {spec.weatherResistant ? 'Weather Resistant' : 'Indoor Use'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Features Section */}
                    <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Features & Capabilities</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {spec.features.map((feature, index) => (
                          <div
                            key={index}
                            className="flex items-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600"
                          >
                            <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {specifications.length === 0 && (
            <div className="text-center py-12">
              <Ruler className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No specifications found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Add billboards to your account to manage their specifications.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpecificationManagement;