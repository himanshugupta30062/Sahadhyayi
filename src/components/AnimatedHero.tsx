import React from "react";
import { Link } from "react-router-dom";

const AnimatedHero = () => {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-black overflow-hidden">
      {/* Main Container */}
      <div className="relative w-[800px] h-[800px] mx-auto flex items-center justify-center">
        
        {/* Outer Ring - Pink/Magenta */}
        <div className="absolute w-[750px] h-[750px] rounded-full">
          <div className="quantel-ring ring-outer"></div>
        </div>
        
        {/* Middle Ring - Blue */}
        <div className="absolute w-[600px] h-[600px] rounded-full">
          <div className="quantel-ring ring-middle"></div>
        </div>
        
        {/* Inner Ring - Cyan/Teal */}
        <div className="absolute w-[480px] h-[480px] rounded-full">
          <div className="quantel-ring ring-inner"></div>
        </div>
        
        {/* Center Content */}
        <div className="relative z-10 text-center max-w-[350px] px-6">
          <h1 className="text-5xl font-bold mb-4">
            <span className="text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text">
              Sahadhyayi
            </span>
          </h1>
          <h2 className="text-3xl font-bold text-white mb-6">
            The Book Readers Social Media
          </h2>
          <p className="text-gray-300 text-lg mb-8 leading-relaxed">
            Find new books, connect with other readers, and share your love of reading—all in one friendly community.
          </p>
          <Link to="/library">
            <button className="px-8 py-3 bg-white text-black rounded-full font-semibold hover:bg-gray-100 transition-all duration-300">
              Start your Reading Journey
            </button>
          </Link>
        </div>
      </div>
      
      <style>{`
        /* Clean Quantel-style rings */
        .quantel-ring {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 12px solid;
          border-color: var(--ring-color);
          border-image: var(--ring-gradient) 1;
          background: transparent;
          animation: var(--ring-animation);
          box-sizing: border-box;
        }

        .ring-outer {
          --ring-color: #22c55e;
          --ring-gradient: linear-gradient(90deg, #22c55e 50%, transparent 50%);
          --ring-animation: rotate-clockwise 20s linear infinite;
          border-image: conic-gradient(from 0deg, #22c55e 50%, transparent 50%) 1;
        }
        
        .ring-middle {
          --ring-color: #3b82f6;
          --ring-gradient: linear-gradient(90deg, #3b82f6 50%, transparent 50%);
          --ring-animation: rotate-counter-clockwise 15s linear infinite;
          border-image: conic-gradient(from 0deg, #3b82f6 50%, transparent 50%) 1;
        }
        
        .ring-inner {
          --ring-color: #ef4444;
          --ring-gradient: linear-gradient(90deg, #ef4444 50%, transparent 50%);
          --ring-animation: rotate-clockwise 10s linear infinite;
          border-image: conic-gradient(from 0deg, #ef4444 50%, transparent 50%) 1;
        }

        @keyframes rotate-clockwise {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes rotate-counter-clockwise {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        
        @media (max-width: 768px) {
          .quantel-ring {
            border-width: 4px;
          }
        }
      `}</style>
    </div>
  );
};

export default AnimatedHero;