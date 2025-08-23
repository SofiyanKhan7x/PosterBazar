import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, IndianRupee, AlertTriangle } from 'lucide-react';
import { supabase, getBillboards } from '../services/supabase';
import { billboardTypes as mockBillboardTypes, billboards as mockBillboards } from '../data/mockData';

interface SearchFormData {
  state: string;
  city: string;
  startDate: string;
  endDate: string;
  minBudget: string;
  maxBudget: string;
  posterType: string;
  posterSize: string;
}

interface PosterType {
  id: number;
  type_name: string;
  description: string;
  is_active: boolean;
}

const indianStates = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry'
];

const citiesByState: { [key: string]: string[] } = {
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Amravati', 'Kolhapur', 'Sangli'],
  'Delhi': ['New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 'Central Delhi'],
  'Karnataka': ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum', 'Gulbarga', 'Dharwad', 'Bijapur', 'Shimoga', 'Davangere'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Trichy', 'Tirunelveli', 'Erode', 'Vellore', 'Thoothukudi', 'Thanjavur'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Junagadh', 'Anand', 'Nadiad'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Varanasi', 'Agra', 'Meerut', 'Allahabad', 'Ghaziabad', 'Noida', 'Gorakhpur', 'Aligarh'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Bikaner', 'Ajmer', 'Bhilwara', 'Alwar', 'Sikar', 'Sri Ganganagar'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman', 'Malda', 'Kharagpur', 'Darjeeling', 'Haldia'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Ramagundam', 'Mahbubnagar', 'Nalgonda', 'Adilabad', 'Suryapet'],
  'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Palakkad', 'Alappuzha', 'Kannur', 'Kottayam', 'Malappuram']
  // Add more states and cities as needed
};

