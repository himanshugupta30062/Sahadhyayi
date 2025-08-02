import React from "react";
import { Link } from "react-router-dom";
import { BookOpen, MessageCircle, Users } from "lucide-react";

const atomLabels = [
  { label: "L", tooltip: "Library", orbit: "outer", pos: { top: "-32px", left: "50%", translateX: "-50%", translateY: "0" } },
  { label: "S", tooltip: "Social Media", orbit: "middle", pos: { bottom: "-32px", left: "82%", translateX: "-50%", translateY: "0" } },
  { label: "A", tooltip: "Authors", orbit: "inner", pos: { bottom: "-32px", left: "16%", translateX: "-50%", translateY: "0" } },
];

const iconData = [
  { icon: <BookOpen size={28} />, style: "top-[13%] left-[18%]", delay: "" },
  { icon: <MessageCircle size={28} />, style: "top-[13%] right-[18%]", delay: "delay-1000" },
  { icon: <Users size={28} />, style: "bottom-[10%] left-1/2 -translate-x-1/2", delay: "delay-2000" },
];

const AnimatedHero = () => (
  <div className="relative flex items-center justify-center min-h-screen bg-black overflow-hidden">

    {/* Atomic-style rotating rings */}
    <div
      className="absolute w-[820px] h-[820px] rounded-full animate-spin-slow ring-outer"
      style={{ willChange: 'transform', transformOrigin: 'center' }}
    />
    <div
      className="absolute w-[690px] h-[690px] rounded-full animate-spin-reverse ring-middle"
      style={{ willChange: 'transform', transformOrigin: 'center' }}
    />
    <div
      className="absolute w-[560px] h-[560px] rounded-full animate-spin-slower ring-inner"
      style={{ willChange: 'transform', transformOrigin: 'center' }}
    />

    {/* Rotating atom labels with tooltips */}
    <div className="absolute w-[820px] h-[820px] animate-spin-slow pointer-events-none">
      <div
        className="absolute group"
        style={{
          top: atomLabels[0].pos.top,
          left: atomLabels[0].pos.left,
          transform: `translate(${atomLabels[0].pos.translateX},${atomLabels[0].pos.translateY})`,
          pointerEvents: "auto"
        }}
      >
        <span className="text-white bg-gray-800 px-3 py-2 rounded-full cursor-pointer relative shadow-lg">
          {atomLabels[0].label}
          <span className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white text-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-20 whitespace-nowrap">
            {atomLabels[0].tooltip}
          </span>
        </span>
      </div>
    </div>
    <div className="absolute w-[690px] h-[690px] animate-spin-reverse pointer-events-none">
      <div
        className="absolute group"
        style={{
          bottom: atomLabels[1].pos.bottom,
          left: atomLabels[1].pos.left,
          transform: `translate(${atomLabels[1].pos.translateX},${atomLabels[1].pos.translateY})`,
          pointerEvents: "auto"
        }}
      >
        <span className="text-white bg-gray-800 px-3 py-2 rounded-full cursor-pointer relative shadow-lg">
          {atomLabels[1].label}
          <span className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white text-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-20 whitespace-nowrap">
            {atomLabels[1].tooltip}
          </span>
        </span>
      </div>
    </div>
    <div className="absolute w-[560px] h-[560px] animate-spin-slower pointer-events-none">
      <div
        className="absolute group"
        style={{
          bottom: atomLabels[2].pos.bottom,
          left: atomLabels[2].pos.left,
          transform: `translate(${atomLabels[2].pos.translateX},${atomLabels[2].pos.translateY})`,
          pointerEvents: "auto"
        }}
      >
        <span className="text-white bg-gray-800 px-3 py-2 rounded-full cursor-pointer relative shadow-lg">
          {atomLabels[2].label}
          <span className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white text-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-20 whitespace-nowrap">
            {atomLabels[2].tooltip}
          </span>
        </span>
      </div>
    </div>

    {/* Three glowing, animated icons */}
    {iconData.map((icon, i) => (
      <div
        key={i}
        className={`absolute w-12 h-12 flex items-center justify-center rounded-full bg-black/60 shadow-2xl animate-fade-pulse ${icon.style} ${icon.delay}`}
      >
        {icon.icon}
      </div>
    ))}

    {/* Central headline and call to action */}
    <div className="relative z-10 text-center max-w-[370px] px-6">
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
        <button className="px-8 py-3 bg-white text-black rounded-full font-semibold hover:bg-gray-100 transition-all duration-300 flex items-center justify-center gap-2 shadow-md">
          <span role="img" aria-label="Book">📚</span> Explore the Library
        </button>
      </Link>
    </div>

    {/* Animation keyframes and styles */}
    <style>{`
      .ring-outer {
        border: 22px solid transparent;
        border-top-color: #d946ef;
        border-right-color: #22d3ee;
      }
      .ring-middle {
        border: 18px solid transparent;
        border-top-color: #06b6d4;
        border-left-color: #a21caf;
      }
      .ring-inner {
        border: 14px solid transparent;
        border-bottom-color: #818cf8;
        border-left-color: #a21caf;
      }

      .animate-spin-slow { animation: spin 18s linear infinite; }
      .animate-spin-reverse { animation: spin-reverse 14s linear infinite; }
      .animate-spin-slower { animation: spin 22s linear infinite; }
      .animate-fade-pulse { animation: fadePulse 3s cubic-bezier(.4,0,.2,1) infinite alternate; }
      .delay-1000 { animation-delay: 1s; }
      .delay-2000 { animation-delay: 2s; }

      @keyframes spin {
        0% { transform: rotate(0deg);}
        100% { transform: rotate(360deg);}
      }
      @keyframes spin-reverse {
        0% { transform: rotate(0deg);}
        100% { transform: rotate(-360deg);}
      }
      @keyframes fadePulse {
        0% { opacity: 0.18; box-shadow: 0 0 10px #fff;}
        100% { opacity: 1; box-shadow: 0 0 32px #fff;}
      }
      @media (max-width: 900px) {
        .w-[820px], .w-[690px], .w-[560px] { width: 94vw; height: 94vw; }
      }
    `}</style>
  </div>
);

export default AnimatedHero;
