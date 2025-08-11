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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const FLOATERS = isMobile ? MOBILE_FLOATERS : DESKTOP_FLOATERS;

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-black overflow-hidden">
      {/* RINGS & ATOMS */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <HeroAtomicRings size={isMobile ? 360 : 720} />
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

      {/* CENTER CONTENT */}
      <HeroContent />

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

