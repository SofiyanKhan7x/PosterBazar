import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Eye, Calendar, ArrowRight, IndianRupee, Clock, AlertTriangle } from 'lucide-react';
import { Billboard } from '../services/supabase';

interface BillboardCardProps {
  billboard: Billboard;
  bookingStatus?: {
    isBooked: boolean;
    bookedUntil?: string;
    nextAvailable?: string;
  };
}

const BillboardCard: React.FC<BillboardCardProps> = ({ billboard, bookingStatus }) => {
  const handleClick = () => {
    window.scrollTo(0, 0);
  };

  // Handle different data structures - Supabase vs mock data
  const pricePerDay = billboard.price_per_day || (billboard as any).pricePerDay || 0;
  const dailyViews = billboard.daily_views || (billboard as any).impressions || 0;
  const locationAddress = billboard.location_address || (billboard as any).location || '';
  const minDays = billboard.min_days || (billboard as any).minDays || 1;

  // Find main image
  const mainImage = billboard.billboard_images?.find(img => img.image_type === 'main');
  const imageUrl = mainImage?.image_url || 
                  (billboard.billboard_images && billboard.billboard_images.length > 0 
                    ? billboard.billboard_images[0].image_url 
                    : (billboard as any).imageUrl || 'https://images.pexels.com/photos/1036657/pexels-photo-1036657.jpeg');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 h-full flex flex-col">
      <div className="relative h-56 w-full overflow-hidden">
        <img 
          src={imageUrl} 
          alt={billboard.title} 
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
        />
        {billboard.featured && (
          <div className="absolute top-4 right-4 bg-yellow-400 text-blue-900 px-3 py-1 rounded-full text-xs font-bold">
            Featured
          </div>
        )}
          {bookingStatus?.isBooked && (
            <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              Booked
            </div>
          )}
      </div>
      
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 min-h-[3.5rem]">{billboard.title}</h3>
        <div className="flex items-center text-gray-600 dark:text-gray-300 mb-3">
          <MapPin className="h-4 w-4 mr-1" />
          <span className="text-sm truncate">{locationAddress}</span>
        </div>
        
        <div className="flex justify-between mb-4 text-xs text-gray-600 dark:text-gray-300">
          <div className="flex items-center">
            <Eye className="h-4 w-4 mr-1" />
            <span>{dailyViews.toLocaleString()}+ daily views</span>
          </div>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            <span>Min {minDays} days</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-auto">
          <div>
            <span className="block text-gray-600 dark:text-gray-300 text-sm">Starting from</span>
            <div className="flex items-center">
              <IndianRupee className="h-4 w-4 text-blue-900 dark:text-blue-400" />
              <span className="text-xl font-bold text-blue-900 dark:text-blue-400">{pricePerDay.toLocaleString()}</span>
              <span className="text-gray-600 dark:text-gray-300 text-sm">/day</span>
            </div>
          </div>
          
          {bookingStatus?.isBooked && (
            <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center text-red-800 dark:text-red-200">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <div>
                  <p className="text-xs font-medium">Booked until {bookingStatus.bookedUntil}</p>
                  {bookingStatus.nextAvailable && (
                    <p className="text-xs">Available from {bookingStatus.nextAvailable}</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <Link 
            to={`/billboard/${billboard.id}`} 
            onClick={handleClick}
            className={`flex items-center font-medium transition-colors text-sm ${
              bookingStatus?.isBooked 
                ? 'text-gray-500 dark:text-gray-400' 
                : 'text-blue-900 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300'
            }`}
          >
            {bookingStatus?.isBooked ? 'View Details' : 'Book Now'}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BillboardCard;