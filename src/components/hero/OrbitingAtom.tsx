import React, { useEffect, useMemo, useRef, useState } from "react";
import { ATOM_MATERIALS } from "./AtomMaterials";
import { AtomShell } from "./AtomShell";

interface OrbitingAtomProps {
  orbitRadius: number;
  letter: string;
  label: string;
  materialId: string;
  duration: number;               // seconds for a 180° sweep
  initialAngle: number;           // any degrees; normalized to -90..+90
  size?: number;
  strokeWidth?: number;
  availableOrbits?: number[];     // keep [] for locked look
  orbitSwitchInterval?: number;   // ms; undefined to disable
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
  size = 44,
  strokeWidth = 28,
  availableOrbits = [],
  orbitSwitchInterval,
  onHoverChange,
  onOrbitChange,
}) => {
  const material = useMemo(() => ATOM_MATERIALS[materialId], [materialId]);

  const [isHovered, setIsHovered] = useState(false);
  const [currentOrbit, setCurrentOrbit] = useState(orbitRadius);

  const atomRef = useRef<HTMLDivElement | null>(null);
  const frame = useRef<number | null>(null);
  const lastTs = useRef<number | null>(null);
  const angle = useRef<number>(normalizeToHalf(initialAngle));
  const hidden = useRef<boolean>(false);
  const switchTimer = useRef<number | null>(null);

  useEffect(() => setCurrentOrbit(orbitRadius), [orbitRadius]);

  useEffect(() => {
    const vis = () => (hidden.current = document.hidden);
    vis(); document.addEventListener("visibilitychange", vis);
    return () => document.removeEventListener("visibilitychange", vis);
  }, []);

  // Optional orbit switch (off unless interval provided)
  useEffect(() => {
    if (!orbitSwitchInterval || availableOritsTooFew(availableOrbits)) return;
    const tick = () => {
      const idx = Math.max(0, availableOrbits.indexOf(currentOrbit));
      const next = availableOrbits[(idx + 1) % availableOrbits.length];
      setCurrentOrbit(next);
      onOrbitChange?.(next);
      switchTimer.current = window.setTimeout(tick, orbitSwitchInterval);
    };
    switchTimer.current = window.setTimeout(tick, orbitSwitchInterval);
    return () => { if (switchTimer.current) window.clearTimeout(switchTimer.current); };
  }, [orbitSwitchInterval, availableOrbits, currentOrbit, onOrbitChange]);

  useEffect(() => {
    const step = (ts: number) => {
      if (lastTs.current == null) lastTs.current = ts;
      const dt = (ts - lastTs.current) / 1000;
      lastTs.current = ts;

      if (!(isHovered || hidden.current)) {
        const degPerSec = 180 / duration;     // we traverse half circle in 'duration'
        angle.current = wrapHalf(angle.current + degPerSec * dt);
      }

      // place atom exactly on the painted stroke center
      const center = currentOrbit;
      const r = Math.max(1, currentOrbit - strokeWidth / 2);
      const rad = (angle.current * Math.PI) / 180;
      const x = center + r * Math.cos(rad);
      const y = center + r * Math.sin(rad);

      const node = atomRef.current;
      if (node) {
        node.style.left = `${x}px`;
        node.style.top  = `${y}px`;
        node.style.transform = `translate(-50%, -50%)`;

        // snap-back safety
        const dx = x - center, dy = y - center;
        const dist = Math.hypot(dx, dy);
        if (Math.abs(dist - r) > 0.75) {
          const ux = dx / (dist || 1), uy = dy / (dist || 1);
          node.style.left = `${center + ux * r}px`;
          node.style.top  = `${center + uy * r}px`;
        }
      }

      frame.current = requestAnimationFrame(step);
    };

    frame.current = requestAnimationFrame(step);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = null;
      lastTs.current = null;
    };
  }, [isHovered, duration, currentOrbit, strokeWidth]);

  const onEnter = () => { setIsHovered(true);  onHoverChange?.(true);  };
  const onLeave = () => { setIsHovered(false); onHoverChange?.(false); };

  const box = currentOrbit * 2;

  return (
    <div
      className="absolute pointer-events-none z-[4]"
      style={{
        width: box,
        height: box,
        left: `calc(50% - ${currentOrbit}px)`,
        top:  `calc(50% - ${currentOrbit}px)`,
      }}
    >
      <div ref={atomRef} className="absolute">
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

function availableOritsTooFew(a: number[]) {
  return !a || a.length < 2;
}
function normalizeToHalf(deg: number) {
  let a = ((deg % 360) + 360) % 360;
  if (a > 180) a -= 360;
  if (a < -90) a = -90 + ((a + 90) % 180);
  if (a > 90)  a =  90 - ((90 - a) % 180);
  return a;
}
function wrapHalf(deg: number) {
  if (deg > 90) return -90 + (deg - 90);
  if (deg < -90) return 90 - (-90 - deg);
  return deg;
}
