import React from 'react';

const HeroLoader: React.FC = () => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="relative">
        {/* Standard fixed spinner */}
        <div className="w-16 h-16 border-4 border-gray-600 border-t-white rounded-full animate-spin"></div>
        
        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full"></div>
        
        {/* Loading text */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 text-white text-sm font-medium">
          Loading...
        </div>
      </div>
    </div>
  );
};

export default HeroLoader;