import React from "react";
import { Link } from "react-router-dom";
import { Lightbulb, TrendingUp, GraduationCap } from "lucide-react";

const AnimatedHero = () => {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-black overflow-hidden">
      {/* Atomic Rings Container */}
      <div className="relative w-[800px] h-[800px] mx-auto flex items-center justify-center">
        
        {/* Outer Ring - Magenta */}
        <div className="absolute w-[700px] h-[700px]">
          <div className="atomic-arc-ring ring-outer"></div>
          <div className="section-label-outer">Library</div>
        </div>
        
        {/* Middle Ring - Blue */}
        <div className="absolute w-[550px] h-[550px]">
          <div className="atomic-arc-ring ring-middle"></div>
          <div className="section-label-middle">Community</div>
        </div>
        
        {/* Inner Ring - Teal */}
        <div className="absolute w-[400px] h-[400px]">
          <div className="atomic-arc-ring ring-inner"></div>
          <div className="section-label-inner">Reading</div>
        </div>
        
        {/* Floating Icons */}
        <div className="floating-icon icon-top-left">
          <Lightbulb className="w-6 h-6 text-yellow-400" />
        </div>
        
        <div className="floating-icon icon-top-right">
          <TrendingUp className="w-6 h-6 text-green-400" />
        </div>
        
        <div className="floating-icon icon-bottom">
          <GraduationCap className="w-6 h-6 text-blue-400" />
        </div>
        
        {/* Center Content */}
        <div className="relative z-10 text-center max-w-[400px] px-6">
          <h1 className="text-6xl font-bold mb-6 leading-tight">
            <span className="multicolor-text">
              Sahadhyayi
            </span>
          </h1>
          <h2 className="text-3xl text-white font-bold mb-6">
            The Book Social Media
          </h2>
          <p className="text-lg text-gray-300 mb-10 leading-relaxed">
            Find new books, connect with other readers, and share your love of reading—all in one friendly community.
          </p>
          <Link to="/library" className="inline-block">
            <button className="px-8 py-4 rounded-full text-lg font-semibold bg-white text-black hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-2xl">
              📚 Explore the Library
            </button>
          </Link>
        </div>
      </div>
      
      <style>{`
        /* Incremental gradient text for Sahadhyayi */
        .multicolor-text {
          font-size: 4rem;
          font-weight: 900;
          background: linear-gradient(90deg, #ff4fd8, #1de3f7, #5d5fef, #04ff95, #ff6b35, #f72585, #4cc9f0, #7209b7, #560bad);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        /* Atomic Model - 50% Arc Rings */
        .atomic-arc-ring {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 8px solid transparent;
          background: conic-gradient(from 0deg, transparent 0deg, var(--ring-color) 30deg, var(--ring-color) 210deg, transparent 240deg, transparent 360deg);
          -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          filter: drop-shadow(0 0 20px var(--ring-glow));
        }

        .ring-outer {
          --ring-color: #e91e63;
          --ring-glow: rgba(233, 30, 99, 0.6);
          animation: rotate-clockwise 20s linear infinite;
        }
        
        .ring-middle {
          --ring-color: #2196f3;
          --ring-glow: rgba(33, 150, 243, 0.6);
          animation: rotate-counter-clockwise 15s linear infinite;
        }
        
        .ring-inner {
          --ring-color: #00bcd4;
          --ring-glow: rgba(0, 188, 212, 0.6);
          animation: rotate-clockwise 10s linear infinite;
        }

        /* Section Labels */
        .section-label-outer {
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          color: #e91e63;
          font-weight: bold;
          font-size: 1rem;
          text-shadow: 0 0 10px rgba(233, 30, 99, 0.6);
          opacity: 0;
          animation: label-appear-outer 30s infinite;
        }

        .section-label-middle {
          position: absolute;
          bottom: -20px;
          right: -80px;
          color: #2196f3;
          font-weight: bold;
          font-size: 1rem;
          text-shadow: 0 0 10px rgba(33, 150, 243, 0.6);
          opacity: 0;
          animation: label-appear-middle 30s infinite;
        }

        .section-label-inner {
          position: absolute;
          top: 50%;
          left: -80px;
          transform: translateY(-50%);
          color: #00bcd4;
          font-weight: bold;
          font-size: 1rem;
          text-shadow: 0 0 10px rgba(0, 188, 212, 0.6);
          opacity: 0;
          animation: label-appear-inner 30s infinite;
        }

        /* Floating Icons */
        .floating-icon {
          position: absolute;
          width: 50px;
          height: 50px;
          background: rgba(20, 20, 20, 0.8);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
        }

        .icon-top-left {
          top: -50px;
          left: -50px;
          animation: icon-fade-cycle 8s ease-in-out infinite;
        }

        .icon-top-right {
          top: -50px;
          right: -50px;
          animation: icon-fade-cycle 8s ease-in-out infinite 2.5s;
        }

        .icon-bottom {
          bottom: -50px;
          left: 50%;
          transform: translateX(-50%);
          animation: icon-fade-cycle 8s ease-in-out infinite 5s;
        }

        @keyframes rotate-clockwise {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes rotate-counter-clockwise {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }

        @keyframes label-appear-outer {
          0%, 90% { opacity: 0; transform: translateX(-50%) scale(0.8); }
          3%, 7% { opacity: 1; transform: translateX(-50%) scale(1); }
          10%, 100% { opacity: 0; transform: translateX(-50%) scale(0.8); }
        }

        @keyframes label-appear-middle {
          0%, 30% { opacity: 0; transform: scale(0.8); }
          33%, 37% { opacity: 1; transform: scale(1); }
          40%, 100% { opacity: 0; transform: scale(0.8); }
        }

        @keyframes label-appear-inner {
          0%, 60% { opacity: 0; transform: translateY(-50%) scale(0.8); }
          63%, 67% { opacity: 1; transform: translateY(-50%) scale(1); }
          70%, 100% { opacity: 0; transform: translateY(-50%) scale(0.8); }
        }

        @keyframes icon-fade-cycle {
          0%, 20% { 
            opacity: 1;
            transform: scale(1);
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
          }
          25%, 75% { 
            opacity: 0;
            transform: scale(0.8);
            box-shadow: 0 0 5px rgba(255, 255, 255, 0.1);
          }
          80%, 100% { 
            opacity: 1;
            transform: scale(1);
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
          }
        }
        
        @media (max-width: 768px) {
          .atomic-arc-ring {
            border-width: 4px;
          }
          .multicolor-text {
            font-size: 2.5rem;
          }
          .floating-icon {
            width: 40px;
            height: 40px;
          }
        }
      `}</style>
    </div>
  );
};

export default AnimatedHero;