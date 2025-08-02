import React from "react";
import { Link } from "react-router-dom";
import { BookOpen, Users, Pen } from "lucide-react";

const AnimatedHero = () => {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-black overflow-hidden">
      {/* Atomic Model - clean concentric rings */}
      <div className="relative w-[700px] h-[700px] mx-auto">
        <div className="absolute inset-0 pointer-events-none -z-10">
          {/* Outer Ring */}
          <div className="absolute inset-0 rounded-full border-2 border-[#1de3f7]/60 ring-outer"></div>

          {/* Middle Ring */}
          <div className="absolute inset-[100px] rounded-full border-2 border-[#04ff95]/60 ring-middle"></div>

          {/* Inner Ring */}
          <div className="absolute inset-[200px] rounded-full border-2 border-[#ff4fd8]/60 ring-inner"></div>
        </div>

        {/* Section Labels on Rings */}
        <div className="absolute inset-0">
          <div className="section-label-outer">Library</div>
        </div>
        
        <div className="absolute inset-[100px]">
          <div className="section-label-middle">Social Media</div>
        </div>
        
        <div className="absolute inset-[200px]">
          <div className="section-label-inner">Authors</div>
        </div>

        {/* Only 3 Floating Icons */}
        <div className="absolute inset-0">
          <div className="floating-icon icon-top-left">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div className="floating-icon icon-top-right">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div className="floating-icon icon-bottom">
            <Pen className="w-6 h-6 text-white" />
          </div>
        </div>
        
        {/* Center Content */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center w-[350px] z-20">
          <h1 className="text-5xl font-bold mb-4 leading-tight">
            <span className="multicolor-text">
              Sahadhyayi
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
        /* Incremental gradient text */
        .multicolor-text {
          font-size: 4rem;
          font-weight: 900;
          background: linear-gradient(90deg, #ff4fd8, #1de3f7, #5d5fef, #04ff95, #ff6b35, #f72585, #4cc9f0, #7209b7, #560bad, #480ca8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        /* Clean concentric rings */
        .ring-outer,
        .ring-middle,
        .ring-inner {
          border-radius: 50%;
          box-sizing: border-box;
        }

        .ring-outer {
          box-shadow: 0 0 20px rgba(29, 227, 247, 0.6);
          animation: spin-clockwise 20s linear infinite;
        }

        .ring-middle {
          box-shadow: 0 0 20px rgba(4, 255, 149, 0.6);
          animation: spin-counter 15s linear infinite;
        }

        .ring-inner {
          box-shadow: 0 0 20px rgba(255, 79, 216, 0.6);
          animation: spin-clockwise 10s linear infinite;
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

        @keyframes spin-clockwise {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes spin-counter {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
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