import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, MapPin, Grid, List } from 'lucide-react';
import BillboardCard from '../components/BillboardCard';
import BillboardMap from '../components/BillboardMap';
import BillboardSearchForm from '../components/BillboardSearchForm';
import { supabase, getActiveBillboardBookings } from '../services/supabase';
import VendorAdDisplay from '../components/VendorAdDisplay';

interface BillboardType {
  id: number;
  type_name: string;
  description: string;
  is_active: boolean;
}

const Explore: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [filteredBillboards, setFilteredBillboards] = useState<any[]>([]);
  const [allBillboards, setAllBillboards] = useState<any[]>([]);
  const [bookingStatuses, setBookingStatuses] = useState<Map<string, any>>(new Map());
  const [, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [sortBy, setSortBy] = useState<'price' | 'location' | 'impressions'>('price');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [billboardTypes, setBillboardTypes] = useState<BillboardType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);

  // Load activated billboard types from database
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load billboard types
        const { data, error } = await supabase
          .from('billboard_types')
          .select('*')
          .eq('is_active', true)
          .order('type_name');

        if (error) {
          console.error('Error loading billboard types:', error);
          setBillboardTypes([]);
        } else {
          setBillboardTypes(data || []);
        }
        
        // Load all billboards
        const { data: billboardData, error: billboardError } = await supabase
          .from('billboards')
          .select(`
            *,
            billboard_images(image_url, image_type),
            billboard_type:billboard_types(type_name),
            owner:users!billboards_owner_id_fkey(name)
          `)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (billboardError) {
          console.error('Error loading billboards:', billboardError);
          setAllBillboards([]);
        } else {
          setAllBillboards(billboardData || []);
          
          // Load booking statuses for each billboard
          const statusMap = new Map();
          for (const billboard of billboardData || []) {
            try {
              const bookings = await getActiveBillboardBookings(billboard.id);
              if (bookings.length > 0) {
                const latestBooking = bookings[0];
                statusMap.set(billboard.id, {
                  isBooked: true,
                  bookedUntil: new Date(latestBooking.end_date).toLocaleDateString(),
                  nextAvailable: new Date(new Date(latestBooking.end_date).getTime() + 24 * 60 * 60 * 1000).toLocaleDateString()
                });
              } else {
                statusMap.set(billboard.id, { isBooked: false });
              }
            } catch (bookingError) {
              console.warn(`Failed to load booking status for billboard ${billboard.id}:`, bookingError);
              statusMap.set(billboard.id, { isBooked: false });
            }
          }
          setBookingStatuses(statusMap);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setBillboardTypes([]);
        setAllBillboards([]);
      } finally {
        setLoadingTypes(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    // Apply filters based on URL parameters
    let filtered = [...allBillboards];
    
    const state = searchParams.get('state');
    const city = searchParams.get('city');
    const minBudget = searchParams.get('minBudget');
    const maxBudget = searchParams.get('maxBudget');
    const billboardType = searchParams.get('billboardType');
    
    if (state) {
      filtered = filtered.filter(billboard => 
        billboard.state?.toLowerCase().includes(state.toLowerCase()) ||
        billboard.location_address?.toLowerCase().includes(state.toLowerCase())
      );
    }
    
    if (city) {
      filtered = filtered.filter(billboard => 
        billboard.city?.toLowerCase().includes(city.toLowerCase()) ||
        billboard.location_address?.toLowerCase().includes(city.toLowerCase())
      );
    }
    
    if (minBudget) {
      filtered = filtered.filter(billboard => 
        billboard.price_per_day >= parseInt(minBudget)
      );
    }
    
    if (maxBudget) {
      filtered = filtered.filter(billboard => 
        billboard.price_per_day <= parseInt(maxBudget)
      );
    }
    
    if (billboardType) {
      filtered = filtered.filter(billboard => 
        billboard.billboard_type?.type_name?.toLowerCase() === billboardType.toLowerCase()
      );
    }
    
    // Sort billboards
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'price':
          aValue = a.price_per_day;
          bValue = b.price_per_day;
          break;
        case 'location':
          aValue = a.location_address;
          bValue = b.location_address;
          break;
        case 'impressions':
          aValue = a.daily_views;
          bValue = b.daily_views;
          break;
        default:
          aValue = a.price_per_day;
          bValue = b.price_per_day;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return sortOrder === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
    });
    
    setFilteredBillboards(filtered);
  }, [allBillboards, searchParams, sortBy, sortOrder]);

  return (
    <div>
      {/* Hero Section with Search */}
      <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 dark:from-blue-950 dark:via-blue-900 dark:to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Explore Premium Billboards
            </h1>
            <p className="text-xl text-blue-100 dark:text-blue-200 max-w-3xl mx-auto">
              Find the perfect billboard location for your advertising campaign
            </p>
          </div>
          
          <BillboardSearchForm />
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Available Billboards
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {filteredBillboards.length} billboards found
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Sort Options */}
            <div className="flex items-center space-x-2">
              <label htmlFor="sortBy" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Sort by:
              </label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'price' | 'location' | 'impressions')}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              >
                <option value="price">Price</option>
                <option value="location">Location</option>
                <option value="impressions">Daily Views</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>

            {/* Billboard Type Filter */}
            <div className="flex items-center space-x-2">
              <label htmlFor="billboardTypeFilter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Type:
              </label>
              {!loadingTypes && (
                <select
                  id="billboardTypeFilter"
                  value={searchParams.get('billboardType') || ''}
                  onChange={(e) => {
                    const params = new URLSearchParams(searchParams);
                    if (e.target.value) {
                      params.set('billboardType', e.target.value);
                    } else {
                      params.delete('billboardType');
                    }
                    window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                >
                  <option value="">All Types</option>
                  {billboardTypes.map((type) => (
                    <option key={type.id} value={type.type_name}>
                      {type.type_name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-white dark:bg-gray-600 text-blue-900 dark:text-blue-400 shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
                aria-label="Grid view"
              >
                <Grid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-white dark:bg-gray-600 text-blue-900 dark:text-blue-400 shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
                aria-label="List view"
              >
                <List className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'map' 
                    ? 'bg-white dark:bg-gray-600 text-blue-900 dark:text-blue-400 shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
                aria-label="Map view"
              >
                <MapPin className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Results Display */}
        {viewMode === 'map' ? (
          <BillboardMap billboards={filteredBillboards} />
        ) : (
          <div className="w-full">
            <div className={`${
              viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'
                : 'space-y-6'
            }`}>
              {filteredBillboards.map((billboard: any) => (
                <BillboardCard 
                  key={billboard.id} 
                  billboard={billboard}
                  bookingStatus={bookingStatuses.get(billboard.id)}
                />
              ))}
            </div>
          </div>
        )}

        {filteredBillboards.length === 0 && (
          <div className="text-center py-16">
            <Search className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              No billboards found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Try adjusting your search criteria or browse all available billboards.
            </p>
            <button
              onClick={() => window.location.href = '/explore'}
              className="bg-blue-900 dark:bg-blue-700 text-white px-6 py-3 rounded-md hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors"
            >
              View All Billboards
            </button>
          </div>
        )}
        
        {/* Vendor Ads at Bottom */}
        <div className="mt-12">
          <VendorAdDisplay position="footer" maxAds={1} />
        </div>
      </div>
    </div>
  );
};

export default Explore;