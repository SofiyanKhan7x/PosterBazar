import React, { useState, useEffect } from 'react';
import { getFeaturedBillboards, supabase, getActiveBillboardBookings } from '../services/supabase';
import { Billboard } from '../services/supabase';
import BillboardCard from './BillboardCard';
import { billboards as mockBillboards } from '../data/mockData';

const FeaturedBillboards: React.FC = () => {
  const [featuredBillboards, setFeaturedBillboards] = useState<Billboard[]>([]);
  const [bookingStatuses, setBookingStatuses] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    loadFeaturedBillboards();
  }, []);

  const loadFeaturedBillboards = async () => {
    try {
      setLoading(true);
      setError(null);
      setUsingFallback(false);
      
      if (supabase) {
        try {
          const billboards = await getFeaturedBillboards(6);
          
          if (billboards && billboards.length > 0) {
            setFeaturedBillboards(billboards);
            
            // Load booking statuses for each billboard
            const bookingStatusMap = new Map();
            for (const billboard of billboards) {
              try {
                const bookings = await getActiveBillboardBookings(billboard.id);
                if (bookings.length > 0) {
                  const latestBooking = bookings[0];
                  bookingStatusMap.set(billboard.id, {
                    isBooked: true,
                    bookedUntil: new Date(latestBooking.end_date).toLocaleDateString(),
                    nextAvailable: new Date(new Date(latestBooking.end_date).getTime() + 24 * 60 * 60 * 1000).toLocaleDateString()
                  });
                } else {
                  bookingStatusMap.set(billboard.id, {
                    isBooked: false
                  });
                }
              } catch (bookingError) {
                console.warn(`Failed to load booking status for billboard ${billboard.id}:`, bookingError);
                bookingStatusMap.set(billboard.id, { isBooked: false });
              }
            }
            setBookingStatuses(bookingStatusMap);
          } else {
            // No billboards found - use fallback data
            console.warn('No featured billboards found, using fallback data');
            setFeaturedBillboards(mockBillboards.filter(b => b.featured).slice(0, 6) as unknown as Billboard[]);
            setUsingFallback(true);
          }
        } catch (supabaseError) {
          console.warn('Supabase error, using fallback data:', supabaseError);
          setFeaturedBillboards(mockBillboards.filter(b => b.featured).slice(0, 6) as unknown as Billboard[]);
          setUsingFallback(true);
        }
      } else {
        console.warn('Supabase not available, using fallback data');
        setFeaturedBillboards(mockBillboards.filter(b => b.featured).slice(0, 6) as unknown as Billboard[]);
        setUsingFallback(true);
      }
    } catch (err) {
      console.error('Failed to load featured billboards:', err);
      setFeaturedBillboards(mockBillboards.filter(b => b.featured).slice(0, 6) as unknown as Billboard[]);
      setUsingFallback(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md animate-pulse">
            <div className="h-48 w-full bg-gray-300 dark:bg-gray-700"></div>
            <div className="p-6 space-y-4">
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
              <div className="flex justify-between">
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/3"></div>
              </div>
              <div className="flex justify-between items-center">
                <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error && featuredBillboards.length === 0) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
        <p className="text-red-800 dark:text-red-200">{error}</p>
        <button 
          onClick={loadFeaturedBillboards}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {featuredBillboards.map((billboard) => (
          <BillboardCard 
            key={billboard.id} 
            billboard={billboard} 
            bookingStatus={bookingStatuses.get(billboard.id)}
          />
        ))}
      </div>
      
      {usingFallback && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing demo billboards - Connect to database to see real listings
          </p>
        </div>
      )}
    </div>
  );
};

export default FeaturedBillboards;