const BillboardSearchForm: React.FC = () => {
  const navigate = useNavigate();
  const [posterTypes, setPosterTypes] = useState<PosterType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  
  // Get today's date in YYYY-MM-DD format
  const getTodaysDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };
  
  const [formData, setFormData] = useState<SearchFormData>({
    state: '',
    city: '',
    startDate: getTodaysDate(),
    endDate: '',
    minBudget: '',
    maxBudget: '',
    posterType: '',
    posterSize: ''
  });
  const [budgetError, setBudgetError] = useState('');

  // Load billboard types and set highest amount as default max budget
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load billboard types
        setLoadingTypes(true);
        
        if (supabase) {
          const { data, error } = await supabase
            .from('billboard_types')
            .select('*')
            .eq('is_active', true)
            .order('type_name');

          if (error) {
            throw error;
          }
          
          setPosterTypes(data || []);
        } else {
          throw new Error('Database service not available');
        }

        // Fetch all available poster records from data source
        
        if (supabase) {
          try {
            const billboards = await getBillboards();
            
            if (billboards && billboards.length > 0) {
              // Extract the numerical amount/value field from each poster record
              const posterAmounts = billboards
                .map(b => b.price_per_day)
                .filter(amount => amount != null && !isNaN(amount) && amount > 0);
              
              if (posterAmounts.length > 0) {
                // Identify the maximum (highest) value among all poster amounts
                const highestAmount = Math.max(...posterAmounts);
                setFormData(prev => ({ 
                  ...prev, 
                  maxBudget: highestAmount.toString() 
                }));
              } else {
                const fallbackMax = 100000;
                setFormData(prev => ({ ...prev, maxBudget: fallbackMax.toString() }));
              }
            } else {
              const fallbackMax = 100000;
              setFormData(prev => ({ ...prev, maxBudget: fallbackMax.toString() }));
            }
          } catch (supabaseError) {
            console.warn('Supabase not available, using mock data');
            const mockPosterAmounts = mockBillboards
              .map(b => b.price_per_day)
              .filter(amount => amount != null && !isNaN(amount) && amount > 0);
            const mockFallbackMax = mockPosterAmounts.length > 0 ? Math.max(...mockPosterAmounts) : 50000;
            setFormData(prev => ({ ...prev, maxBudget: mockFallbackMax.toString() }));
            setFormData(prev => ({ ...prev, maxBudget: mockFallbackMax.toString() }));
          }
        } else {
          console.warn('Supabase not available, using mock data');
          const mockPosterAmounts = mockBillboards
            .map(b => b.price_per_day)
            .filter(amount => amount != null && !isNaN(amount) && amount > 0);
          const mockFallbackMax = mockPosterAmounts.length > 0 ? Math.max(...mockPosterAmounts) : 50000;
          setFormData(prev => ({ ...prev, maxBudget: mockFallbackMax.toString() }));
        }
      } catch (error) {
        console.error('Failed to load data from database:', error);
        console.warn('Using fallback mock data');
        setPosterTypes(mockBillboardTypes);
        const mockPosterAmounts = mockBillboards
          .map(b => b.price_per_day)
          .filter(amount => amount != null && !isNaN(amount) && amount > 0);
        const mockFallbackMax = mockPosterAmounts.length > 0 ? Math.max(...mockPosterAmounts) : 50000;
        setFormData(prev => ({ ...prev, maxBudget: mockFallbackMax.toString() }));
      } finally {
        setLoadingTypes(false);
      }
    };

    loadData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      // Reset city when state changes
      if (name === 'state') {
        return { ...prev, [name]: value, city: '' };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams();
    Object.entries(formData).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    navigate(`/explore?${params.toString()}`);
  };

  const handleBudgetChange = (field: 'minBudget' | 'maxBudget', value: string) => {
    const numValue = parseFloat(value);
    
    // Clear any existing error
    setBudgetError('');
    
    // Validate for negative values
    if (value !== '' && numValue < 0) {
      setBudgetError('Budget cannot be negative. Please enter 0 or a positive amount.');
      return;
    }
    
    // Update form data
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Additional validation for min/max relationship
    if (field === 'minBudget' && formData.maxBudget && numValue > parseFloat(formData.maxBudget)) {
      setBudgetError('Minimum budget cannot be greater than maximum budget.');
    } else if (field === 'maxBudget' && formData.minBudget && numValue < parseFloat(formData.minBudget)) {
      setBudgetError('Maximum budget cannot be less than minimum budget.');
    }
  };

  const availableCities = formData.state ? (citiesByState[formData.state] || []) : [];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              State
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <select
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-gray-900"
                required
              >
                <option value="">Select State</option>
                {indianStates.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              City
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <select
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-gray-900"
                disabled={!formData.state}
              >
                <option value="">Select City</option>
                {availableCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-gray-900"
              />
            </div>
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-gray-900"
              />
            </div>
          </div>

          <div>
            <label htmlFor="budgetRange" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Budget Range (₹)
            </label>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="number"
                  id="minBudget"
                  name="minBudget"
                  value={formData.minBudget}
                  onChange={(e) => handleBudgetChange('minBudget', e.target.value)}
                  min="0"
                  step="100"
                  placeholder="Min"
                  className={`pl-10 w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-gray-900 ${
                    budgetError ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
              </div>
              <span className="text-gray-500 dark:text-gray-400">to</span>
              <div className="relative flex-1">
                <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="number"
                  id="maxBudget"
                  name="maxBudget"
                  value={formData.maxBudget}
                  onChange={(e) => handleBudgetChange('maxBudget', e.target.value)}
                  min="0"
                  step="100"
                  placeholder="Max"
                  className={`pl-10 w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-gray-900 ${
                    budgetError ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
              </div>
            </div>
            {budgetError && (
              <div className="mt-2 flex items-center text-red-600 dark:text-red-400">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <span className="text-sm">{budgetError}</span>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="posterType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Poster Type
            </label>
            {loadingTypes ? (
              <div className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                Loading poster types...
              </div>
            ) : (
              <select
                id="posterType"
                name="posterType"
                value={formData.posterType}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-gray-900"
              >
                <option value="" className="text-gray-900 dark:text-white">All Types</option>
                {posterTypes.map(type => (
                  <option key={type.id} value={type.type_name.toLowerCase()} className="text-gray-900 dark:text-white">
                    {type.type_name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-end justify-center md:col-span-3">
            <button
              type="submit"
              disabled={!!budgetError}
              className={`w-full py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center font-medium ${
                budgetError 
                  ? 'bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-400 cursor-not-allowed' 
                  : 'bg-blue-900 dark:bg-blue-700 text-white hover:bg-blue-800 dark:hover:bg-blue-600'
              }`}
            >
              <Search className="h-5 w-5 mr-2" />
              Search Posters
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default BillboardSearchForm;