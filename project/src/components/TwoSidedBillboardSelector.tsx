import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, AlertTriangle, IndianRupee, 
  Info, ArrowRight
} from 'lucide-react';
import { BillboardSide, BillboardAvailability } from '../types/billboard';
import { CartService } from '../services/cartService';

interface TwoSidedBillboardSelectorProps {
  billboardId: string;
  sides: BillboardSide[];
  startDate: string;
  endDate: string;
  onSideSelect: (side: 'A' | 'B' | 'BOTH' | 'SINGLE') => void;
  onAddToCart: (side: 'A' | 'B' | 'BOTH' | 'SINGLE') => void;
  selectedSide?: 'A' | 'B' | 'BOTH' | 'SINGLE';
}

const TwoSidedBillboardSelector: React.FC<TwoSidedBillboardSelectorProps> = ({
  billboardId,
  sides,
  startDate,
  endDate,
  onSideSelect,
  onAddToCart,
  selectedSide
}) => {
  const [availability, setAvailability] = useState<BillboardAvailability | null>(null);
  const [loading, setLoading] = useState(false);
  const [totalDays, setTotalDays] = useState(0);

  useEffect(() => {
    if (startDate && endDate) {
      const days = Math.ceil(
        (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      setTotalDays(days);
      
      if (days > 0) {
        checkAvailability();
      }
    }
  }, [billboardId, startDate, endDate]);

  const checkAvailability = async () => {
    try {
      setLoading(true);
      const availabilityData = await CartService.getBillboardDetailedAvailability(
        billboardId,
        startDate,
        endDate
      );
      setAvailability(availabilityData);
    } catch (error) {
      console.error('Error checking availability:', error);
      // Set default availability on error
      setAvailability({
        billboard_id: billboardId,
        available: true,
        side_a_available: true,
        side_b_available: true,
        single_side_available: true,
        availability_details: [
          { side: 'SINGLE', available: true },
          { side: 'A', available: true },
          { side: 'B', available: true }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = (side: 'A' | 'B' | 'BOTH' | 'SINGLE') => {
    if (!sides || sides.length === 0) return 0;

    switch (side) {
      case 'A':
        return (sides.find(s => s.side_identifier === 'A')?.price_per_day || 0) * totalDays;
      case 'B':
        return (sides.find(s => s.side_identifier === 'B')?.price_per_day || 0) * totalDays;
      case 'BOTH':
        const sideAPrice = sides.find(s => s.side_identifier === 'A')?.price_per_day || 0;
        const sideBPrice = sides.find(s => s.side_identifier === 'B')?.price_per_day || 0;
        return (sideAPrice + sideBPrice) * totalDays;
      case 'SINGLE':
        return (sides.find(s => s.side_identifier === 'SINGLE')?.price_per_day || 0) * totalDays;
      default:
        return 0;
    }
  };

  const getSideAvailability = (side: 'A' | 'B' | 'SINGLE') => {
    if (!availability) return { available: false, reason: 'Checking...' };
    
    const sideDetail = availability.availability_details.find((d: any) => d.side === side);
    return {
      available: sideDetail?.available || false,
      reason: sideDetail?.available ? 'Available' : 'Not available for selected dates'
    };
  };

  const isTwoSided = sides.some(s => s.side_identifier === 'A' || s.side_identifier === 'B');

  if (loading) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-blue-800 dark:text-blue-200">Checking availability...</span>
        </div>
      </div>
    );
  }

  if (!isTwoSided) {
    // Single-sided billboard
    const singleSide = sides.find(s => s.side_identifier === 'SINGLE');
    const sideAvailability = getSideAvailability('SINGLE');
    const price = calculatePrice('SINGLE');

    return (
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Single-Sided Billboard
        </h3>
        
        <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                {singleSide?.side_name || 'Main Display'}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {singleSide?.description || 'Single-sided billboard display'}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center text-blue-600 dark:text-blue-400 font-semibold">
                <IndianRupee className="h-4 w-4 mr-1" />
                <span>₹{price.toLocaleString()}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                ₹{singleSide?.price_per_day.toLocaleString()}/day × {totalDays} days
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {sideAvailability.available ? (
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              )}
              <span className={`text-sm font-medium ${
                sideAvailability.available 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {sideAvailability.reason}
              </span>
            </div>
            
            <button
              onClick={() => onAddToCart('SINGLE')}
              disabled={!sideAvailability.available}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Two-sided billboard
  const sideA = sides.find(s => s.side_identifier === 'A');
  const sideB = sides.find(s => s.side_identifier === 'B');
  const sideAAvailability = getSideAvailability('A');
  const sideBAvailability = getSideAvailability('B');
  const bothAvailable = sideAAvailability.available && sideBAvailability.available;

  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
      <div className="flex items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Two-Sided Billboard Options
        </h3>
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 ml-2" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Side A */}
        <div className={`border rounded-lg p-4 transition-all cursor-pointer ${
          selectedSide === 'A' 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600'
        }`} onClick={() => onSideSelect('A')}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                A
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {sideA?.side_name || 'Side A'}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {sideA?.description || 'Front-facing display'}
                </p>
              </div>
            </div>
            {selectedSide === 'A' && <CheckCircle className="h-5 w-5 text-blue-600" />}
          </div>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center text-blue-600 dark:text-blue-400 font-semibold">
              <IndianRupee className="h-4 w-4 mr-1" />
              <span>₹{calculatePrice('A').toLocaleString()}</span>
            </div>
            <div className="flex items-center">
              {sideAAvailability.available ? (
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-xs ${
                sideAAvailability.available 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {sideAAvailability.available ? 'Available' : 'Booked'}
              </span>
            </div>
          </div>

          <button
            onClick={() => onAddToCart('A')}
            disabled={!sideAAvailability.available}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Add Side A to Cart
          </button>
        </div>

        {/* Side B */}
        <div className={`border rounded-lg p-4 transition-all cursor-pointer ${
          selectedSide === 'B' 
            ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
            : 'border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-600'
        }`} onClick={() => onSideSelect('B')}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                B
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {sideB?.side_name || 'Side B'}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {sideB?.description || 'Back-facing display'}
                </p>
              </div>
            </div>
            {selectedSide === 'B' && <CheckCircle className="h-5 w-5 text-green-600" />}
          </div>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center text-green-600 dark:text-green-400 font-semibold">
              <IndianRupee className="h-4 w-4 mr-1" />
              <span>₹{calculatePrice('B').toLocaleString()}</span>
            </div>
            <div className="flex items-center">
              {sideBAvailability.available ? (
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-xs ${
                sideBAvailability.available 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {sideBAvailability.available ? 'Available' : 'Booked'}
              </span>
            </div>
          </div>

          <button
            onClick={() => onAddToCart('B')}
            disabled={!sideBAvailability.available}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Add Side B to Cart
          </button>
        </div>
      </div>

      {/* Both Sides Option */}
      {bothAvailable && (
        <div className={`border rounded-lg p-4 transition-all cursor-pointer ${
          selectedSide === 'BOTH' 
            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
            : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-600'
        }`} onClick={() => onSideSelect('BOTH')}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="flex space-x-1 mr-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded text-xs flex items-center justify-center font-bold">A</div>
                <ArrowRight className="h-4 w-4 text-gray-400" />
                <div className="w-6 h-6 bg-green-600 text-white rounded text-xs flex items-center justify-center font-bold">B</div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Both Sides</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">Maximum visibility package</p>
              </div>
            </div>
            {selectedSide === 'BOTH' && <CheckCircle className="h-5 w-5 text-purple-600" />}
          </div>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center text-purple-600 dark:text-purple-400 font-semibold">
              <IndianRupee className="h-4 w-4 mr-1" />
              <span>₹{calculatePrice('BOTH').toLocaleString()}</span>
              <span className="ml-2 text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 px-2 py-1 rounded-full">
                Save 10%
              </span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-xs text-green-600 dark:text-green-400">Both Available</span>
            </div>
          </div>

          <button
            onClick={() => onAddToCart('BOTH')}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md transition-colors text-sm"
          >
            Add Both Sides to Cart
          </button>
        </div>
      )}

      {/* Availability Summary */}
      <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Availability Summary</h4>
        <div className="space-y-2">
          {availability?.availability_details.map((detail: any) => (
            <div key={detail.side} className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {detail.side === 'SINGLE' ? 'Single Side' : `Side ${detail.side}`}:
              </span>
              <div className="flex items-center">
                {detail.available ? (
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={detail.available ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                  {detail.available ? 'Available' : 'Booked'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {!bothAvailable && (sideAAvailability.available || sideBAvailability.available) && (
          <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center">
              <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mr-2" />
              <span className="text-sm text-yellow-800 dark:text-yellow-200">
                Only {sideAAvailability.available ? 'Side A' : 'Side B'} is available for your selected dates.
              </span>
            </div>
          </div>
        )}

        {!sideAAvailability.available && !sideBAvailability.available && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mr-2" />
              <span className="text-sm text-red-800 dark:text-red-200">
                This billboard is fully booked for your selected dates.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TwoSidedBillboardSelector;