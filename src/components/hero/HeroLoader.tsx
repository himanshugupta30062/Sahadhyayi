import React from 'react';

const HeroLoader: React.FC = () => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="relative">
        {/* Animated rings */}
        <div className="absolute inset-0">
          <div className="animate-spin rounded-full h-32 w-32 border-4 border-transparent border-t-red-500/60 border-r-green-500/60"></div>
        </div>
        <div className="absolute inset-0">
          <div className="animate-spin rounded-full h-24 w-24 border-4 border-transparent border-t-blue-500/60 border-l-purple-500/60" style={{ animationDuration: '1.5s' }}></div>
        </div>
        <div className="absolute inset-0">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-cyan-500/60 border-b-pink-500/60" style={{ animationDuration: '1s' }}></div>
        </div>
        
        {/* Center content */}
        <div className="relative z-10 flex items-center justify-center h-32 w-32">
          <div className="text-center">
            <div className="text-white font-bold text-xl animate-pulse">LAS</div>
            <div className="text-white/60 text-xs mt-1">Loading...</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroLoader;