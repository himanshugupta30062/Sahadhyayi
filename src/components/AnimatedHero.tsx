import React, { useState } from "react";
import { BookOpen, MessageCircle, Users, TrendingUp } from "lucide-react";
import { AtomicRing } from "./hero/AtomicRing";
import { OrbitingAtom } from "./hero/OrbitingAtom";
import { FloatingIcon } from "./hero/FloatingIcon";
import { HeroContent } from "./hero/HeroContent";

// Configuration constants
const RING_CONFIG = {
  outer: { radius: 340, color: "url(#dark-red-gradient)", rotation: 0, duration: 24 },
  middle: { radius: 290, color: "#22c55e", rotation: 120, duration: 24 },
  inner: { radius: 250, color: "#3b82f6", rotation: 240, duration: 24 },
};

const ATOM_CONFIG = [
  {
    letter: "L",
    label: "Library",
    materialId: "white",
    duration: 30, // Slower, more pleasant movement
    initialAngle: 0,
    orbitSwitchInterval: 20000, // Longer intervals for less chaotic movement
    size: 40,
  },
  {
    letter: "A", 
    label: "Authors",
    materialId: "white",
    duration: 25,
    initialAngle: 120,
    orbitSwitchInterval: 25000,
    size: 40,
  },
  {
    letter: "S",
    label: "Social Media", 
    materialId: "white",
    duration: 35,
    initialAngle: 240,
    orbitSwitchInterval: 30000,
    size: 40,
  },
];

const FLOATING_ICONS = [
  {
    Icon: BookOpen,
    position: { top: "12%", left: "12%" },
    color: "text-cyan-400",
    delay: 0,
  },
  {
    Icon: MessageCircle,
    position: { top: "12%", right: "12%" },
    color: "text-pink-400",
    delay: 1,
  },
  {
    Icon: Users,
    position: { bottom: "12%", left: "12%" },
    color: "text-purple-400",
    delay: 2,
  },
  {
    Icon: TrendingUp,
    position: { bottom: "12%", right: "12%" },
    color: "text-emerald-400",
    delay: 3,
  },
];

const AnimatedHero: React.FC = () => {
  const [isAnyAtomHovered, setIsAnyAtomHovered] = useState(false);
  const [occupiedOrbits, setOccupiedOrbits] = useState<Record<string, number>>({
    L: RING_CONFIG.outer.radius,
    A: RING_CONFIG.middle.radius,
    S: RING_CONFIG.inner.radius,
  });

  const updateAtomOrbit = (atomLetter: string, newOrbit: number) => {
    setOccupiedOrbits(prev => ({
      ...prev,
      [atomLetter]: newOrbit
    }));
  };

  const getAvailableOrbits = (currentAtom: string) => {
    const allOrbits = [RING_CONFIG.outer.radius, RING_CONFIG.middle.radius, RING_CONFIG.inner.radius];
    const currentAtomOrbit = occupiedOrbits[currentAtom];
    
    return allOrbits.filter(orbit => {
      // Allow current orbit or unoccupied orbits
      return orbit === currentAtomOrbit || !Object.values(occupiedOrbits).includes(orbit);
    });
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-black overflow-hidden">
      {/* Atomic Rings */}
      {Object.values(RING_CONFIG).map((ring, index) => (
        <AtomicRing
          key={index}
          radius={ring.radius}
          color={ring.color}
          rotation={ring.rotation}
          duration={ring.duration}
          isPaused={isAnyAtomHovered}
        />
      ))}

      {/* Central mask to protect content */}
      <div
        className="absolute rounded-full bg-black z-[2]"
        style={{
          width: 420,
          height: 420,
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Orbiting Atoms */}
      {ATOM_CONFIG.map((atom, index) => (
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
      {FLOATING_ICONS.map((icon, index) => (
        <FloatingIcon
          key={index}
          Icon={icon.Icon}
          position={icon.position}
          color={icon.color}
          delay={icon.delay}
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
