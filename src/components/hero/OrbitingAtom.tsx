import React, { useEffect, useMemo, useRef, useState } from "react";
import { ATOM_MATERIALS } from "./AtomMaterials";
import { AtomShell } from "./AtomShell";

interface OrbitingAtomProps {
  orbitRadius: number;            // ring radius passed from AnimatedHero
  letter: string;                 // "L" | "A" | "S"
  label: string;                  // accessibility label
  materialId: string;             // "library" | "author" | "social"
  duration: number;               // seconds per full half-orbit loop
  initialAngle: number;           // degrees (maps into the -90..+90 range)
  availableOrbits?: number[];     // optional: list of radii
  orbitSwitchInterval?: number;   // optional: ms between orbit hops (disabled by default)
  size?: number;                  // px diameter of the atom
  strokeWidth?: number;           // ring stroke (to align to visual center)
  onHoverChange?: (isHovered: boolean) => void;
  onOrbitChange?: (newOrbit: number) => void;
}

export const OrbitingAtom: React.FC<OrbitingAtomProps> = ({
  orbitRadius,
  letter,
  label,
  materialId,
  duration,
  initialAngle,
  availableOrbits = [],
  orbitSwitchInterval,            // leave undefined to disable auto-switch
  size = 44,
  strokeWidth = 28,
  onHoverChange,
  onOrbitChange,
}) => {
  const material = useMemo(() => ATOM_MATERIALS[materialId], [materialId]);

  // internal state/refs
  const [isHovered, setIsHovered] = useState(false);
  const [currentOrbit, setCurrentOrbit] = useState(orbitRadius);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const atomRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const angleDegRef = useRef<number>(normalizeToHalf(initialAngle));
  const hiddenRef = useRef<boolean>(false);
  const switchTimerRef = useRef<number | null>(null);

  // keep orbit in sync with prop
  useEffect(() => {
    if (orbitRadius !== currentOrbit) setCurrentOrbit(orbitRadius);
  }, [orbitRadius]);

  // handle tab visibility (pause)
  useEffect(() => {
    const onVis = () => (hiddenRef.current = document.hidden);
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // optional orbit switching (disabled unless interval provided)
  useEffect(() => {
    if (!orbitSwitchInterval || availableOrbits.length < 2) return;
    const tick = () => {
      const idx = Math.max(0, availableOrbits.indexOf(currentOrbit));
      const next = availableOrbits[(idx + 1) % availableOrbits.length];
      setCurrentOrbit(next);
      onOrbitChange?.(next);
      // keep angle continuous; nothing else to do
      switchTimerRef.current = window.setTimeout(tick, orbitSwitchInterval);
    };
    switchTimerRef.current = window.setTimeout(tick, orbitSwitchInterval);
    return () => {
      if (switchTimerRef.current) window.clearTimeout(switchTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orbitSwitchInterval, availableOrbits, currentOrbit]);

  // main animation loop (locked to half-arc)
  useEffect(() => {
    const step = (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000; // seconds
      lastTsRef.current = ts;

      const paused = isHovered || hiddenRef.current;
      if (!paused) {
        // advance angle across 180° over `duration` sec
        const degPerSec = 180 / duration;
        angleDegRef.current = wrapHalf(angleDegRef.current + degPerSec * dt);
      }

      // compute position ON the ring's visible arc
      const center = currentOrbit;
      const arcRadius = Math.max(1, currentOrbit - strokeWidth / 2); // stay on colored stroke
      const angleRad = (angleDegRef.current * Math.PI) / 180;        // -90..+90

      const x = center + arcRadius * Math.cos(angleRad);
      const y = center + arcRadius * Math.sin(angleRad);

      // place wrapper and atom
      const w = wrapperRef.current;
      const a = atomRef.current;
      if (w && a) {
        // wrapper is already positioned via absolute in JSX; we only move the atom node
        a.style.left = `${x}px`;
        a.style.top = `${y}px`;
        a.style.transform = `translate(-50%, -50%)`;

        // hard snap-back safety (in case any external transform nudged it)
        // compute distance to center and clamp to arcRadius
        const dx = x - center;
        const dy = y - center;
        const dist = Math.hypot(dx, dy);
        if (Math.abs(dist - arcRadius) > 0.75) {
          const ux = dx / (dist || 1);
          const uy = dy / (dist || 1);
          const sx = center + ux * arcRadius;
          const sy = center + uy * arcRadius;
          a.style.left = `${sx}px`;
          a.style.top = `${sy}px`;
        }
      }

      frameRef.current = requestAnimationFrame(step);
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      lastTsRef.current = null;
    };
  }, [isHovered, duration, currentOrbit, strokeWidth]);

  // hover handlers (pause + glow)
  const onEnter = () => {
    setIsHovered(true);
    onHoverChange?.(true);
  };
  const onLeave = () => {
    setIsHovered(false);
    onHoverChange?.(false);
  };

  const sizeBox = currentOrbit * 2;

  return (
    <div
      ref={wrapperRef}
      className="absolute pointer-events-none z-[4]"
      style={{
        width: sizeBox,
        height: sizeBox,
        left: `calc(50% - ${currentOrbit}px)`,
        top: `calc(50% - ${currentOrbit}px)`,
        // we never animate wrapper geometry while moving; that prevents drift
        willChange: "contents",
      }}
    >
      {/* Absolutely-positioned atom node that we place every frame */}
      <div
        ref={atomRef}
        className="absolute"
        style={{ left: 0, top: 0 }}
      >
        <div
          className="relative pointer-events-auto cursor-pointer flex flex-col items-center"
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          onTouchStart={onEnter}
          onTouchEnd={onLeave}
        >
          <AtomShell material={material} letter={letter} isHovered={isHovered} size={size} />
          <div className="mt-1 px-2 py-0.5 rounded-full text-xs font-medium text-white bg-black/80 pointer-events-none whitespace-nowrap">
            {label}
          </div>
        </div>
      </div>
    </div>
  );
};

// map any angle to the visible half: -90..+90
function normalizeToHalf(deg: number) {
  // first bring to 0..360
  let a = ((deg % 360) + 360) % 360;
  // then map to -180..+180
  if (a > 180) a -= 360;
  // clamp to -90..+90 (start near requested side)
  if (a < -90) a = -90 + ((a + 90) % 180);
  if (a > 90)  a =  90 - ((90 - a) % 180);
  return a;
}
function wrapHalf(deg: number) {
  // keep cycling within -90..+90
  if (deg > 90) return -90 + (deg - 90);
  if (deg < -90) return 90 - (-90 - deg);
  return deg;
}
