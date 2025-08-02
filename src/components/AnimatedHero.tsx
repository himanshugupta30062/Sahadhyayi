import React from "react";
import { Link } from "react-router-dom";
import { UserPlus } from "lucide-react";

const AnimatedHero = () => {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-black overflow-hidden">
      {/* Animated Concentric Rings */}
      <div className="absolute">
        <div className="rings-container">
          <div className="ring ring-1" />
          <div className="ring ring-2" />
          <div className="ring ring-3" />
        </div>
      </div>
      
      {/* Centered Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-2xl">
        <h1 className="text-2xl md:text-4xl font-bold mb-3 leading-tight">
          <span className="gradient-text">Sahadhyayi:</span><br/>
          <span className="text-cyan-300">The Book Social Media</span>
        </h1>
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
        .rings-container {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 600px;
          height: 600px;
        }
        
        .ring {
          position: absolute;
          border-radius: 50%;
          border: 6px solid transparent;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          z-index: 1;
        }
        
        .ring-1 {
          width: 400px;
          height: 400px;
          background: conic-gradient(
            from 0deg,
            #ff4fd8 0%,
            #ff4fd8 25%,
            transparent 25%,
            transparent 75%,
            #ff4fd8 75%,
            #ff4fd8 100%
          );
          animation: spin-ring-1 8s linear infinite;
        }
        
        .ring-2 {
          width: 480px;
          height: 480px;
          background: conic-gradient(
            from 120deg,
            #1de3f7 0%,
            #1de3f7 30%,
            transparent 30%,
            transparent 60%,
            #04ff95 60%,
            #04ff95 90%,
            transparent 90%,
            transparent 100%
          );
          animation: spin-ring-2 12s linear infinite reverse;
        }
        
        .ring-3 {
          width: 560px;
          height: 560px;
          background: conic-gradient(
            from 240deg,
            #5d5fef 0%,
            #5d5fef 20%,
            transparent 20%,
            transparent 40%,
            #ff4fd8 40%,
            #ff4fd8 60%,
            transparent 60%,
            transparent 80%,
            #1de3f7 80%,
            #1de3f7 100%
          );
          animation: spin-ring-3 16s linear infinite;
        }
        
        @keyframes spin-ring-1 {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        
        @keyframes spin-ring-2 {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        
        @keyframes spin-ring-3 {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        
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
        
        @media (max-width: 768px) {
          .rings-container {
            width: 450px;
            height: 450px;
          }
          .ring-1 {
            width: 300px;
            height: 300px;
          }
          .ring-2 {
            width: 360px;
            height: 360px;
          }
          .ring-3 {
            width: 420px;
            height: 420px;
          }
        }
        
        @media (max-width: 480px) {
          .rings-container {
            width: 350px;
            height: 350px;
          }
          .ring-1 {
            width: 240px;
            height: 240px;
          }
          .ring-2 {
            width: 280px;
            height: 280px;
          }
          .ring-3 {
            width: 320px;
            height: 320px;
          }
        }
      `}</style>
    </div>
  );
};

export default AnimatedHero;