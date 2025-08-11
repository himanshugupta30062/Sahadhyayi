import React, { useEffect, useState } from "react";
import { BookOpen, MessageCircle, Users, TrendingUp } from "lucide-react";
import HeroAtomicRings from "./hero/HeroAtomicRings";
import { FloatingIcon } from "./hero/FloatingIcon";
import { HeroContent } from "./hero/HeroContent";

const DESKTOP_FLOATERS = [
  { Icon: BookOpen, position: { top: "12%", left: "12%" }, color: "text-cyan-400", delay: 0, size: 64 },
  { Icon: MessageCircle, position: { top: "12%", right: "12%" }, color: "text-pink-400", delay: 1, size: 64 },
  { Icon: Users, position: { bottom: "12%", left: "12%" }, color: "text-purple-400", delay: 2, size: 64 },
  { Icon: TrendingUp, position: { bottom: "12%", right: "12%" }, color: "text-emerald-400", delay: 3, size: 64 },
];

const MOBILE_FLOATERS = [
  { Icon: BookOpen, position: { top: "6%", left: "6%" }, color: "text-cyan-400", delay: 0, size: 40 },
  { Icon: MessageCircle, position: { top: "6%", right: "6%" }, color: "text-pink-400", delay: 1, size: 40 },
  { Icon: Users, position: { bottom: "6%", left: "6%" }, color: "text-purple-400", delay: 2, size: 40 },
  { Icon: TrendingUp, position: { bottom: "6%", right: "6%" }, color: "text-emerald-400", delay: 3, size: 40 },
];

const AnimatedHero: React.FC = () => {
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateScreenSize = () => {
      setScreenSize({ 
        width: window.innerWidth, 
        height: window.innerHeight 
      });
    };
    
    updateScreenSize();
    window.addEventListener("resize", updateScreenSize);
    return () => window.removeEventListener("resize", updateScreenSize);
  }, []);

  // Responsive sizing based on screen dimensions
  const getResponsiveSize = () => {
    const { width, height } = screenSize;
    const minDimension = Math.min(width, height);
    
    if (width < 480) return Math.min(320, minDimension * 0.85); // Extra small phones
    if (width < 768) return Math.min(400, minDimension * 0.9);  // Small phones
    if (width < 1024) return Math.min(500, minDimension * 0.8); // Tablets
    return Math.min(720, minDimension * 0.75); // Desktop
  };

  const isMobile = screenSize.width < 768;
  const isSmallMobile = screenSize.width < 480;
  const heroSize = getResponsiveSize();
  
  const FLOATERS = isMobile ? MOBILE_FLOATERS : DESKTOP_FLOATERS;

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-black overflow-hidden">
      {/* RINGS, ATOMS & CENTER CONTENT */}
      <div className="absolute inset-0 flex items-center justify-center">
        <HeroAtomicRings 
          size={heroSize}
          isMobile={isMobile}
          isSmallMobile={isSmallMobile}
        >
          <HeroContent />
        </HeroAtomicRings>
      </div>

      {/* FLOATING ICONS */}
      {FLOATERS.map((icon, i) => (
        <FloatingIcon
          key={i}
          Icon={icon.Icon}
          position={icon.position}
          color={icon.color}
          delay={icon.delay}
          size={icon.size}
        />
      ))}

      {/* GLOBAL STYLES */}
      <style>{`
        .animate-gradient-shift { background-size: 200% 200%; animation: gradient-shift 3s ease infinite; }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }
        @media (max-width: 768px) { .max-w-sm { max-width: 90vw; } }
      `}</style>
    </div>
  );
};

export default AnimatedHero;

