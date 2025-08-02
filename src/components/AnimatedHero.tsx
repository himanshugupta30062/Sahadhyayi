import React from "react";
import { Link } from "react-router-dom";
import { BookOpen, MessageCircle, Users, TrendingUp } from "lucide-react";

// ARC SETTINGS
const arcWidth = 28;
const arcGap = 18;

const sizeOuter = 600;
const sizeMiddle = sizeOuter - 2 * (arcWidth + arcGap); // 600 - 2*46 = 508
const sizeInner = sizeMiddle - 2 * (arcWidth + arcGap); // 508 - 2*46 = 416

// SVG Arc Helper
function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const arcSweep = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M", start.x, start.y,
    "A", r, r, 0, arcSweep, 0, end.x, end.y
  ].join(" ");
}
function polarToCartesian(cx, cy, r, angleInDegrees) {
  const angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;
  return {
    x: cx + (r * Math.cos(angleInRadians)),
    y: cy + (r * Math.sin(angleInRadians))
  };
}
const Arc = ({radius, color, rotate, duration, z=0}) => (
  <svg
    width={radius*2}
    height={radius*2}
    style={{
      position: "absolute",
      left: `calc(50% - ${radius}px)`,
      top: `calc(50% - ${radius}px)`,
      transform: `rotate(${rotate}deg)`,
      zIndex: z,
      pointerEvents: "none",
      animation: `orbit ${duration}s linear infinite`
    }}
  >
    <path
      d={describeArc(radius, radius, radius-arcWidth/2, 0, 180)}
      fill="none"
      stroke={color}
      strokeWidth={arcWidth}
      strokeLinecap="round"
      style={{ filter: `drop-shadow(0 0 12px ${color})` }}
    />
    <style>{`
      @keyframes orbit { 100% { transform: rotate(${360+rotate}deg); } }
    `}</style>
  </svg>
);

// Orbiting Atoms with Tooltips
const Atom = ({
  orbitSize, letter, label, bg, textColor, duration, startAngle
}) => {
  // Convert polar to cartesian for atom placement (on half arc)
  const angleRad = (startAngle-90) * Math.PI / 180;
  const left = `calc(50% + ${(orbitSize/2) * Math.cos(angleRad)}px)`;
  const top = `calc(50% + ${(orbitSize/2) * Math.sin(angleRad)}px)`;
  return (
    <div style={{
      position: "absolute",
      left, top,
      zIndex: 5,
      animation: `orbit-atom ${duration}s linear infinite`
    }}>
      <div className="group relative">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xl font-bold text-lg cursor-pointer ${bg} ${textColor}`}>
          {letter}
          <span className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white text-black px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-20 whitespace-nowrap text-sm">
            {label}
          </span>
        </div>
      </div>
      <style>{`
        @keyframes orbit-atom {
          0% { transform: rotate(0deg) translateY(0px);}
          100% { transform: rotate(360deg) translateY(0px);}
        }
      `}</style>
    </div>
  );
};

const AnimatedHero = () => (
  <div className="relative flex items-center justify-center min-h-screen bg-black overflow-hidden">

    {/* SVG Arcs - Red, Green, Blue */}
    <Arc radius={sizeOuter/2} color="#ef4444" rotate={0} duration={24} />   {/* Red */}
    <Arc radius={sizeMiddle/2} color="#22c55e" rotate={36} duration={18} /> {/* Green */}
    <Arc radius={sizeInner/2} color="#3b82f6" rotate={64} duration={14} />  {/* Blue */}

    {/* Black mask: protects center text area */}
    <div
      className="absolute rounded-full bg-black z-[2]"
      style={{
        width: 320, height: 320,
        left: "50%", top: "50%",
        transform: "translate(-50%, -50%)"
      }}
    />

    {/* Atoms on their orbits */}
    <Atom
      orbitSize={sizeOuter-arcWidth/2}
      letter="L"
      label="Library"
      bg="bg-red-500"
      textColor="text-white"
      duration={24}
      startAngle={0}
    />
    <Atom
      orbitSize={sizeMiddle-arcWidth/2}
      letter="S"
      label="Social Media"
      bg="bg-green-500"
      textColor="text-white"
      duration={18}
      startAngle={180}
    />
    <Atom
      orbitSize={sizeInner-arcWidth/2}
      letter="A"
      label="Authors"
      bg="bg-blue-500"
      textColor="text-white"
      duration={14}
      startAngle={90}
    />

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
    <div className="relative z-10 text-center max-w-[300px] px-6 py-8 mx-auto"
      style={{
        minHeight: 250,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <h1 className="text-5xl font-bold mb-4">
        <span className="text-transparent bg-gradient-to-r from-red-500 via-green-500 to-blue-500 bg-clip-text animate-gradient-shift">
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
        <button className="px-8 py-4 bg-gradient-to-r from-red-500 via-green-500 to-blue-500 text-white rounded-full font-semibold hover:from-red-600 hover:to-blue-600 transition-all duration-300 flex items-center justify-center gap-3 shadow-xl mx-auto text-lg">
          <span role="img" aria-label="Book">📚</span>
          Explore the Library
        </button>
      </Link>
    </div>

    {/* Animations, delays, and responsive tweaks */}
    <style>{`
      .animate-float {
        animation: float 6s ease-in-out infinite;
      }
      .animation-delay-1000 { animation-delay: 1s; }
      .animation-delay-2000 { animation-delay: 2s; }
      .animation-delay-3000 { animation-delay: 3s; }
      .animate-gradient-shift {
        background-size: 200% 200%;
        animation: gradient-shift 3s ease infinite;
      }
      @keyframes float {
        0%, 100% { transform: translateY(0px) scale(1); box-shadow: 0 0 20px rgba(255,255,255,0.1);}
        50% { transform: translateY(-10px) scale(1.05); box-shadow: 0 0 30px rgba(255,255,255,0.3);}
      }
      @keyframes gradient-shift {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
      @media (max-width: 900px) {
        .max-w-[300px] { max-width: 80vw; }
      }
      @media (max-width: 600px) {
        .max-w-[300px] { max-width: 92vw; }
      }
    `}</style>
  </div>
);

export default AnimatedHero;
