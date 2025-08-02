import React from "react";
import { Link } from "react-router-dom";
import { BookOpen, Users, MessageCircle, BarChart } from "lucide-react";

const AnimatedHero = () => {
  return (
    <div className="relative flex items-center justify-center min-h-screen bg-black overflow-hidden">

      {/* Rotating Quantel-Style Arcs */}
      <div className="absolute w-[600px] h-[600px] md:w-[700px] md:h-[700px] flex items-center justify-center">
        <div className="absolute w-full h-full rounded-full animate-spin-slow quantel-arc-outer" />
        <div className="absolute w-[80%] h-[80%] rounded-full animate-spin-slower quantel-arc-inner" />
      </div>

      {/* Floating Outlined Icons */}
      <div className="icon-style top-10 left-10"><BookOpen /></div>
      <div className="icon-style top-10 right-10"><MessageCircle /></div>
      <div className="icon-style bottom-10 left-10"><Users /></div>
      <div className="icon-style bottom-10 right-10"><BarChart /></div>

      {/* Central Hero Content */}
      <div className="text-center px-4 z-10 animate-fadeIn">
        <h1 className="text-5xl font-bold mb-4">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            Sahadhyayi
          </span>
        </h1>
        <p className="text-xl text-white font-semibold mb-4">The Book Readers Social Media</p>
        <p className="text-gray-300 mb-8 max-w-xl mx-auto">
          Find new books, connect with readers, and share your love of reading—all in one friendly community.
        </p>
        <Link to="/library">
          <button className="px-8 py-3 bg-white text-black rounded-full hover:scale-105 transition duration-300">
            📚 Explore the Library
          </button>
        </Link>
      </div>

      {/* Inline CSS */}
      <style>{`
        .quantel-arc-outer {
          background: conic-gradient(from 0deg, #f72585 0deg 240deg, transparent 240deg 360deg);
          mask-image: radial-gradient(circle, transparent 70%, black 70%);
          animation: spin 40s linear infinite;
        }

        .quantel-arc-inner {
          background: conic-gradient(from 180deg, #04ff95 0deg 220deg, transparent 220deg 360deg);
          mask-image: radial-gradient(circle, transparent 70%, black 70%);
          animation: spinReverse 60s linear infinite;
        }

        .icon-style {
          position: absolute;
          color: #fff;
          width: 45px;
          height: 45px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          backdrop-filter: blur(8px);
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 0 20px rgba(0,0,0,0.2);
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes spinReverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fadeIn {
          animation: fadeIn 1.5s ease-out;
        }

        @media (max-width:768px) {
          .quantel-arc-outer, .quantel-arc-inner {
            width: 350px;
            height: 350px;
          }

          .icon-style {
            width: 35px;
            height: 35px;
          }
        }
      `}</style>
    </div>
  );
};

export default AnimatedHero;