import React from "react";
import { Link } from "react-router-dom";
import { UserPlus } from "lucide-react";

const AnimatedHero = () => {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-black overflow-hidden">
      {/* Animated Circles */}
      <div className="absolute">
        <div className="circle-base" />
        <div className="revolving-lines">
          <div className="line line-1" />
          <div className="line line-2" />
          <div className="line line-3" />
          <div className="line line-4" />
        </div>
      </div>
      
      {/* Centered Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-2xl">
        <h1 className="text-2xl md:text-4xl font-bold mb-3 leading-tight">
          <span className="gradient-text">Sahadhyayi:</span><br/>
          <span className="text-cyan-300">Your Fellow Reading Journey</span>
        </h1>
        <p className="text-sm md:text-base text-pink-300 max-w-lg mb-6 leading-relaxed">
          Connect, read, and grow with fellow readers worldwide.<br/>
          Join the digital reading community.
        </p>
        <Link to="/signup" className="inline-block">
          <button className="px-6 py-3 rounded-full text-sm font-semibold bg-white text-black hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Start Your Journey
          </button>
        </Link>
      </div>
      
      <style>{`
        .circle-base {
          width: 500px;
          height: 500px;
          border-radius: 50%;
          border: 8px solid transparent;
          background: conic-gradient(
            from 0deg,
            #ff4fd8 0%,
            #1de3f7 25%, 
            #04ff95 50%,
            #5d5fef 75%,
            #ff4fd8 100%
          );
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          z-index: 1;
          box-shadow: 
            0 0 80px 10px rgba(29, 227, 247, 0.2),
            0 0 150px 20px rgba(255, 79, 216, 0.1);
        }
        
        .revolving-lines {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 560px;
          height: 560px;
          animation: spin 10s linear infinite;
        }
        
        .line {
          position: absolute;
          width: 4px;
          height: 60px;
          border-radius: 2px;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          transform-origin: 50% 280px;
        }
        
        .line-1 {
          background: linear-gradient(180deg, #2a2a2a 0%, #ff4fd8 100%);
          transform: translateX(-50%) rotate(0deg);
        }
        
        .line-2 {
          background: linear-gradient(180deg, #2a2a2a 0%, #1de3f7 100%);
          transform: translateX(-50%) rotate(90deg);
        }
        
        .line-3 {
          background: linear-gradient(180deg, #2a2a2a 0%, #04ff95 100%);
          transform: translateX(-50%) rotate(180deg);
        }
        
        .line-4 {
          background: linear-gradient(180deg, #2a2a2a 0%, #5d5fef 100%);
          transform: translateX(-50%) rotate(270deg);
        }
        
        @keyframes spin {
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
          .circle-base {
            width: 350px;
            height: 350px;
            border-width: 6px;
          }
          .revolving-lines {
            width: 400px;
            height: 400px;
          }
          .line {
            height: 45px;
            transform-origin: 50% 200px;
          }
        }
        
        @media (max-width: 480px) {
          .circle-base {
            width: 280px;
            height: 280px;
            border-width: 4px;
          }
          .revolving-lines {
            width: 320px;
            height: 320px;
          }
          .line {
            height: 35px;
            width: 3px;
            transform-origin: 50% 160px;
          }
        }
      `}</style>
    </div>
  );
};

export default AnimatedHero;