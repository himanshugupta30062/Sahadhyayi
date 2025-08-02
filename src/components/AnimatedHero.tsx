import React from "react";
import { Link } from "react-router-dom";
import { BookOpen, Users, MessageCircle, BarChart } from "lucide-react";

const AnimatedHero = () => {
  return (
    <div className="relative flex items-center justify-center min-h-screen bg-black overflow-hidden">

      <div className="absolute w-[700px] h-[700px] rounded-full animate-spin-slow border-t-[20px] border-[magenta] opacity-90"></div>
      <div className="absolute w-[560px] h-[560px] rounded-full animate-spin-reverse border-t-[20px] border-cyan-400 opacity-90"></div>
      <div className="absolute w-[420px] h-[420px] rounded-full animate-spin-slow border-t-[20px] border-indigo-400 opacity-90"></div>

      <div className="absolute w-[700px] h-[700px] animate-spin-slow">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 group">
          <span className="text-white bg-gray-800 px-3 py-2 rounded-full cursor-pointer relative">L
            <span className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white text-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Library</span>
          </span>
        </div>
      </div>

      <div className="absolute w-[560px] h-[560px] animate-spin-reverse">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 group">
          <span className="text-white bg-gray-800 px-3 py-2 rounded-full cursor-pointer relative">S
            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white text-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Social Media</span>
          </span>
        </div>
      </div>

      <div className="absolute w-[420px] h-[420px] animate-spin-slow">
        <div className="absolute top-1/2 right-0 -translate-y-1/2 group">
          <span className="text-white bg-gray-800 px-3 py-2 rounded-full cursor-pointer relative">A
            <span className="absolute right-full top-1/2 transform -translate-y-1/2 mr-2 bg-white text-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Authors</span>
          </span>
        </div>
      </div>

      <div className="absolute top-[25%] left-[25%] w-10 h-10 text-white animate-pulse-medium"><BookOpen /></div>
      <div className="absolute top-[25%] right-[25%] w-10 h-10 text-white animate-pulse-medium delay-1000"><MessageCircle /></div>
      <div className="absolute bottom-[25%] left-[25%] w-10 h-10 text-white animate-pulse-medium delay-2000"><Users /></div>
      <div className="absolute bottom-[25%] right-[25%] w-10 h-10 text-white animate-pulse-medium delay-3000"><BarChart /></div>

      <div className="relative z-10 text-center max-w-[350px] px-6">
        <h1 className="text-5xl font-bold mb-4">
          <span className="text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text">
            Sahadhyayi
          </span>
        </h1>
        <h2 className="text-2xl font-bold text-white mb-4">
          The Book Readers Social Media
        </h2>
        <p className="text-gray-300 text-lg mb-6 leading-relaxed">
          Find new books, connect with readers, and share your love of reading—all in one friendly community.
        </p>
        <Link to="/library">
          <button className="px-8 py-3 bg-white text-black rounded-full font-semibold hover:bg-gray-100 transition-all duration-300">
            📚 Explore the Library
          </button>
        </Link>
      </div>

      <style>{`
        .animate-spin-slow { animation: spin 15s linear infinite; }
        .animate-spin-reverse { animation: spin-reverse 18s linear infinite; }
        .animate-pulse-medium { animation: pulse-glow 5s ease-in-out infinite; }
        .delay-1000 { animation-delay: 1s; }
        .delay-2000 { animation-delay: 2s; }
        .delay-3000 { animation-delay: 3s; }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.2; box-shadow: 0 0 6px rgba(255, 255, 255, 0.4); }
          50% { opacity: 1; box-shadow: 0 0 20px rgba(255, 255, 255, 0.8); }
        }

        @media (max-width: 768px) {
          .w-[700px], .w-[560px], .w-[420px] { width: 90vw; height: 90vw; }
        }
      `}</style>
    </div>
  );
};

export default AnimatedHero;
