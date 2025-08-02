import React from "react";
import { Link } from "react-router-dom";

const AnimatedHero = () => {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-black overflow-hidden">
      {/* Bohr Atomic Model - positioned above text */}
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-[400px] h-[400px] md:w-[500px] md:h-[500px]">
        {/* Nucleus */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-[0_0_30px_rgba(255,165,0,0.8)] animate-pulse" />
        
        {/* Electron Orbitals */}
        <div className="absolute inset-0 orbital orbital-1">
          <div className="electron electron-1"></div>
        </div>
        <div className="absolute inset-[15%] orbital orbital-2">
          <div className="electron electron-2"></div>
        </div>
        <div className="absolute inset-[30%] orbital orbital-3">
          <div className="electron electron-3"></div>
          <div className="electron electron-4"></div>
        </div>
      </div>

      {/* Text Content - positioned below atomic model */}
      <div className="relative mt-[200px] md:mt-[250px] text-center px-4 z-10">
        <h1 className="text-5xl font-bold mb-4 leading-tight">
          <span className="multicolor-text">Sahadhyayi</span>
        </h1>
        <p className="text-xl text-white font-medium mb-4">The Book Social Media</p>
        <p className="text-base text-gray-300 mb-8 leading-relaxed">
          Find new books, connect with other readers, and share your love of reading—all in one friendly community.
        </p>
        <Link to="/library" className="inline-block">
          <button className="px-10 py-4 rounded-full text-base font-semibold bg-white text-black hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-xl">
            📚 Start your Reading Journey
          </button>
        </Link>
      </div>

      <style>{`
        /* Orbital styles */
        .orbital {
          border: 2px solid rgba(29, 227, 247, 0.3);
          border-radius: 50%;
          position: relative;
        }
        
        .orbital-1 {
          animation: rotate 8s linear infinite;
        }
        
        .orbital-2 {
          animation: rotate 6s linear infinite reverse;
        }
        
        .orbital-3 {
          animation: rotate 4s linear infinite;
        }
        
        /* Electron styles */
        .electron {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          position: absolute;
          top: -4px;
          left: 50%;
          transform: translateX(-50%);
        }
        
        .electron-1 {
          background: #1de3f7;
          box-shadow: 0 0 10px #1de3f7;
        }
        
        .electron-2 {
          background: #04ff95;
          box-shadow: 0 0 10px #04ff95;
        }
        
        .electron-3 {
          background: #ff4fd8;
          box-shadow: 0 0 10px #ff4fd8;
          left: 25%;
        }
        
        .electron-4 {
          background: #ff6b35;
          box-shadow: 0 0 10px #ff6b35;
          left: 75%;
        }
        
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .multicolor-text {
          font-size: 4rem;
          font-weight: 900;
          background: linear-gradient(90deg, #ff4fd8, #1de3f7, #5d5fef, #04ff95, #ff6b35, #f72585, #4cc9f0, #7209b7, #560bad, #480ca8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        @media (max-width: 768px) {
          .multicolor-text { 
            font-size: 2.5rem; 
          }
          .electron {
            width: 6px;
            height: 6px;
          }
        }
      `}</style>
    </div>
  );
};

export default AnimatedHero;