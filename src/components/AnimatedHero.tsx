import React from "react";
import { Link } from "react-router-dom";
import { BookOpen, Users, Pen, Star } from "lucide-react";

const AnimatedHero = () => {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-black overflow-hidden">
      {/* Bohr Atomic Model Container */}
      <div className="relative w-[800px] h-[800px] mx-auto">
        
        {/* Nucleus - Central glowing core */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full nucleus-glow z-10"></div>
        
        {/* Electron Orbits - Perfect Circles */}
        <div className="absolute inset-[60px] orbit-ring orbit-1">
          <div className="electron electron-1"></div>
          <div className="electron electron-2"></div>
        </div>
        
        <div className="absolute inset-[120px] orbit-ring orbit-2">
          <div className="electron electron-3"></div>
          <div className="electron electron-4"></div>
          <div className="electron electron-5"></div>
        </div>
        
        <div className="absolute inset-[180px] orbit-ring orbit-3">
          <div className="electron electron-6"></div>
          <div className="electron electron-7"></div>
          <div className="electron electron-8"></div>
          <div className="electron electron-9"></div>
        </div>

        {/* Floating Icons - Outside the atomic model */}
        <div className="floating-icon icon-top-left">
          <BookOpen className="w-6 h-6 text-white" />
        </div>
        <div className="floating-icon icon-top-right">
          <Users className="w-6 h-6 text-white" />
        </div>
        <div className="floating-icon icon-bottom-left">
          <Pen className="w-6 h-6 text-white" />
        </div>
        <div className="floating-icon icon-bottom-right">
          <Star className="w-6 h-6 text-white" />
        </div>
      </div>
      
      {/* Central Content - Separate from atomic model */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center w-[400px] z-20">
        <h1 className="text-6xl font-bold mb-6 leading-tight">
          <span className="multicolor-text">
            Sahadhyayi
          </span>
        </h1>
        <p className="text-2xl text-white font-medium mb-6">
          The Book Social Media
        </p>
        <p className="text-lg text-gray-300 mb-10 leading-relaxed">
          Find new books, connect with other readers, and share your love of reading—all in one friendly community.
        </p>
        <Link to="/library" className="inline-block">
          <button className="px-12 py-5 rounded-full text-lg font-semibold bg-white text-black hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-2xl cta-glow">
            📚 Start your Reading Journey
          </button>
        </Link>
      </div>
      
      <style>{`
        /* Multicolor gradient text */
        .multicolor-text {
          font-size: 5rem;
          font-weight: 900;
          background: linear-gradient(90deg, #ff4fd8, #1de3f7, #5d5fef, #04ff95, #ff6b35, #f72585, #4cc9f0, #7209b7, #560bad, #480ca8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradient-shift 6s ease-in-out infinite;
        }

        /* Nucleus - Central glowing core */
        .nucleus-glow {
          background: radial-gradient(circle, #fff 0%, #ff4fd8 30%, #1de3f7 60%, transparent 100%);
          animation: nucleus-pulse 3s ease-in-out infinite;
          box-shadow: 
            0 0 20px #ff4fd8,
            0 0 40px #1de3f7,
            0 0 60px #04ff95;
        }

        /* Electron Orbits - Perfect circles */
        .orbit-ring {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.1);
          position: relative;
        }

        .orbit-1 {
          animation: spin 8s linear infinite;
        }

        .orbit-2 {
          animation: spin-reverse 12s linear infinite;
        }

        .orbit-3 {
          animation: spin 16s linear infinite;
        }

        /* Electrons */
        .electron {
          position: absolute;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: radial-gradient(circle, #fff 0%, var(--electron-color) 70%, transparent 100%);
          box-shadow: 0 0 15px var(--electron-color);
        }

        /* Electron positioning on orbits */
        .electron-1 {
          --electron-color: #ff4fd8;
          top: -6px;
          left: 50%;
          transform: translateX(-50%);
        }

        .electron-2 {
          --electron-color: #1de3f7;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
        }

        .electron-3 {
          --electron-color: #04ff95;
          top: -6px;
          left: 50%;
          transform: translateX(-50%);
        }

        .electron-4 {
          --electron-color: #f72585;
          right: -6px;
          top: 50%;
          transform: translateY(-50%);
        }

        .electron-5 {
          --electron-color: #ff6b35;
          left: -6px;
          top: 50%;
          transform: translateY(-50%);
        }

        .electron-6 {
          --electron-color: #7209b7;
          top: -6px;
          left: 50%;
          transform: translateX(-50%);
        }

        .electron-7 {
          --electron-color: #4cc9f0;
          right: -6px;
          top: 50%;
          transform: translateY(-50%);
        }

        .electron-8 {
          --electron-color: #560bad;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
        }

        .electron-9 {
          --electron-color: #480ca8;
          left: -6px;
          top: 50%;
          transform: translateY(-50%);
        }

        /* Floating Icons - Positioned outside the atomic model */
        .floating-icon {
          position: absolute;
          width: 60px;
          height: 60px;
          background: rgba(20, 20, 20, 0.9);
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(15px);
          box-shadow: 0 0 25px rgba(255, 255, 255, 0.2);
          animation: float 6s ease-in-out infinite;
        }

        .icon-top-left {
          top: -100px;
          left: -100px;
          animation-delay: 0s;
        }

        .icon-top-right {
          top: -100px;
          right: -100px;
          animation-delay: 1.5s;
        }

        .icon-bottom-left {
          bottom: -100px;
          left: -100px;
          animation-delay: 3s;
        }

        .icon-bottom-right {
          bottom: -100px;
          right: -100px;
          animation-delay: 4.5s;
        }

        /* CTA Button Glow */
        .cta-glow {
          box-shadow: 0 0 30px rgba(255, 255, 255, 0.3);
        }

        .cta-glow:hover {
          box-shadow: 0 0 40px rgba(255, 255, 255, 0.5);
        }

        /* Animations */
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes spin-reverse {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }

        @keyframes nucleus-pulse {
          0%, 100% { 
            transform: scale(1);
            opacity: 0.8;
          }
          50% { 
            transform: scale(1.2);
            opacity: 1;
          }
        }

        @keyframes gradient-shift {
          0%, 100% { 
            background-position: 0% 50%;
          }
          50% { 
            background-position: 100% 50%;
          }
        }

        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) scale(1);
            opacity: 0.8;
          }
          50% { 
            transform: translateY(-20px) scale(1.1);
            opacity: 1;
          }
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .multicolor-text {
            font-size: 4rem;
          }
          
          .floating-icon {
            width: 50px;
            height: 50px;
          }

          .icon-top-left, .icon-top-right {
            top: -80px;
          }

          .icon-bottom-left, .icon-bottom-right {
            bottom: -80px;
          }

          .icon-top-left, .icon-bottom-left {
            left: -80px;
          }

          .icon-top-right, .icon-bottom-right {
            right: -80px;
          }
        }

        @media (max-width: 768px) {
          .multicolor-text {
            font-size: 3rem;
          }
          
          .floating-icon {
            width: 40px;
            height: 40px;
          }

          .icon-top-left, .icon-top-right {
            top: -60px;
          }

          .icon-bottom-left, .icon-bottom-right {
            bottom: -60px;
          }

          .icon-top-left, .icon-bottom-left {
            left: -60px;
          }

          .icon-top-right, .icon-bottom-right {
            right: -60px;
          }

          .electron {
            width: 8px;
            height: 8px;
          }

          .nucleus-glow {
            width: 12px;
            height: 12px;
          }
        }

        @media (max-width: 480px) {
          .multicolor-text {
            font-size: 2.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AnimatedHero;