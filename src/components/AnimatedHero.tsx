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
    duration: 8, // Faster speed
    initialAngle: 0,
    orbitSwitchInterval: 20000,
    size: 44,
  },
  {
    letter: "A",
    label: "Authors",
    materialId: "author",
    duration: 6, // Faster speed
    initialAngle: 120,
    orbitSwitchInterval: 25000,
    size: 44,
  },
  {
    letter: "S",
    label: "Social Media",
    materialId: "social",
    duration: 5, // Fastest speed
    initialAngle: 240,
    orbitSwitchInterval: 30000,
    size: 44,
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

// Mobile configuration (adjusted to keep text clear of the rings)
const MOBILE_RING_CONFIG = {
  outer: { radius: 280, color: "url(#dark-red-gradient)", rotation: 0, duration: 24 },
  middle: { radius: 230, color: "#22c55e", rotation: 120, duration: 20 },
  inner: { radius: 180, color: "#3b82f6", rotation: 240, duration: 16 },
};

const MOBILE_ATOM_CONFIG = [
  {
    letter: "L",
    label: "Library",
    materialId: "library",
    duration: 8, // Faster speed
    initialAngle: 0,
    orbitSwitchInterval: 20000,
    size: 28,
  },
  {
    letter: "A",
    label: "Authors",
    materialId: "author",
    duration: 6, // Faster speed
    initialAngle: 120,
    orbitSwitchInterval: 25000,
    size: 28,
  },
  {
    letter: "S",
    label: "Social Media",
    materialId: "social",
    duration: 5, // Fastest speed
    initialAngle: 240,
    orbitSwitchInterval: 30000,
    size: 28,
  },
];

const MOBILE_FLOATING_ICONS = [
  {
    Icon: BookOpen,
    position: { top: "6%", left: "6%" },
    color: "text-cyan-400",
    delay: 0,
    size: 40,
  },
  {
    Icon: MessageCircle,
    position: { top: "6%", right: "6%" },
    color: "text-pink-400",
    delay: 1,
    size: 40,
  },
  {
    Icon: Users,
    position: { bottom: "6%", left: "6%" },
    color: "text-purple-400",
    delay: 2,
    size: 40,
  },
  {
    Icon: TrendingUp,
    position: { bottom: "6%", right: "6%" },
    color: "text-emerald-400",
    delay: 3,
    size: 40,
  },
];

const AnimatedHero: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const ringConfig = isMobile ? MOBILE_RING_CONFIG : DESKTOP_RING_CONFIG;
  const atomConfig = isMobile ? MOBILE_ATOM_CONFIG : DESKTOP_ATOM_CONFIG;
  const floatingIcons = isMobile ? MOBILE_FLOATING_ICONS : DESKTOP_FLOATING_ICONS;
  const ringStroke = isMobile ? 10 : 28; // Thinner rings for mobile
  // Maintain consistent spacing between the inner ring and the central content mask
  const maskSize = 2 * (ringConfig.inner.radius - ringStroke / 2 - 26);

  const [isAnyAtomHovered, setIsAnyAtomHovered] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isTabHidden, setIsTabHidden] = useState(false);
  // Align atoms with ring stroke by using the ring radius minus half the stroke width
  const [occupiedOrbits, setOccupiedOrbits] = useState<Record<string, number>>({
    L: ringConfig.outer.radius - ringStroke / 2,
    A: ringConfig.middle.radius - ringStroke / 2,
    S: ringConfig.inner.radius - ringStroke / 2,
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // prefers-reduced-motion (optional)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setIsReducedMotion(mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  // pause when tab not visible (optional)
  useEffect(() => {
    const onVis = () => setIsTabHidden(document.hidden);
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    setOccupiedOrbits({
      L: ringConfig.outer.radius - ringStroke / 2,
      A: ringConfig.middle.radius - ringStroke / 2,
      S: ringConfig.inner.radius - ringStroke / 2,
    });
  }, [ringConfig, ringStroke]);

  const updateAtomOrbit = (atomLetter: string, newOrbit: number) => {
    setOccupiedOrbits(prev => ({
      ...prev,
      [atomLetter]: newOrbit
    }));
  };

  const getAvailableOrbits = (currentAtom: string) => {
    const allOrbits = [
      ringConfig.outer.radius - ringStroke / 2,
      ringConfig.middle.radius - ringStroke / 2,
      ringConfig.inner.radius - ringStroke / 2,
    ];
    const currentAtomOrbit = occupiedOrbits[currentAtom];
    
    return allOrbits.filter(orbit => {
      // Allow current orbit or unoccupied orbits
      return orbit === currentAtomOrbit || !Object.values(occupiedOrbits).includes(orbit);
    });
  };

  const isPaused = isAnyAtomHovered || isReducedMotion || isTabHidden;

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
          isPaused={isPaused}
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
          isPaused={isPaused}
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
