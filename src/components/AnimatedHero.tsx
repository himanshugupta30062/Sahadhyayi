import React from "react";
import { Link } from "react-router-dom";
import { Player } from '@lottiefiles/react-lottie-player';
import { Lightbulb, TrendingUp, User, GraduationCap } from 'lucide-react';

const AnimatedHero = () => {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-black overflow-hidden">
      {/* Main Hero Container */}
      <div className="relative w-[600px] h-[600px] mx-auto max-w-[90vw] max-h-[90vh]">
        
        {/* Lottie Animation */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Player
            autoplay
            loop
            src="https://lottie.host/b8b1f3d4-4d5a-4c6a-8b9a-2e3f4a5b6c7d/pKFC2ykpSm.json"
            style={{ width: '480px', height: '480px' }}
            className="max-w-full max-h-full"
          />
        </div>

        {/* Orbiting Icons */}
        <div className="absolute inset-0">
          <div className="orbit-icon" style={{'--angle': '0deg'} as React.CSSProperties}>
            <Lightbulb className="w-8 h-8 text-white/60" />
          </div>
          <div className="orbit-icon" style={{'--angle': '90deg'} as React.CSSProperties}>
            <TrendingUp className="w-8 h-8 text-white/60" />
          </div>
          <div className="orbit-icon" style={{'--angle': '180deg'} as React.CSSProperties}>
            <User className="w-8 h-8 text-white/60" />
          </div>
          <div className="orbit-icon" style={{'--angle': '270deg'} as React.CSSProperties}>
            <GraduationCap className="w-8 h-8 text-white/60" />
          </div>
        </div>

        {/* Rotating Pictures */}
        <div className="absolute inset-0">
          <div className="rotating-picture" style={{'--delay': '0s'} as React.CSSProperties}>
            <div className="picture-glow">
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face" 
                   alt="Reader" className="w-16 h-16 rounded-full object-cover" />
            </div>
          </div>
          <div className="rotating-picture" style={{'--delay': '-4s'} as React.CSSProperties}>
            <div className="picture-glow">
              <img src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop&crop=face" 
                   alt="Reader" className="w-16 h-16 rounded-full object-cover" />
            </div>
          </div>
          <div className="rotating-picture" style={{'--delay': '-8s'} as React.CSSProperties}>
            <div className="picture-glow">
              <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face" 
                   alt="Reader" className="w-16 h-16 rounded-full object-cover" />
            </div>
          </div>
        </div>
        
        {/* Center Content */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center w-[320px] max-w-[80vw]">
          <h1 className="text-5xl font-bold mb-4 leading-tight">
            <span className="gradient-text">Sahadhyayi</span>
          </h1>
          <h2 className="text-xl text-white font-bold mb-4">
            The Book Social Media
          </h2>
          <p className="text-sm text-gray-300 mb-8 leading-relaxed max-w-[280px] mx-auto">
            Find new books, connect with other readers, and share your love of reading—all in one friendly community.
          </p>
          <Link to="/library" className="inline-block">
            <button className="px-8 py-4 rounded-full text-base font-bold bg-white text-black hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-xl">
              Explore the Library
            </button>
          </Link>
        </div>
      </div>
      
      <style>{`
        .gradient-text {
          background: linear-gradient(90deg, #e100ff, #00ffe7, #2e91fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradient-shift 3s ease-in-out infinite alternate;
        }
        
        @keyframes gradient-shift {
          0% {
            background: linear-gradient(90deg, #e100ff, #00ffe7, #2e91fc);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          100% {
            background: linear-gradient(90deg, #2e91fc, #e100ff, #00ffe7);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
        }
        
        .orbit-icon {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: rotate(var(--angle)) translate(280px) rotate(calc(-1 * var(--angle)));
          animation: orbit-slow 20s linear infinite;
        }
        
        @keyframes orbit-slow {
          100% {
            transform: rotate(calc(var(--angle) + 360deg)) translate(280px) rotate(calc(-1 * (var(--angle) + 360deg)));
          }
        }
        
        .rotating-picture {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: rotate(0deg) translate(220px);
          animation: rotate-picture 12s linear infinite;
          animation-delay: var(--delay);
        }
        
        .picture-glow {
          position: relative;
          transform: rotate(0deg);
          animation: fade-glow 12s ease-in-out infinite;
          animation-delay: var(--delay);
        }
        
        .picture-glow::before {
          content: '';
          position: absolute;
          inset: -8px;
          background: linear-gradient(45deg, #ff4fd8, #1de3f7, #5d5fef, #04ff95);
          border-radius: 50%;
          opacity: 0;
          animation: glow-pulse 12s ease-in-out infinite;
          animation-delay: var(--delay);
        }
        
        @keyframes rotate-picture {
          100% {
            transform: rotate(360deg) translate(220px);
          }
        }
        
        @keyframes fade-glow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        
        @keyframes glow-pulse {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.8; }
        }
        
        @media (max-width: 768px) {
          .orbit-icon {
            transform: rotate(var(--angle)) translate(200px) rotate(calc(-1 * var(--angle)));
          }
          
          .rotating-picture {
            transform: rotate(0deg) translate(160px);
          }
          
          @keyframes orbit-slow {
            100% {
              transform: rotate(calc(var(--angle) + 360deg)) translate(200px) rotate(calc(-1 * (var(--angle) + 360deg)));
            }
          }
          
          @keyframes rotate-picture {
            100% {
              transform: rotate(360deg) translate(160px);
            }
          }
        }
        
        @media (max-width: 480px) {
          .orbit-icon {
            transform: rotate(var(--angle)) translate(140px) rotate(calc(-1 * var(--angle)));
          }
          
          .rotating-picture {
            transform: rotate(0deg) translate(120px);
          }
          
          @keyframes orbit-slow {
            100% {
              transform: rotate(calc(var(--angle) + 360deg)) translate(140px) rotate(calc(-1 * (var(--angle) + 360deg)));
            }
          }
          
          @keyframes rotate-picture {
            100% {
              transform: rotate(360deg) translate(120px);
            }
          }
        }
      `}</style>
    </div>
  );
};

export default AnimatedHero;