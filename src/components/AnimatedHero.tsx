import React from "react";
import { Link } from "react-router-dom";
import { BookOpen, Users, Pen } from "lucide-react";

const AnimatedHero = () => {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-black overflow-hidden">
      {/* Perfect Circular Rings */}
      <div className="relative w-[600px] h-[600px] mx-auto">
        {/* Outer Ring */}
        <div className="absolute inset-0 perfect-ring ring-outer"></div>
        
        {/* Middle Ring */}
        <div className="absolute inset-[60px] perfect-ring ring-middle"></div>
        
        {/* Inner Ring */}
        <div className="absolute inset-[120px] perfect-ring ring-inner"></div>

        {/* Section Labels on Rings */}
        <div className="absolute inset-0">
          <div className="section-label-outer">Library</div>
        </div>
        
        <div className="absolute inset-[60px]">
          <div className="section-label-middle">Social Media</div>
        </div>
        
        <div className="absolute inset-[120px]">
          <div className="section-label-inner">Authors</div>
        </div>

        {/* Floating Logos positioned like Quantel */}
        <div className="absolute inset-0">
          <div className="floating-icon icon-top">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div className="floating-icon icon-left">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div className="floating-icon icon-right">
            <Pen className="w-5 h-5 text-white" />
          </div>
          <div className="floating-icon icon-bottom">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
        </div>
        
        {/* Center Content */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center w-[350px]">
          <h1 className="text-5xl font-bold mb-4 leading-tight">
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
          <p className="text-xl text-white font-medium mb-4">
            The Book Social Media
          </p>
          <p className="text-base text-gray-300 mb-8 leading-relaxed">
            Find new books, connect with other readers, and share your love of reading—all in one friendly community.
          </p>
          <Link to="/library" className="inline-block">
            <button className="px-10 py-4 rounded-full text-base font-semibold bg-white text-black hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-xl">
              📚 Start your Reading Journey
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
        
        /* Perfect Circular Rings like Quantel */
        .perfect-ring {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 5px solid transparent;
        }

        .ring-outer {
          background: linear-gradient(45deg, #ff4fd8, #1de3f7, #5d5fef, #04ff95) border-box;
          -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: rotate-clockwise 10s linear infinite;
          filter: drop-shadow(0 0 30px rgba(255, 79, 216, 0.4));
        }
        
        .ring-middle {
          background: linear-gradient(-45deg, #04ff95, #5d5fef, #1de3f7, #ff4fd8) border-box;
          -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: rotate-counter-clockwise 8s linear infinite;
          filter: drop-shadow(0 0 25px rgba(4, 255, 149, 0.4));
        }
        
        .ring-inner {
          background: linear-gradient(90deg, #1de3f7, #ff4fd8, #04ff95, #5d5fef) border-box;
          -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: rotate-clockwise 6s linear infinite;
          filter: drop-shadow(0 0 20px rgba(29, 227, 247, 0.4));
        }

        /* Section Labels positioned properly */
        .section-label-outer {
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          color: #ff4fd8;
          font-weight: bold;
          font-size: 1rem;
          text-shadow: 0 0 10px rgba(255, 79, 216, 0.6);
          opacity: 0;
          animation: label-appear-outer 30s infinite;
        }

        .section-label-middle {
          position: absolute;
          bottom: -20px;
          right: -80px;
          color: #04ff95;
          font-weight: bold;
          font-size: 1rem;
          text-shadow: 0 0 10px rgba(4, 255, 149, 0.6);
          opacity: 0;
          animation: label-appear-middle 30s infinite;
        }

        .section-label-inner {
          position: absolute;
          top: 50%;
          left: -80px;
          transform: translateY(-50%);
          color: #1de3f7;
          font-weight: bold;
          font-size: 1rem;
          text-shadow: 0 0 10px rgba(29, 227, 247, 0.6);
          opacity: 0;
          animation: label-appear-inner 30s infinite;
        }

        /* Floating Icons positioned like Quantel */
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

        .icon-top {
          top: -25px;
          left: 50%;
          transform: translateX(-50%);
          animation: icon-glow 4s ease-in-out infinite;
        }

        .icon-left {
          top: 50%;
          left: -25px;
          transform: translateY(-50%);
          animation: icon-glow 4s ease-in-out infinite 1s;
        }

        .icon-right {
          top: 50%;
          right: -25px;
          transform: translateY(-50%);
          animation: icon-glow 4s ease-in-out infinite 2s;
        }

        .icon-bottom {
          bottom: -25px;
          left: 50%;
          transform: translateX(-50%);
          animation: icon-glow 4s ease-in-out infinite 3s;
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

        @keyframes icon-glow {
          0%, 100% { 
            opacity: 0.6;
            transform: translateX(-50%) scale(1);
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
          }
          50% { 
            opacity: 1;
            transform: translateX(-50%) scale(1.1);
            box-shadow: 0 0 25px rgba(255, 255, 255, 0.4);
          }
        }

        .icon-left {
          animation-name: icon-glow-left;
        }

        .icon-right {
          animation-name: icon-glow-right;
        }

        .icon-bottom {
          animation-name: icon-glow-bottom;
        }

        @keyframes icon-glow-left {
          0%, 100% { 
            opacity: 0.6;
            transform: translateY(-50%) scale(1);
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
          }
          50% { 
            opacity: 1;
            transform: translateY(-50%) scale(1.1);
            box-shadow: 0 0 25px rgba(255, 255, 255, 0.4);
          }
        }

        @keyframes icon-glow-right {
          0%, 100% { 
            opacity: 0.6;
            transform: translateY(-50%) scale(1);
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
          }
          50% { 
            opacity: 1;
            transform: translateY(-50%) scale(1.1);
            box-shadow: 0 0 25px rgba(255, 255, 255, 0.4);
          }
        }

        @keyframes icon-glow-bottom {
          0%, 100% { 
            opacity: 0.6;
            transform: translateX(-50%) scale(1);
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
          }
          50% { 
            opacity: 1;
            transform: translateX(-50%) scale(1.1);
            box-shadow: 0 0 25px rgba(255, 255, 255, 0.4);
          }
        }
        
        @media (max-width: 768px) {
          .perfect-ring {
            border-width: 3px;
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