import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Plus, Edit, Trash2, Search, 
   Navigation, Globe, CheckCircle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  latitude?: number;
  longitude?: number;
  googleMapsLink?: string;
  status: 'active' | 'inactive';
  billboardCount: number;
}

const LocationManagement: React.FC = () => {
  const { user } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLocation, setNewLocation] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    latitude: '',
    longitude: '',
    googleMapsLink: ''
  });

  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddLocation = () => {
    if (!newLocation.name || !newLocation.address || !newLocation.city || !newLocation.state) {
      alert('Please fill in all required fields');
      return;
    }

    const location: Location = {
      id: Date.now().toString(),
      name: newLocation.name,
      address: newLocation.address,
      city: newLocation.city,
      state: newLocation.state,
      latitude: newLocation.latitude ? parseFloat(newLocation.latitude) : undefined,
      longitude: newLocation.longitude ? parseFloat(newLocation.longitude) : undefined,
      googleMapsLink: newLocation.googleMapsLink || undefined,
      status: 'active',
      billboardCount: 0
    };

    setLocations([...locations, location]);
    setNewLocation({
      name: '',
      address: '',
      city: '',
      state: '',
      latitude: '',
      longitude: '',
      googleMapsLink: ''
    });
    setShowAddForm(false);
  };

  const handleDeleteLocation = (id: string) => {
    if (confirm('Are you sure you want to delete this location?')) {
      setLocations(locations.filter(loc => loc.id !== id));
    }
  };

  const handleToggleStatus = (id: string) => {
    setLocations(locations.map(loc => 
      loc.id === id 
        ? { ...loc, status: loc.status === 'active' ? 'inactive' : 'active' }
        : loc
    ));
  };

  const extractCoordinatesFromMapsLink = (link: string) => {
    const regex = /q=(-?\d+\.?\d*),(-?\d+\.?\d*)/;
    const match = link.match(regex);
    if (match) {
      return {
        latitude: match[1],
        longitude: match[2]
      };
    }
    return null;
  };

  const handleMapsLinkChange = (value: string) => {
    setNewLocation(prev => ({ ...prev, googleMapsLink: value }));
    
    const coords = extractCoordinatesFromMapsLink(value);
    if (coords) {
      setNewLocation(prev => ({
        ...prev,
        latitude: coords.latitude,
        longitude: coords.longitude
      }));
    }
  };

  if (!user || user.role !== 'owner') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Only billboard owners can manage locations.
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Location Management</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Manage your billboard locations with GPS coordinates and map integration.
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-900 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Location
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Add Location Form */}
          {showAddForm && (
            <div className="mb-6 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New Location</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Location Name *
                  </label>
                  <input
                    type="text"
                    value={newLocation.name}
                    onChange={(e) => setNewLocation({...newLocation, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                    placeholder="e.g., Downtown Commercial District"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Address *
                  </label>
                  <input
                    type="text"
                    value={newLocation.address}
                    onChange={(e) => setNewLocation({...newLocation, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                    placeholder="Street address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    value={newLocation.city}
                    onChange={(e) => setNewLocation({...newLocation, city: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                    placeholder="City name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    value={newLocation.state}
                    onChange={(e) => setNewLocation({...newLocation, state: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                    placeholder="State name"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Google Maps Link
                  </label>
                  <input
                    type="url"
                    value={newLocation.googleMapsLink}
                    onChange={(e) => handleMapsLinkChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                    placeholder="https://maps.google.com/?q=lat,lng"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Coordinates will be automatically extracted from the Google Maps link
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={newLocation.latitude}
                    onChange={(e) => setNewLocation({...newLocation, latitude: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                    placeholder="19.0760"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={newLocation.longitude}
                    onChange={(e) => setNewLocation({...newLocation, longitude: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                    placeholder="72.8777"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddLocation}
                  className="px-4 py-2 bg-blue-900 dark:bg-blue-700 text-white rounded-md hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors"
                >
                  Add Location
                </button>
              </div>
            </div>
          )}

          {/* Locations List */}
          <div className="space-y-4">
            {filteredLocations.map((location) => (
              <div key={location.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{location.name}</h3>
                      <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${
                        location.status === 'active' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400'
                      }`}>
                        {location.status}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400 mb-2">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{location.address}, {location.city}, {location.state}</span>
                    </div>
                    {location.latitude && location.longitude && (
                      <div className="flex items-center text-gray-600 dark:text-gray-400 mb-2">
                        <Navigation className="h-4 w-4 mr-1" />
                        <span>Lat: {location.latitude}, Lng: {location.longitude}</span>
                      </div>
                    )}
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {location.billboardCount} billboard(s) at this location
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {location.googleMapsLink && (
                      <a
                        href={location.googleMapsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-colors"
                        title="View on Google Maps"
                      >
                        <Globe className="h-5 w-5" />
                      </a>
                    )}
                    <button
                      onClick={() => handleToggleStatus(location.id)}
                      className={`p-2 rounded-md transition-colors ${
                        location.status === 'active'
                          ? 'text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50'
                          : 'text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50'
                      }`}
                      title={location.status === 'active' ? 'Deactivate' : 'Activate'}
                    >
                      <CheckCircle className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => console.log('Edit location:', location.id)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                      title="Edit location"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteLocation(location.id)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md transition-colors"
                      title="Delete location"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredLocations.length === 0 && (
            <div className="text-center py-12">
              <MapPin className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No locations found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchTerm ? 'No locations match your search criteria.' : 'Add your first location to get started.'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-blue-900 dark:bg-blue-700 text-white px-6 py-3 rounded-lg hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors"
                >
                  Add Your First Location
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationManagement;