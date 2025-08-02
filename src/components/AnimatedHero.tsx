import React from "react";
import { Link } from "react-router-dom";
import { UserPlus } from "lucide-react";

const AnimatedHero = () => {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-black overflow-hidden">
      {/* Animated Circle */}
      <div className="absolute">
        <span className="circle-animate block" />
      </div>
      
      {/* Centered Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-4xl">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 text-white leading-tight">
          <span className="gradient-text">Sahadhyayi:</span><br/>
          Your Fellow Reading Journey
        </h1>
        <p className="text-lg md:text-xl lg:text-2xl text-gray-300 max-w-3xl mb-8 leading-relaxed">
          Connect, read, and grow with thousands of fellow readers worldwide.<br/>
          Join the digital community bringing meaningful reading back into focus.
        </p>
        <Link to="/signup" className="inline-block">
          <button className="mt-4 px-8 py-4 rounded-full text-lg font-semibold bg-white text-black hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Join Our Reading Community (Free!)
          </button>
        </Link>
      </div>
      
      <style>{`
        .circle-animate {
          width: 500px;
          height: 500px;
          border-radius: 50%;
          border: 12px solid transparent;
          background: conic-gradient(
            from 0deg,
            #ff4fd8 0%,
            #1de3f7 25%, 
            #04ff95 50%,
            #5d5fef 75%,
            #ff4fd8 100%
          );
          filter: drop-shadow(0 0 60px #1de3f7) blur(0.3px);
          animation: spin 8s linear infinite;
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          z-index: 1;
          box-shadow: 
            0 0 100px 15px rgba(29, 227, 247, 0.3),
            0 0 200px 30px rgba(255, 79, 216, 0.2),
            inset 0 0 50px rgba(255, 255, 255, 0.1);
        }
        
        .circle-animate::before {
          content: '';
          position: absolute;
          inset: -20px;
          border-radius: 50%;
          background: conic-gradient(
            from 180deg,
            transparent 0%,
            rgba(29, 227, 247, 0.3) 25%,
            transparent 50%,
            rgba(255, 79, 216, 0.3) 75%,
            transparent 100%
          );
          animation: spin 12s linear infinite reverse;
          z-index: -1;
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
          .circle-animate {
            width: 350px;
            height: 350px;
            border-width: 8px;
          }
          .circle-animate::before {
            inset: -15px;
          }
        }
        
        @media (max-width: 480px) {
          .circle-animate {
            width: 280px;
            height: 280px;
            border-width: 6px;
          }
          .circle-animate::before {
            inset: -10px;
          }
        }
      `}</style>
    </div>
  );
};

export default AnimatedHero;