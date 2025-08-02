import React from "react";
import { Link } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { Player } from '@lottiefiles/react-lottie-player';

const AnimatedHero = () => {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-black overflow-hidden">
      {/* Lottie Animation Container */}
      <div className="relative w-[400px] h-[400px] md:w-[500px] md:h-[500px] mx-auto">
        {/* Lottie Player */}
        <Player
          autoplay
          loop
          src="https://lottie.host/4f3b2bba-cad8-4e24-9b32-4c4b8b8d7e7f/9Q7zZDVCNp.json"
          style={{ width: '100%', height: '100%' }}
          background="transparent"
        />
        
        {/* Center Text Overlay */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-10">
          <h1 className="text-2xl md:text-4xl font-bold mb-2 leading-tight">
            <span className="gradient-text">Sahadhyayi</span>
          </h1>
          <p className="text-sm md:text-lg text-cyan-300 font-medium">
            The Book Social Media
          </p>
        </div>
        
        {/* Orbiting Section Names */}
        <div className="orbit-text" style={{ '--angle': '0deg' } as React.CSSProperties}>
          Library
        </div>
        <div className="orbit-text" style={{ '--angle': '120deg' } as React.CSSProperties}>
          Authors
        </div>
        <div className="orbit-text" style={{ '--angle': '240deg' } as React.CSSProperties}>
          Community
        </div>
      </div>
      
      {/* Description and Button */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-2xl mt-8">
        <p className="text-sm md:text-base text-pink-300 max-w-lg mb-6 leading-relaxed">
          Find new books, connect with other readers, and share your love of reading—all in one friendly community.
        </p>
        <Link to="/signup" className="inline-block">
          <button className="px-6 py-3 rounded-full text-sm font-semibold bg-white text-black hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Explore the Library
          </button>
        </Link>
      </div>
      
      <style>{`
        .gradient-text {
          background: linear-gradient(135deg, #ff4fd8 0%, #1de3f7 50%, #5d5fef 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-fill-color: transparent;
          animation: gradient-shift 3s ease-in-out infinite alternate;
        }
        
        @keyframes gradient-shift {
          0% {
            background: linear-gradient(135deg, #ff4fd8 0%, #1de3f7 50%, #5d5fef 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          100% {
            background: linear-gradient(135deg, #5d5fef 0%, #04ff95 50%, #ff4fd8 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
        }
        
        .orbit-text {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: rotate(var(--angle)) translate(180px) rotate(calc(-1 * var(--angle)));
          color: #1de3f7;
          font-size: 1rem;
          font-weight: 600;
          animation: orbit 12s linear infinite;
          text-shadow: 0 0 10px rgba(29, 227, 247, 0.5);
          pointer-events: none;
        }
        
        @keyframes orbit {
          0% {
            transform: rotate(var(--angle)) translate(180px) rotate(calc(-1 * var(--angle)));
          }
          100% {
            transform: rotate(calc(var(--angle) + 360deg)) translate(180px) rotate(calc(-1 * (var(--angle) + 360deg)));
          }
        }
        
        @media (max-width: 768px) {
          .orbit-text {
            transform: rotate(var(--angle)) translate(140px) rotate(calc(-1 * var(--angle)));
            font-size: 0.875rem;
          }
          
          @keyframes orbit {
            0% {
              transform: rotate(var(--angle)) translate(140px) rotate(calc(-1 * var(--angle)));
            }
            100% {
              transform: rotate(calc(var(--angle) + 360deg)) translate(140px) rotate(calc(-1 * (var(--angle) + 360deg)));
            }
          }
        }
        
        @media (max-width: 480px) {
          .orbit-text {
            transform: rotate(var(--angle)) translate(110px) rotate(calc(-1 * var(--angle)));
            font-size: 0.75rem;
          }
          
          @keyframes orbit {
            0% {
              transform: rotate(var(--angle)) translate(110px) rotate(calc(-1 * var(--angle)));
            }
            100% {
              transform: rotate(calc(var(--angle) + 360deg)) translate(110px) rotate(calc(-1 * (var(--angle) + 360deg)));
            }
          }
        }
      `}</style>
    </div>
  );
};

export default AnimatedHero;