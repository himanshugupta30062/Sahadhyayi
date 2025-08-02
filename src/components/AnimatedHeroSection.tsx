
import React from "react";

const AnimatedHeroSection = () => {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-black overflow-hidden">
      {/* Animated Circle Ring */}
      <div className="absolute">
        <span className="circle-animate block" />
      </div>
      
      {/* Centered Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-4xl">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 text-white leading-tight">
          <span className="gradient-text">Sahadhyayi:</span><br className="md:hidden" />  
          Your Social Reading Journey
        </h1>
        <p className="text-lg md:text-xl lg:text-2xl text-gray-300 max-w-2xl mb-8 leading-relaxed">
          Discover books, connect with readers, and build your own digital reading community.<br/>
          Sahadhyayi brings together book lovers, authors, and knowledge seekers—making reading social, interactive, and fun!
        </p>
        <button className="mt-4 px-8 py-4 rounded-full text-lg font-semibold bg-white text-black hover:bg-gray-200 transition-all duration-300 hover:scale-105 shadow-lg">
          Start Exploring Books
        </button>
      </div>

      <style jsx>{`
        .circle-animate {
          width: 450px;
          height: 450px;
          border-radius: 50%;
          border: 12px solid transparent;
          background: conic-gradient(
            from 0deg,
            #ff4fd8 0deg,
            #1de3f7 72deg,
            #04ff95 144deg,
            #5d5fef 216deg,
            #ff006e 288deg,
            #ff4fd8 360deg
          );
          filter: drop-shadow(0 0 60px #1de3f7aa) blur(0.8px);
          animation: spin 8s linear infinite;
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          z-index: 1;
          box-shadow: 
            0 0 100px 15px #1de3f744,
            0 0 200px 30px #ff4fd822,
            inset 0 0 50px 10px #5d5fef33;
        }
        
        .circle-animate::before {
          content: '';
          position: absolute;
          top: -6px;
          left: -6px;
          right: -6px;
          bottom: -6px;
          border-radius: 50%;
          background: conic-gradient(
            from 180deg,
            #ff4fd8 0deg,
            #1de3f7 72deg,
            #04ff95 144deg,
            #5d5fef 216deg,
            #ff006e 288deg,
            #ff4fd8 360deg
          );
          animation: spin 12s linear infinite reverse;
          z-index: -1;
          opacity: 0.6;
          filter: blur(2px);
        }
        
        @keyframes spin {
          0% { 
            transform: translate(-50%, -50%) rotate(0deg);
          }
          100% { 
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }
        
        .gradient-text {
          background: linear-gradient(135deg, #ff4fd8 0%, #1de3f7 40%, #04ff95 70%, #5d5fef 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          background-size: 200% 200%;
          animation: gradientShift 4s ease-in-out infinite;
        }
        
        @keyframes gradientShift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
          .circle-animate {
            width: 300px;
            height: 300px;
            border-width: 8px;
          }
          
          .circle-animate::before {
            top: -4px;
            left: -4px;
            right: -4px;
            bottom: -4px;
          }
        }
        
        @media (max-width: 480px) {
          .circle-animate {
            width: 250px;
            height: 250px;
            border-width: 6px;
          }
          
          .circle-animate::before {
            top: -3px;
            left: -3px;
            right: -3px;
            bottom: -3px;
          }
        }
        
        /* Enhanced glow effects */
        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 
              0 0 100px 15px #1de3f744,
              0 0 200px 30px #ff4fd822,
              inset 0 0 50px 10px #5d5fef33;
          }
          50% {
            box-shadow: 
              0 0 120px 20px #1de3f766,
              0 0 240px 40px #ff4fd833,
              inset 0 0 60px 15px #5d5fef44;
          }
        }
        
        .circle-animate {
          animation: spin 8s linear infinite, pulseGlow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default AnimatedHeroSection;
