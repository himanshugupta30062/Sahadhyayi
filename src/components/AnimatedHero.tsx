import React from "react";
import { Link } from "react-router-dom";
import { BookOpen, MessageCircle, Users, TrendingUp } from "lucide-react";

const AnimatedHero = () => (
  <div className="relative flex items-center justify-center min-h-screen bg-black overflow-hidden">
    
    {/* Large colorful rotating arcs */}
    <div
      className="absolute w-[600px] h-[600px] rounded-full animate-spin-slow"
      style={{ 
        background: `conic-gradient(from 0deg, transparent 0deg, transparent 180deg, #ec4899 180deg, #06b6d4 270deg, transparent 270deg)`,
        willChange: 'transform',
        transformOrigin: 'center'
      }}
    />
    <div
      className="absolute w-[480px] h-[480px] rounded-full animate-spin-reverse"
      style={{ 
        background: `conic-gradient(from 90deg, transparent 0deg, #10b981 90deg, #8b5cf6 180deg, transparent 180deg)`,
        willChange: 'transform',
        transformOrigin: 'center'
      }}
    />
    <div
      className="absolute w-[360px] h-[360px] rounded-full animate-spin-slower"
      style={{ 
        background: `conic-gradient(from 180deg, transparent 0deg, transparent 90deg, #f59e0b 90deg, #ef4444 180deg, transparent 180deg)`,
        willChange: 'transform',
        transformOrigin: 'center'
      }}
    />

    {/* Black inner circle to create arc effect */}
    <div className="absolute w-[320px] h-[320px] rounded-full bg-black z-[1]" />

    {/* Orbiting atoms with letters */}
    <div className="absolute w-[600px] h-[600px] animate-spin-slow pointer-events-none z-[2]">
      <div
        className="absolute group"
        style={{
          top: '0px',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: "auto"
        }}
      >
        <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-lg cursor-pointer shadow-lg relative">
          L
          <span className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white text-black px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-20 whitespace-nowrap text-sm">
            Library
          </span>
        </div>
      </div>
    </div>

    <div className="absolute w-[480px] h-[480px] animate-spin-reverse pointer-events-none z-[2]">
      <div
        className="absolute group"
        style={{
          bottom: '0px',
          left: '50%',
          transform: 'translate(-50%, 50%)',
          pointerEvents: "auto"
        }}
      >
        <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg cursor-pointer shadow-lg relative">
          S
          <span className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white text-black px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-20 whitespace-nowrap text-sm">
            Social Media
          </span>
        </div>
      </div>
    </div>

    <div className="absolute w-[360px] h-[360px] animate-spin-slower pointer-events-none z-[2]">
      <div
        className="absolute group"
        style={{
          top: '50%',
          left: '0px',
          transform: 'translate(-50%, -50%)',
          pointerEvents: "auto"
        }}
      >
        <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-lg cursor-pointer shadow-lg relative">
          A
          <span className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white text-black px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-20 whitespace-nowrap text-sm">
            Authors
          </span>
        </div>
      </div>
    </div>

    {/* Floating glowing icons */}
    <div className="absolute w-16 h-16 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm shadow-2xl animate-float top-[12%] left-[12%] z-[3]">
      <BookOpen size={32} className="text-cyan-400" />
    </div>
    <div className="absolute w-16 h-16 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm shadow-2xl animate-float top-[12%] right-[12%] z-[3] animation-delay-1000">
      <MessageCircle size={32} className="text-pink-400" />
    </div>
    <div className="absolute w-16 h-16 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm shadow-2xl animate-float bottom-[12%] left-[12%] z-[3] animation-delay-2000">
      <Users size={32} className="text-purple-400" />
    </div>
    <div className="absolute w-16 h-16 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm shadow-2xl animate-float bottom-[12%] right-[12%] z-[3] animation-delay-3000">
      <TrendingUp size={32} className="text-emerald-400" />
    </div>

    {/* Central content */}
    <div className="relative z-10 text-center max-w-[400px] px-6">
      <h1 className="text-6xl font-bold mb-4">
        <span className="text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text animate-gradient-shift">
          Sahadhyayi
        </span>
      </h1>
      <h2 className="text-2xl font-semibold text-white mb-4">
        The Book Readers Social Media
      </h2>
      <p className="text-gray-300 text-lg mb-8 leading-relaxed">
        Find new books, connect with readers, and share your love of reading—all in one friendly community.
      </p>
      <Link to="/library">
        <button className="px-8 py-4 bg-gradient-to-r from-pink-500 to-cyan-500 text-white rounded-full font-semibold hover:from-pink-600 hover:to-cyan-600 transition-all duration-300 flex items-center justify-center gap-3 shadow-xl mx-auto text-lg">
          <span role="img" aria-label="Book">📚</span> 
          Start your Growth Journey
        </button>
      </Link>
    </div>

    {/* Enhanced animations and styles */}
    <style>{`
      .animate-spin-slow { 
        animation: spin 20s linear infinite; 
      }
      .animate-spin-reverse { 
        animation: spin-reverse 15s linear infinite; 
      }
      .animate-spin-slower { 
        animation: spin 25s linear infinite; 
      }
      .animate-float { 
        animation: float 6s ease-in-out infinite; 
      }
      .animate-gradient-shift {
        background-size: 200% 200%;
        animation: gradient-shift 3s ease infinite;
      }
      .animation-delay-1000 { animation-delay: 1s; }
      .animation-delay-2000 { animation-delay: 2s; }
      .animation-delay-3000 { animation-delay: 3s; }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes spin-reverse {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(-360deg); }
      }
      @keyframes float {
        0%, 100% { 
          transform: translateY(0px) scale(1);
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
        }
        50% { 
          transform: translateY(-10px) scale(1.05);
          box-shadow: 0 0 30px rgba(255, 255, 255, 0.3);
        }
      }
      @keyframes gradient-shift {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
      
      @media (max-width: 768px) {
        .w-[600px], .w-[480px], .w-[360px], .w-[320px] { 
          width: min(90vw, 400px); 
          height: min(90vw, 400px); 
        }
      }
    `}</style>
  </div>
);

export default AnimatedHero;