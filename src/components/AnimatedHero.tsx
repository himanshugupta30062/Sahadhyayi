import React from "react";
import { Link } from "react-router-dom";
import { BookOpen, Users, Pen } from "lucide-react";

const AnimatedHero = () => {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-black overflow-hidden">
      {/* Colorful Rotating Arc Rings */}
      <div className="relative w-[500px] h-[500px] mx-auto">
        {/* Outer Arc Ring */}
        <div className="absolute inset-0 arc-outer"></div>
        
        {/* Middle Arc Ring */}
        <div className="absolute inset-[40px] arc-middle"></div>
        
        {/* Inner Arc Ring */}
        <div className="absolute inset-[80px] arc-inner"></div>

        {/* Section Labels on Rings */}
        <div className="absolute inset-0 section-outer">
          <div className="section-label">Library</div>
        </div>
        
        <div className="absolute inset-[40px] section-middle">
          <div className="section-label">Social Media</div>
        </div>
        
        <div className="absolute inset-[80px] section-inner">
          <div className="section-label">Authors</div>
        </div>

        {/* Floating Logos */}
        <div className="absolute inset-0">
          <div className="logo logo-1">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div className="logo logo-2">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div className="logo logo-3">
            <Pen className="w-6 h-6 text-white" />
          </div>
        </div>
        
        {/* Center Content */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center w-[300px]">
          <h1 className="text-4xl font-bold mb-3 leading-tight">
            <span className="multicolor-text">
              <span className="letter-s">S</span>
              <span className="letter-a">a</span>
              <span className="letter-h">h</span>
              <span className="letter-a2">a</span>
              <span className="letter-d">d</span>
              <span className="letter-h2">h</span>
              <span className="letter-y">y</span>
              <span className="letter-a3">a</span>
              <span className="letter-y2">y</span>
              <span className="letter-i">i</span>
            </span>
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
        /* Multi-colored letters */
        .multicolor-text {
          font-size: 4rem;
          font-weight: 900;
        }
        .letter-s { color: #ff4fd8; }
        .letter-a { color: #1de3f7; }
        .letter-h { color: #5d5fef; }
        .letter-a2 { color: #04ff95; }
        .letter-d { color: #ff6b35; }
        .letter-h2 { color: #f72585; }
        .letter-y { color: #4cc9f0; }
        .letter-a3 { color: #7209b7; }
        .letter-y2 { color: #560bad; }
        .letter-i { color: #480ca8; }
        
        /* Arc Rings (50% circles) */
        .arc-outer {
          width: 100%;
          height: 100%;
          border: 4px solid transparent;
          border-radius: 50%;
          border-top: 4px solid #ff4fd8;
          border-right: 4px solid #1de3f7;
          border-bottom: 4px solid transparent;
          border-left: 4px solid transparent;
          animation: rotate-clockwise 8s linear infinite;
          filter: drop-shadow(0 0 20px rgba(255, 79, 216, 0.6));
        }
        
        .arc-middle {
          width: 100%;
          height: 100%;
          border: 4px solid transparent;
          border-radius: 50%;
          border-top: 4px solid transparent;
          border-right: 4px solid transparent;
          border-bottom: 4px solid #04ff95;
          border-left: 4px solid #5d5fef;
          animation: rotate-counter-clockwise 6s linear infinite;
          filter: drop-shadow(0 0 15px rgba(4, 255, 149, 0.6));
        }
        
        .arc-inner {
          width: 100%;
          height: 100%;
          border: 4px solid transparent;
          border-radius: 50%;
          border-top: 4px solid #1de3f7;
          border-right: 4px solid transparent;
          border-bottom: 4px solid transparent;
          border-left: 4px solid #ff4fd8;
          animation: rotate-clockwise 4s linear infinite;
          filter: drop-shadow(0 0 10px rgba(29, 227, 247, 0.6));
        }

        /* Section Labels */
        .section-outer, .section-middle, .section-inner {
          border-radius: 50%;
          position: relative;
        }

        .section-outer .section-label {
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          color: #ff4fd8;
          font-weight: bold;
          font-size: 0.9rem;
          opacity: 0;
          animation: label-appear-outer 30s infinite;
        }

        .section-middle .section-label {
          position: absolute;
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          color: #04ff95;
          font-weight: bold;
          font-size: 0.9rem;
          opacity: 0;
          animation: label-appear-middle 30s infinite;
        }

        .section-inner .section-label {
          position: absolute;
          top: 50%;
          left: -60px;
          transform: translateY(-50%);
          color: #1de3f7;
          font-weight: bold;
          font-size: 0.9rem;
          opacity: 0;
          animation: label-appear-inner 30s infinite;
        }

        /* Floating Logos */
        .logo {
          position: absolute;
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .logo-1 {
          top: 20%;
          right: 10%;
          animation: float-glow 6s ease-in-out infinite;
        }

        .logo-2 {
          bottom: 20%;
          left: 10%;
          animation: float-glow 6s ease-in-out infinite 2s;
        }

        .logo-3 {
          top: 50%;
          right: -5%;
          animation: float-glow 6s ease-in-out infinite 4s;
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
          0%, 30% { opacity: 0; transform: translateX(-50%) scale(0.8); }
          33%, 37% { opacity: 1; transform: translateX(-50%) scale(1); }
          40%, 100% { opacity: 0; transform: translateX(-50%) scale(0.8); }
        }

        @keyframes label-appear-inner {
          0%, 60% { opacity: 0; transform: translateY(-50%) scale(0.8); }
          63%, 67% { opacity: 1; transform: translateY(-50%) scale(1); }
          70%, 100% { opacity: 0; transform: translateY(-50%) scale(0.8); }
        }

        @keyframes float-glow {
          0%, 100% { 
            transform: translateY(0px) scale(1);
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
            opacity: 0.7;
          }
          50% { 
            transform: translateY(-10px) scale(1.1);
            box-shadow: 0 0 30px rgba(255, 255, 255, 0.6);
            opacity: 1;
          }
        }
        
        @media (max-width: 768px) {
          .arc-outer, .arc-middle, .arc-inner {
            border-width: 3px;
          }
          .multicolor-text {
            font-size: 2.5rem;
          }
          .logo {
            width: 30px;
            height: 30px;
          }
        }
      `}</style>
    </div>
  );
};

export default AnimatedHero;