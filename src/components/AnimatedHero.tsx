import React from "react";
import { Link } from "react-router-dom";

const AnimatedHero = () => {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-black overflow-hidden">
      <div className="relative w-full max-w-[600px] md:max-w-[700px] aspect-square mx-auto perspective">
        <div className="absolute inset-0 ring-common ring-outer pointer-events-none" />
        <div className="absolute inset-[15%] ring-common ring-middle pointer-events-none" />
        <div className="absolute inset-[30%] ring-common ring-inner pointer-events-none" />

        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center px-4 z-10">
          <h1 className="text-5xl font-bold mb-4 leading-tight">
            <span className="multicolor-text">Sahadhyayi</span>
          </h1>
          <p className="text-xl text-white font-medium mb-4">The Book Social Media</p>
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
        .perspective { perspective: 1000px; }
        .ring-common {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 8px solid transparent;
          background: conic-gradient(from 0deg, transparent 0deg, var(--ring-color) 30deg, var(--ring-color) 210deg, transparent 240deg, transparent 360deg);
          -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          filter: drop-shadow(0 0 20px var(--ring-glow));
          transform-style: preserve-3d;
          pointer-events: none;
        }
        .ring-outer {
          --ring-color: #1de3f7;
          --ring-glow: rgba(29,227,247,0.6);
          animation: orbit1 15s linear infinite;
        }
        .ring-middle {
          --ring-color: #04ff95;
          --ring-glow: rgba(4,255,149,0.6);
          animation: orbit2 12s linear infinite;
        }
        .ring-inner {
          --ring-color: #ff4fd8;
          --ring-glow: rgba(255,79,216,0.6);
          animation: orbit3 8s linear infinite;
        }
        @keyframes orbit1 {
          from { transform: rotateX(65deg) rotateZ(0deg); }
          to { transform: rotateX(65deg) rotateZ(360deg); }
        }
        @keyframes orbit2 {
          from { transform: rotateY(55deg) rotateZ(0deg); }
          to { transform: rotateY(55deg) rotateZ(-360deg); }
        }
        @keyframes orbit3 {
          from { transform: rotateX(45deg) rotateY(20deg) rotateZ(0deg); }
          to { transform: rotateX(45deg) rotateY(20deg) rotateZ(360deg); }
        }
        .multicolor-text {
          font-size: 4rem;
          font-weight: 900;
          background: linear-gradient(90deg, #ff4fd8, #1de3f7, #5d5fef, #04ff95, #ff6b35, #f72585, #4cc9f0, #7209b7, #560bad, #480ca8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        @media (max-width: 768px) {
          .ring-common { border-width: 4px; }
          .multicolor-text { font-size: 2.5rem; }
        }
      `}</style>
    </div>
  );
};

export default AnimatedHero;

