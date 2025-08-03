import React, { useState, useEffect } from "react";
import { BookOpen, MessageCircle, Users, TrendingUp } from "lucide-react";
import { AtomicRing } from "./hero/AtomicRing";
import { OrbitingAtom } from "./hero/OrbitingAtom";
import { FloatingIcon } from "./hero/FloatingIcon";
import { HeroContent } from "./hero/HeroContent";

// Desktop configuration
const DESKTOP_RING_CONFIG = {
  outer: { radius: 340, color: "url(#dark-red-gradient)", rotation: 0, duration: 12 },
  middle: { radius: 290, color: "#22c55e", rotation: 120, duration: 10 },
  inner: { radius: 250, color: "#3b82f6", rotation: 240, duration: 8 },
};

const DESKTOP_ATOM_CONFIG = [
  {
    letter: "L",
    label: "Library",
    materialId: "library",
    duration: 12,
    initialAngle: 0,
    orbitSwitchInterval: 20000,
    size: 40,
  },
  {
    letter: "A",
    label: "Authors",
    materialId: "author",
    duration: 10,
    initialAngle: 120,
    orbitSwitchInterval: 25000,
    size: 40,
  },
  {
    letter: "S",
    label: "Social Media",
    materialId: "social",
    duration: 8,
    initialAngle: 240,
    orbitSwitchInterval: 30000,
    size: 40,
  },
];

const DESKTOP_FLOATING_ICONS = [
  {
    Icon: BookOpen,
    position: { top: "12%", left: "12%" },
    color: "text-cyan-400",
    delay: 0,
    size: 64,
  },
  {
    Icon: MessageCircle,
    position: { top: "12%", right: "12%" },
    color: "text-pink-400",
    delay: 1,
    size: 64,
  },
  {
    Icon: Users,
    position: { bottom: "12%", left: "12%" },
    color: "text-purple-400",
    delay: 2,
    size: 64,
  },
  {
    Icon: TrendingUp,
    position: { bottom: "12%", right: "12%" },
    color: "text-emerald-400",
    delay: 3,
    size: 64,
  },
];

// Mobile configuration
const MOBILE_RING_CONFIG = {
  outer: { radius: 310, color: "url(#dark-red-gradient)", rotation: 0, duration: 12 },
  middle: { radius: 260, color: "#22c55e", rotation: 120, duration: 10 },
  inner: { radius: 220, color: "#3b82f6", rotation: 240, duration: 8 },
};

const MOBILE_ATOM_CONFIG = [
  {
    letter: "L",
    label: "Library",
    materialId: "library",
    duration: 12,
    initialAngle: 0,
    orbitSwitchInterval: 20000,
    size: 24,
  },
  {
    letter: "A",
    label: "Authors",
    materialId: "author",
    duration: 10,
    initialAngle: 120,
    orbitSwitchInterval: 25000,
    size: 24,
  },
  {
    letter: "S",
    label: "Social Media",
    materialId: "social",
    duration: 8,
    initialAngle: 240,
    orbitSwitchInterval: 30000,
    size: 24,
  },
];

const MOBILE_FLOATING_ICONS = [
  {
    Icon: BookOpen,
    position: { top: "8%", left: "8%" },
    color: "text-cyan-400",
    delay: 0,
    size: 48,
  },
  {
    Icon: MessageCircle,
    position: { top: "8%", right: "8%" },
    color: "text-pink-400",
    delay: 1,
    size: 48,
  },
  {
    Icon: Users,
    position: { bottom: "8%", left: "8%" },
    color: "text-purple-400",
    delay: 2,
    size: 48,
  },
  {
    Icon: TrendingUp,
    position: { bottom: "8%", right: "8%" },
    color: "text-emerald-400",
    delay: 3,
    size: 48,
  },
];

const AnimatedHero: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const ringConfig = isMobile ? MOBILE_RING_CONFIG : DESKTOP_RING_CONFIG;
  const atomConfig = isMobile ? MOBILE_ATOM_CONFIG : DESKTOP_ATOM_CONFIG;
  const floatingIcons = isMobile ? MOBILE_FLOATING_ICONS : DESKTOP_FLOATING_ICONS;
  const ringStroke = isMobile ? 16 : 28;
  const maskSize = ringConfig.inner.radius * 2 - 80;

  const [isAnyAtomHovered, setIsAnyAtomHovered] = useState(false);
  const [occupiedOrbits, setOccupiedOrbits] = useState<Record<string, number>>({
    L: ringConfig.outer.radius,
    A: ringConfig.middle.radius,
    S: ringConfig.inner.radius,
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setOccupiedOrbits({
      L: ringConfig.outer.radius,
      A: ringConfig.middle.radius,
      S: ringConfig.inner.radius,
    });
  }, [ringConfig]);

  const updateAtomOrbit = (atomLetter: string, newOrbit: number) => {
    setOccupiedOrbits(prev => ({
      ...prev,
      [atomLetter]: newOrbit
    }));
  };

  const getAvailableOrbits = (currentAtom: string) => {
    const allOrbits = [ringConfig.outer.radius, ringConfig.middle.radius, ringConfig.inner.radius];
    const currentAtomOrbit = occupiedOrbits[currentAtom];
    
    return allOrbits.filter(orbit => {
      // Allow current orbit or unoccupied orbits
      return orbit === currentAtomOrbit || !Object.values(occupiedOrbits).includes(orbit);
    });
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-black overflow-hidden">
      {/* Atomic Rings */}
      {Object.values(ringConfig).map((ring, index) => (
        <AtomicRing
          key={index}
          radius={ring.radius}
          color={ring.color}
          rotation={ring.rotation}
          duration={ring.duration}
          strokeWidth={ringStroke}
          isPaused={isAnyAtomHovered}
        />
      ))}

      {/* Central mask to protect content */}
      <div
        className="absolute rounded-full bg-black z-[2]"
        style={{
          width: maskSize,
          height: maskSize,
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Orbiting Atoms */}
      {atomConfig.map((atom) => (
        <OrbitingAtom
          key={atom.letter}
          orbitRadius={occupiedOrbits[atom.letter]}
          letter={atom.letter}
          label={atom.label}
          materialId={atom.materialId}
          duration={atom.duration}
          initialAngle={atom.initialAngle}
          availableOrbits={getAvailableOrbits(atom.letter)}
          orbitSwitchInterval={atom.orbitSwitchInterval}
          size={atom.size}
          onHoverChange={setIsAnyAtomHovered}
          onOrbitChange={(newOrbit) => updateAtomOrbit(atom.letter, newOrbit)}
        />
      ))}

      {/* Floating Icons */}
      {floatingIcons.map((icon, index) => (
        <FloatingIcon
          key={index}
          Icon={icon.Icon}
          position={icon.position}
          color={icon.color}
          delay={icon.delay}
          size={icon.size}
        />
      ))}

      {/* Central Content */}
      <HeroContent />

      {/* Global animations */}
      <style>{`
        .animate-gradient-shift {
          background-size: 200% 200%;
          animation: gradient-shift 3s ease infinite;
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @media (max-width: 768px) {
          .max-w-sm { max-width: 90vw; }
        }
      `}</style>
    </div>
  );
};

export default AnimatedHero;
