import React, { useEffect, useState } from "react";
import { BookOpen, MessageCircle, Users, TrendingUp } from "lucide-react";
import { AtomicRing } from "./hero/AtomicRing";
import { OrbitingAtom } from "./hero/OrbitingAtom";
import { FloatingIcon } from "./hero/FloatingIcon";
import { HeroContent } from "./hero/HeroContent";

// desktop: radii, thinner strokes & custom gradients
const DESKTOP_RING_CONFIG = {
  outer:  {
    radius: 340,
    colors: ["#20E0D2", "#13C296", "#FF3EA5"],
    rotation: 0,
    duration: 12,
    stroke: 16,
    glow: 2.8,
    gradientAngle: 0,
  },
  middle: {
    radius: 290,
    colors: ["#0B1E3A", "#1B68FF"],
    rotation: 120,
    duration: 10,
    stroke: 12,
    glow: 2.3,
    gradientAngle: 120,
  },
  inner:  {
    radius: 250,
    colors: ["#1AD1B9", "#19A0F5"],
    rotation: 240,
    duration: 8,
    stroke: 8,
    glow: 2.0,
    gradientAngle: 240,
  },
};

const DESKTOP_ATOMS = [
  { letter: "L", label: "Library",      materialId: "library", initialAngle:  0,  size: 46 },
  { letter: "A", label: "Authors",      materialId: "author",  initialAngle: 120, size: 46 },
  { letter: "S", label: "Social Media", materialId: "social",  initialAngle: 240, size: 46 },
];

const DESKTOP_FLOATERS = [
  { Icon: BookOpen,     position: { top: "12%",  left: "12%"  }, color: "text-cyan-400",   delay: 0, size: 64 },
  { Icon: MessageCircle,position: { top: "12%",  right:"12%"  }, color: "text-pink-400",   delay: 1, size: 64 },
  { Icon: Users,        position: { bottom:"12%",left: "12%"  }, color: "text-purple-400", delay: 2, size: 64 },
  { Icon: TrendingUp,   position: { bottom:"12%",right:"12%"  }, color: "text-emerald-400",delay: 3, size: 64 },
];

// mobile: smaller radii & even slimmer strokes
const MOBILE_RING_CONFIG = {
  outer:  {
    radius: 280,
    colors: ["#20E0D2", "#13C296", "#FF3EA5"],
    rotation: 0,
    duration: 24,
    stroke: 12,
    glow: 2.2,
    gradientAngle: 0,
  },
  middle: {
    radius: 230,
    colors: ["#0B1E3A", "#1B68FF"],
    rotation: 120,
    duration: 20,
    stroke: 8,
    glow: 2.0,
    gradientAngle: 120,
  },
  inner:  {
    radius: 180,
    colors: ["#1AD1B9", "#19A0F5"],
    rotation: 240,
    duration: 16,
    stroke: 6,
    glow: 1.8,
    gradientAngle: 240,
  },
};
const MOBILE_ATOMS = [
  { letter: "L", label: "Library",      materialId: "library", initialAngle:  0,  size: 32 },
  { letter: "A", label: "Authors",      materialId: "author",  initialAngle: 120, size: 32 },
  { letter: "S", label: "Social Media", materialId: "social",  initialAngle: 240, size: 32 },
];
const MOBILE_FLOATERS = [
  { Icon: BookOpen,     position: { top: "6%",  left: "6%"  },  color: "text-cyan-400",   delay: 0, size: 40 },
  { Icon: MessageCircle,position: { top: "6%",  right:"6%"  },  color: "text-pink-400",   delay: 1, size: 40 },
  { Icon: Users,        position: { bottom:"6%",left: "6%"  },  color: "text-purple-400", delay: 2, size: 40 },
  { Icon: TrendingUp,   position: { bottom:"6%",right:"6%"  },  color: "text-emerald-400",delay: 3, size: 40 },
];

const AnimatedHero: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isAnyAtomHovered, setIsAnyAtomHovered] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isTabHidden, setIsTabHidden] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize(); window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setIsReducedMotion(mq.matches);
    onChange(); mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  useEffect(() => {
    const onVis = () => setIsTabHidden(document.hidden);
    onVis(); document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const RC = isMobile ? MOBILE_RING_CONFIG : DESKTOP_RING_CONFIG;
  const ATOMS = isMobile ? MOBILE_ATOMS : DESKTOP_ATOMS;
  const FLOATERS = isMobile ? MOBILE_FLOATERS : DESKTOP_FLOATERS;

  // keep text safely inside the inner ring
  const maskSize = 2 * (RC.inner.radius - RC.inner.stroke / 2 - 36);

  // speed sync: atoms traverse 180° while ring rotates 360°
  const durationFactor = isReducedMotion ? 1.3 : 1;
  const ringSpeedBoost = 1.35; // subtle nudge; atoms stay synced automatically
  const pausedRings = isTabHidden;
  const pausedAtoms = isAnyAtomHovered || isTabHidden;

  const eff = (base: number) => Math.max(2, (base * durationFactor) / ringSpeedBoost);
  const effOuter  = eff(RC.outer.duration);
  const effMiddle = eff(RC.middle.duration);
  const effInner  = eff(RC.inner.duration);

  const orbitRadii: Record<string, number> = {
    L: RC.outer.radius,
    A: RC.middle.radius,
    S: RC.inner.radius,
  };
  const ringKeyByAtom: Record<string, "outer" | "middle" | "inner"> = { L: "outer", A: "middle", S: "inner" };
  const effByKey: Record<"outer"|"middle"|"inner", number> = {
    outer: effOuter,
    middle: effMiddle,
    inner: effInner,
  };
  const strokeByKey: Record<"outer"|"middle"|"inner", number> = {
    outer: RC.outer.stroke,
    middle: RC.middle.stroke,
    inner: RC.inner.stroke,
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-black overflow-hidden">
      {/* RINGS */}
      {[
        { cfg: RC.outer },
        { cfg: RC.middle },
        { cfg: RC.inner },
      ].map(({ cfg }) => (
        <AtomicRing
          key={cfg.radius}
          radius={cfg.radius}
          colors={cfg.colors}
          rotation={cfg.rotation}
          duration={eff(cfg.duration)}
          strokeWidth={cfg.stroke}
          gapDegrees={12}
          glow={cfg.glow}
          gradientAngle={cfg.gradientAngle}
          isPaused={pausedRings}
        />
      ))}

      {/* CENTER MASK */}
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

      {/* ATOMS (locked to ring, synced) */}
      {ATOMS.map((atom) => {
        const key = ringKeyByAtom[atom.letter];
        const atomDuration = Math.max(1, effByKey[key] / 2); // half of ring duration
        return (
          <OrbitingAtom
            key={atom.letter}
            orbitRadius={orbitRadii[atom.letter]}
            letter={atom.letter}
            label={atom.label}
            materialId={atom.materialId}
            duration={atomDuration}
            initialAngle={atom.initialAngle}
            size={atom.size}
            strokeWidth={strokeByKey[key]}
            availableOrbits={[]} // keep fixed for premium, steady look
            onHoverChange={setIsAnyAtomHovered}
          />
        );
      })}

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
