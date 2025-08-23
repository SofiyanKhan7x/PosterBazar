import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
   MapPin, Calendar, CheckCircle, Users, Eye, 
   ArrowLeft, Share2, Heart, IndianRupee, ShoppingCart,
   AlertTriangle, Clock
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { CartService } from '../services/cartService';
import TwoSidedBillboardSelector from '../components/TwoSidedBillboardSelector';
import { getActiveBillboardBookings } from '../services/supabase';
import { billboards as mockBillboards } from '../data/mockData';

const BillboardDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [billboard, setBillboard] = useState<any | null>(null);
  const [bookingStatus, setBookingStatus] = useState<any>(null);
  const [activeImage, setActiveImage] = useState<string>('');
  const [isWishlist, setIsWishlist] = useState<boolean>(false);
  const [selectedSide, setSelectedSide] = useState<'A' | 'B' | 'BOTH' | 'SINGLE'>('SINGLE');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [addingToCart, setAddingToCart] = useState(false);
  const [message, setMessage] = useState('');
  
  // Mock two-sided billboard data
  const [billboardSides] = useState([
    {
      id: 'side-1',
      billboard_id: id || '',
      side_identifier: 'SINGLE' as const,
      side_name: 'Main Display',
      description: 'Primary billboard display',
      price_per_day: billboard?.pricePerDay || 0,
      is_available: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]);
  
  useEffect(() => {
    if (id) {
      loadBillboard();
      loadBookingStatus();
    }
  }, [id]);

  const loadBillboard = async () => {
    try {
      if (supabase) {
        // Try to fetch from Supabase first
        const { data, error } = await supabase
          .from('billboards')
          .select(`
            *,
            billboard_images(id, image_url, image_type, display_order),
            billboard_sides(id, side_identifier, side_name, description, price_per_day, is_available)
          `)
          .eq('id', id)
          .single();
        
        if (error) throw error;
        
        if (data) {
          const transformedBillboard = {
            id: data.id,
            title: data.title,
            location: `${data.city}, ${data.state}`,
            pricePerDay: data.price_per_day,
            minDays: data.min_days,
            owner: 'Billboard Owner',
            impressions: data.daily_views,
            type: 'digital',
            size: 'large',
            dimensions: data.dimensions,
            facing: data.facing,
            features: data.features.split(', '),
            description: data.description,
            additionalInfo: 'Located in high-traffic area',
            imageUrl: data.billboard_images?.find((img: any) => img.image_type === 'main')?.image_url || 
                     (data.billboard_images && data.billboard_images.length > 0 ? data.billboard_images[0].image_url : 
                      'https://images.pexels.com/photos/1666021/pexels-photo-1666021.jpeg?auto=compress&cs=tinysrgb&w=800&h=450&fit=crop'),
            additionalImages: data.billboard_images?.filter((img: any) => img.image_type !== 'main').map((img: any) => img.image_url) || [],
            billboard_sides: data.billboard_sides || [],
            is_two_sided: data.is_two_sided || false
          };
          setBillboard(transformedBillboard);
          setActiveImage(transformedBillboard.imageUrl);
          return;
        }
      }
    } catch (error) {
      console.warn('Supabase error, using mock data:', error);
    }
    
    // Fallback to mock data
    const mockBillboard = mockBillboards.find(b => b.id === id);
    if (mockBillboard) {
      const transformedBillboard = {
        id: mockBillboard.id,
        title: mockBillboard.title,
        location: `${mockBillboard.city}, ${mockBillboard.state}`,
        pricePerDay: mockBillboard.price_per_day,
        minDays: mockBillboard.min_days,
        owner: 'Billboard Owner',
        impressions: mockBillboard.daily_views,
        type: 'digital',
        size: 'large',
        dimensions: mockBillboard.dimensions,
        facing: mockBillboard.facing,
        features: mockBillboard.features.split(', '),
        description: mockBillboard.description,
        additionalInfo: 'Located in high-traffic area',
        imageUrl: mockBillboard.imageUrl,
        additionalImages: mockBillboard.additionalImages || []
      };
      setBillboard(transformedBillboard);
      setActiveImage(transformedBillboard.imageUrl);
    } else {
      // Default fallback if no mock data found
      setBillboard({
        id: id,
        title: 'Premium Highway Billboard',
        location: 'Mumbai, Maharashtra',
        pricePerDay: 5000,
        minDays: 7,
        owner: 'John Doe',
        impressions: 50000,
        type: 'digital',
        size: 'large',
        dimensions: '20x10 ft',
        facing: 'North',
        features: ['LED Display', 'Night Illumination', 'Weather Resistant'],
        description: 'Premium billboard with excellent visibility',
        additionalInfo: 'Located in high-traffic area',
        imageUrl: 'https://images.pexels.com/photos/1666021/pexels-photo-1666021.jpeg?auto=compress&cs=tinysrgb&w=800&h=450&fit=crop',
        additionalImages: []
      });
      setActiveImage('https://images.pexels.com/photos/1666021/pexels-photo-1666021.jpeg?auto=compress&cs=tinysrgb&w=800&h=450&fit=crop');
    }
  };

  const loadBookingStatus = async () => {
    if (!id) return;
    
    try {
      const bookings = await getActiveBillboardBookings(id);
      if (bookings.length > 0) {
        const latestBooking = bookings[0];
        setBookingStatus({
          isBooked: true,
          bookedUntil: new Date(latestBooking.end_date).toLocaleDateString(),
          nextAvailable: new Date(new Date(latestBooking.end_date).getTime() + 24 * 60 * 60 * 1000).toLocaleDateString(),
          currentBooking: latestBooking
        });
      } else {
        setBookingStatus({ isBooked: false });
      }
    } catch (error) {
      console.error('Error loading booking status:', error);
      setBookingStatus({ isBooked: false });
    }
  };

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const handleBookNow = () => {
    window.scrollTo(0, 0);
    navigate(`/book/${billboard.id}`);
  };

  const handleAddToCart = async (side: 'A' | 'B' | 'BOTH' | 'SINGLE') => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!startDate || !endDate) {
      setMessage('Please select booking dates');
      return;
    }

    try {
      setAddingToCart(true);
      setMessage('');
      
      // Get billboard side information for pricing
      const selectedSide = billboardSides.find(s => s.side_identifier === side) || billboardSides[0];
      const pricePerDay = selectedSide?.price_per_day || billboard.pricePerDay;
      
      await CartService.addToCart(
        user.id,
        billboard.id,
        side,
        startDate,
        endDate,
        '', // ad content
        'static', // ad type
        pricePerDay
      );
      
      setMessage('Billboard added to cart successfully!');
      
      // Refresh cart count in navbar
      window.dispatchEvent(new CustomEvent('cartUpdated'));
    } catch (error: any) {
      setMessage('Failed to add to cart: ' + error.message);
    } finally {
      setAddingToCart(false);
    }
  };

  // Mock billboards data
  const similarBillboards = mockBillboards.slice(0, 3).map(b => ({
    id: b.id,
    title: b.title,
    location: `${b.city}, ${b.state}`,
    pricePerDay: b.price_per_day,
    imageUrl: b.imageUrl
  }));

  if (!billboard) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Billboard Not Found</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">The billboard you're looking for doesn't exist or has been removed.</p>
        <Link 
          to="/explore" 
          className="inline-flex items-center text-blue-900 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Explore
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link 
        to="/explore" 
        className="inline-flex items-center text-blue-900 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-6"
        onClick={() => window.scrollTo(0, 0)}
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to Explore
      </Link>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gallery */}
        <div className="lg:col-span-2">
          <div className="aspect-[16/9] w-full mb-4 overflow-hidden rounded-lg">
            <img 
              src={activeImage} 
              alt={billboard.title} 
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            {[billboard.imageUrl, ...billboard.additionalImages || []].map((img, index) => (
              <div 
                key={index} 
                className={`aspect-[4/3] overflow-hidden rounded-md cursor-pointer border-2 ${
                  activeImage === img ? 'border-blue-900 dark:border-blue-400' : 'border-transparent'
                }`}
                onClick={() => setActiveImage(img)}
              >
                <img src={img} alt={`View ${index + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
        
        {/* Booking Sidebar */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-fit">
          {message && (
            <div className={`mb-4 p-3 rounded-lg border ${
              message.includes('successfully') 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
            }`}>
              {message}
            </div>
          )}

          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{billboard.title}</h1>
            <button 
              onClick={() => setIsWishlist(!isWishlist)}
              className="text-gray-400 hover:text-red-500"
              aria-label="Add to wishlist"
            >
              <Heart className={`h-6 w-6 ${isWishlist ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
          </div>
          
          <div className="flex items-center text-gray-600 dark:text-gray-300 mb-6">
            <MapPin className="h-5 w-5 mr-2 text-blue-900 dark:text-blue-400" />
            <span>{billboard.location}</span>
          </div>
          
          <div className="flex items-center mb-6">
            <IndianRupee className="h-6 w-6 text-blue-900 dark:text-blue-400" />
            <span className="text-3xl font-bold text-blue-900 dark:text-blue-400">{billboard.pricePerDay.toLocaleString()}</span>
            <span className="text-gray-600 dark:text-gray-300 ml-1">/day</span>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="h-5 w-5 mr-2 text-blue-900 dark:text-blue-400" />
              <span>Minimum booking: {billboard.minDays} days</span>
            </div>
            <div className="flex items-center text-gray-700 dark:text-gray-300 mb-2">
              <Users className="h-5 w-5 mr-2 text-blue-900 dark:text-blue-400" />
              <span>Owned by: {billboard.owner}</span>
            </div>
            <div className="flex items-center text-gray-700 dark:text-gray-300 mb-2">
              <Eye className="h-5 w-5 mr-2 text-blue-900 dark:text-blue-400" />
              <span>{billboard.impressions.toLocaleString()}+ daily impressions</span>
            </div>
          </div>
          
          {/* Date Selection */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Select Dates</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={formatDate(new Date())}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Availability</h3>
            {bookingStatus?.isBooked ? (
              <div>
                <div className="flex items-center text-red-600 dark:text-red-400 mb-4">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  <span>Currently Booked</span>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                    <div>
                      <p className="text-red-800 dark:text-red-200 font-medium">
                        Booked until {bookingStatus.bookedUntil}
                      </p>
                      <p className="text-red-700 dark:text-red-300 text-sm">
                        Available from {bookingStatus.nextAvailable}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center text-green-600 dark:text-green-400 mb-4">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span>Available for booking</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This billboard is currently available for booking. Reserve your dates now before someone else does!
                </p>
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => handleAddToCart('SINGLE')}
              disabled={addingToCart || !startDate || !endDate || bookingStatus?.isBooked}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-md font-semibold transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addingToCart ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <ShoppingCart className="h-4 w-4 mr-2" />
              )}
              {bookingStatus?.isBooked ? 'Currently Booked' : 'Add to Cart'}
            </button>
            
            <button
              onClick={handleBookNow}
              disabled={bookingStatus?.isBooked}
              className="w-full bg-blue-900 dark:bg-blue-700 text-white py-3 px-6 rounded-md font-semibold text-center block hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {bookingStatus?.isBooked ? `Available from ${bookingStatus.nextAvailable}` : 'Book Now'}
            </button>
          </div>
          
          <button 
            className="w-full bg-white dark:bg-gray-700 border border-blue-900 dark:border-blue-400 text-blue-900 dark:text-blue-400 py-3 px-6 rounded-md font-semibold text-center hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-center"
          >
            <Share2 className="h-5 w-5 mr-2" />
            Share This Billboard
          </button>
        </div>
      </div>
      
      {/* Two-Sided Billboard Selector (if applicable) */}
      {startDate && endDate && (
        <div className="mt-12">
          <TwoSidedBillboardSelector
            billboardId={billboard.id}
            sides={billboardSides}
            startDate={startDate}
            endDate={endDate}
            onSideSelect={setSelectedSide}
            onAddToCart={handleAddToCart}
            selectedSide={selectedSide}
          />
        </div>
      )}

      {/* Details section */}
      <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Billboard Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Specifications</h3>
                <ul className="space-y-2">
                  <li className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Type:</span>
                    <span className="font-medium text-gray-900 dark:text-white capitalize">{billboard.type}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Size:</span>
                    <span className="font-medium text-gray-900 dark:text-white capitalize">{billboard.size}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Dimensions:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{billboard.dimensions}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Facing:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{billboard.facing}</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Features</h3>
                <ul className="space-y-2">
                  {billboard.features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Description</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">{billboard.description}</p>
            <p className="text-gray-700 dark:text-gray-300">{billboard.additionalInfo}</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Location</h2>
            <div className="h-80 w-full bg-gray-100 dark:bg-gray-700 rounded-lg mb-4">
              {/* This would be a map component in production */}
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-10 w-10 text-blue-900 dark:text-blue-400 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">{billboard.location}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">(Map would be displayed here)</p>
                </div>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300">
              This premium billboard is strategically located in a high-traffic area with excellent visibility. The location offers exceptional exposure to both vehicular and pedestrian traffic.
            </p>
          </div>
        </div>
        
        <div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Owner Information</h2>
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-600 mr-4 overflow-hidden">
                <img src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" alt="Owner" className="h-full w-full object-cover" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{billboard.owner}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Member since 2020</p>
              </div>
            </div>
            <button className="w-full bg-white dark:bg-gray-700 border border-blue-900 dark:border-blue-400 text-blue-900 dark:text-blue-400 py-2 px-4 rounded-md font-medium text-center hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors">
              Contact Owner
            </button>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Similar Billboards</h2>
            <div className="space-y-4">
              {similarBillboards
                .filter(b => b.id !== billboard.id && b.location.includes(billboard.location.split(',')[0]))
                .slice(0, 3)
                .map(b => (
                  <Link 
                    key={b.id} 
                    to={`/billboard/${b.id}`} 
                    className="flex items-start hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-md -m-2"
                    onClick={() => window.scrollTo(0, 0)}
                  >
                    <div className="h-16 w-24 overflow-hidden rounded-md flex-shrink-0">
                      <img src={b.imageUrl} alt={b.title} className="h-full w-full object-cover" />
                    </div>
                    <div className="ml-3">
                      <h3 className="font-medium text-gray-900 dark:text-white text-sm">{b.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-xs">{b.location}</p>
                      <div className="flex items-center text-blue-900 dark:text-blue-400 font-semibold text-sm mt-1">
                        <IndianRupee className="h-3 w-3 mr-1" />
                        <span>{b.pricePerDay.toLocaleString()}/day</span>
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillboardDetails;