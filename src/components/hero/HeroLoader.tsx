
import React from 'react';

const HeroLoader: React.FC = () => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="relative">
        {/* Animated spinner with proper keyframes */}
        <div className="w-16 h-16 border-4 border-gray-600 border-t-white rounded-full animate-spin"></div>
        
        {/* Pulsing center dot */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full animate-pulse"></div>
        
        {/* Loading text with fade animation */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 text-white text-sm font-medium animate-pulse">
          Loading...
        </div>
      </div>
    </div>
  );
};

export default HeroLoader;
