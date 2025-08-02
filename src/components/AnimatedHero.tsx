import React from "react";
import { Link } from "react-router-dom";
import { Player } from '@lottiefiles/react-lottie-player';

const AnimatedHero = () => {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-black overflow-hidden">
      {/* Lottie Animation Container */}
      <div className="relative w-[480px] h-[480px] mx-auto mt-[60px]">
        {/* Lottie Player */}
        <Player
          autoplay
          loop
          src="https://assets4.lottiefiles.com/packages/lf20_H2m6Y0wqCO.json"
          style={{ width: '100%', height: '100%' }}
          background="transparent"
        />
        
        {/* Center Text Overlay */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[85%] text-center pointer-events-none">
          <h1 className="text-[2.7rem] font-black leading-none mb-2" style={{
            background: 'linear-gradient(90deg, #e100ff, #00ffe7, #2e91fc)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-1px'
          }}>
            Sahadhyayi
          </h1>
          <p className="text-[1.2rem] font-bold mb-4" style={{ color: '#bffcff' }}>
            The Book Social Media
          </p>
          <p className="text-base mb-8" style={{ color: '#ffcfff' }}>
            Find new books, connect with other readers, and share your love of reading—all in one friendly community.
          </p>
          <Link to="/library" className="inline-block pointer-events-auto">
            <button className="px-9 py-3 rounded-[32px] text-[1.2rem] font-bold bg-white text-[#1a1a1a] hover:bg-gray-100 transition-all duration-300 transform hover:scale-105" style={{
              boxShadow: '0 3px 24px rgba(0, 0, 0, 0.2)'
            }}>
              <span className="mr-2">📚</span>
              Explore the Library
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AnimatedHero;