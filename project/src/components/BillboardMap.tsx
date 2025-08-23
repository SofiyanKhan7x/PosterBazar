import React from 'react';
import { Billboard } from '../types/billboard';

interface BillboardMapProps {
  billboards: Billboard[];
}

const BillboardMap: React.FC<BillboardMapProps> = ({ billboards }) => {
  return (
    <div className="relative w-full h-[600px] bg-gray-100 rounded-lg overflow-hidden">
      {/* This is a placeholder for an actual map integration */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-xl font-medium text-gray-900 mb-2">Map View</h3>
          <p className="text-gray-600 mb-4">
            In a production environment, this would display a map with {billboards.length} billboard locations.
          </p>
          <p className="text-sm text-gray-500">
            Powered by Google Maps, Mapbox, or another mapping service.
          </p>
        </div>
      </div>

      {/* Map marker representations */}
      <div className="absolute inset-0 pointer-events-none">
        {billboards.map((billboard, index) => {
          // Calculate pseudo-random positions for demonstration
          const left = ((billboard.id.charCodeAt(0) * 13) % 80) + 10;
          const top = ((billboard.id.charCodeAt(1) * 7) % 80) + 10;
          
          return (
            <div 
              key={billboard.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 animate-bounce-slow"
              style={{ 
                left: `${left}%`, 
                top: `${top}%`,
                animationDelay: `${index * 0.1}s`
              }}
            >
              <div className="bg-blue-900 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                {index + 1}
              </div>
              <div className="absolute w-0 h-0 border-l-[8px] border-r-[8px] border-t-[10px] border-l-transparent border-r-transparent border-t-blue-900 left-1/2 -ml-[8px] -mt-1"></div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BillboardMap;