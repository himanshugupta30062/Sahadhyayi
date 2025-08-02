import React from "react";
import { Link } from "react-router-dom";

const AnimatedHero = () => {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-black overflow-hidden">
      {/* Colorful Rotating Rings */}
      <div className="relative w-[500px] h-[500px] mx-auto">
        {/* Outer Ring */}
        <div className="absolute inset-0 rounded-full ring-outer"></div>
        
        {/* Middle Ring */}
        <div className="absolute inset-[40px] rounded-full ring-middle"></div>
        
        {/* Inner Ring */}
        <div className="absolute inset-[80px] rounded-full ring-inner"></div>
        
        {/* Center Content */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center w-[300px]">
          <h1 className="text-4xl font-bold mb-3 leading-tight">
            <span className="gradient-text">Sahadhyayi</span>
          </h1>
          <p className="text-lg text-white font-medium mb-4">
            The Book Social Media
          </p>
          <p className="text-sm text-gray-300 mb-6 leading-relaxed">
            Find new books, connect with other readers, and share your love of reading—all in one friendly community.
          </p>
          <Link to="/library" className="inline-block">
            <button className="px-8 py-3 rounded-full text-sm font-semibold bg-white text-black hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg">
              📚 Explore the Library
            </button>
          </Link>
        </div>
      </div>
      
      <style>{`
        .gradient-text {
          background: linear-gradient(135deg, #ff4fd8 0%, #1de3f7 50%, #5d5fef 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
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
        
        .ring-outer {
          border: 4px solid transparent;
          background: linear-gradient(45deg, #ff4fd8, #1de3f7, #5d5fef, #04ff95) border-box;
          -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: rotate-clockwise 8s linear infinite;
        }
        
        .ring-middle {
          border: 4px solid transparent;
          background: linear-gradient(-45deg, #04ff95, #5d5fef, #1de3f7, #ff4fd8) border-box;
          -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: rotate-counter-clockwise 6s linear infinite;
        }
        
        .ring-inner {
          border: 4px solid transparent;
          background: linear-gradient(90deg, #1de3f7, #ff4fd8, #04ff95, #5d5fef) border-box;
          -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: rotate-clockwise 4s linear infinite;
        }
        
        @keyframes rotate-clockwise {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        
        @keyframes rotate-counter-clockwise {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(-360deg);
          }
        }
        
        @media (max-width: 768px) {
          .ring-outer,
          .ring-middle,
          .ring-inner {
            border-width: 3px;
          }
        }
      `}</style>
    </div>
  );
};

export default AnimatedHero;