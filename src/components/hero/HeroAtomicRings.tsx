// HeroAtomicRings.tsx — atoms rotate on paths; snap to arc START when hitting blank
// Themes: outer=RED blend, middle=GREEN blend, inner=BLUE blend
// Rings: single ~65% coloured arc each, rotating; thickness increases outward

import React, { useEffect, useRef, ReactNode } from "react";

// Atom component with realistic styling
interface AtomComponentProps {
  atomRef: React.MutableRefObject<SVGGElement | null>;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  type: 'library' | 'authors' | 'social';
  scale: number;
  isMobile: boolean;
  isSmallMobile: boolean;
}

const AtomComponent: React.FC<AtomComponentProps> = ({ 
  atomRef, 
  onMouseEnter, 
  onMouseLeave, 
  type, 
  scale,
  isMobile,
  isSmallMobile
}) => {
  const atomConfigs = {
    library: {
      color: '#ef4444',
      gradient: 'url(#g-library)',
      letter: 'L',
      label: 'Library',
      shadowColor: '#ef4444'
    },
    authors: {
      color: '#22c55e',
      gradient: 'url(#g-authors)',
      letter: 'A',
      label: 'Authors',
      shadowColor: '#22c55e'
    },
    social: {
      color: '#3b82f6',
      gradient: 'url(#g-social)',
      letter: 'S',
      label: 'Social Media',
      shadowColor: '#3b82f6'
    }
  };

  const config = atomConfigs[type];
  const baseRadius = type === 'library' ? 18 : 16;
  const radius = Math.max(8, Math.round(baseRadius * scale));
  const fontSize = Math.max(8, Math.round(12 * scale));
  const labelFontSize = Math.max(6, Math.round(8 * scale));

  return (
    <>
      {/* Enhanced gradients for realistic atom appearance */}
      <defs>
        <radialGradient id={`g-${type}`} cx="0.3" cy="0.3" r="0.8">
          <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
          <stop offset="30%" stopColor={config.color} />
          <stop offset="70%" stopColor={config.color} />
          <stop offset="100%" stopColor="rgba(0,0,0,0.3)" />
        </radialGradient>
        <filter id={`atom-glow-${type}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor={config.shadowColor} floodOpacity="0.5"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <g
        ref={el => (atomRef.current = el)}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className="pointer-events-auto cursor-pointer transition-transform duration-300 hover:scale-110"
      >
        {/* Outer electron shell effect */}
        <circle 
          r={radius + 4} 
          fill="none" 
          stroke={config.color} 
          strokeWidth={Math.max(1, scale * 0.5)}
          opacity="0.3"
          strokeDasharray="2,2"
        />
        
        {/* Main atom body with realistic gradient */}
        <circle 
          r={radius} 
          fill={config.gradient}
          filter={`url(#atom-glow-${type})`}
          className="transition-all duration-300"
        />
        
        {/* Nucleus highlight */}
        <circle 
          r={radius * 0.3} 
          fill="rgba(255,255,255,0.6)"
          opacity="0.8"
        />
        
        {/* Letter/Symbol */}
        <text
          y={fontSize * 0.4}
          textAnchor="middle"
          fontSize={fontSize}
          fontWeight={700}
          fill="#ffffff"
          className="pointer-events-none select-none"
          style={{ textShadow: `0 0 4px ${config.shadowColor}` }}
        >
          {config.letter}
        </text>
        
        {/* Floating label - only show on larger screens */}
        {!isSmallMobile && (
          <text
            y={radius + 15}
            textAnchor="middle"
            fontSize={labelFontSize}
            fontWeight={600}
            fill="rgba(255,255,255,0.9)"
            className="pointer-events-none select-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            {config.label}
          </text>
        )}
      </g>
    </>
  );
};

// ---------- Geometry helpers ----------
const toRadTop = (deg: number) => (deg - 90) * (Math.PI / 180); // 0° at top
const norm = (a: number) => ((a % 360) + 360) % 360;
const pos = (r: number, deg: number) => ({ x: r * Math.cos(toRadTop(deg)), y: r * Math.sin(toRadTop(deg)) });

function arcPath(r: number, startDeg: number, endDeg: number) {
  const a0 = toRadTop(startDeg);
  const a1 = toRadTop(endDeg);
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  const x0 = r * Math.cos(a0);
  const y0 = r * Math.sin(a0);
  const x1 = r * Math.cos(a1);
  const y1 = r * Math.sin(a1);
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
}

// Is angle a inside circular interval [start, end] modulo 360 (inclusive)
function inInterval(a: number, start: number, end: number) {
  a = norm(a); start = norm(start); end = norm(end);
  if (start <= end) return a >= start && a <= end;
  return a >= start || a <= end; // wrapped
}

interface HeroAtomicRingsProps {
  size?: number;
  children?: ReactNode;
  isMobile?: boolean;
  isSmallMobile?: boolean;
}

export default function HeroAtomicRings({ 
  size = 720, 
  children, 
  isMobile = false, 
  isSmallMobile = false 
}: HeroAtomicRingsProps) {
  // ===== Responsive Visual config =====
  const scale = size / 720; // Scale factor based on size
  
  const INNER = Math.round(225 * scale);
  const MID   = Math.round(255 * scale);
  const OUTER = Math.round(285 * scale);

  const baseStrokes = isSmallMobile 
    ? { inner: 6, mid: 8, outer: 12 }
    : isMobile 
    ? { inner: 8, mid: 10, outer: 16 }
    : { inner: 10, mid: 14, outer: 20 };
  
  const STROKES = {
    inner: Math.round(baseStrokes.inner * scale),
    mid: Math.round(baseStrokes.mid * scale),
    outer: Math.round(baseStrokes.outer * scale)
  } as const;

  // Coloured arc coverage: ~65% of circumference
  const COVERAGE = 0.65;                 // try 0.60–0.70
  const SWEEP_DEG = 360 * COVERAGE;      // e.g. 234°

  // Rotating arc start angles + speeds
  const ROTOR_START = { outer: -18, mid: 12, inner: -36 } as const; // degrees
  const ROTOR_DUR   = { outer: 28,  mid: 24, inner: 20 } as const;  // seconds per 360
  const ROTOR_DIR   = { outer: 1,   mid: -1, inner: 1 } as const;   // +1 cw, -1 ccw

  // Atom motion — continuous path rotation
  const ATOM_SPEED = 50;  // deg/sec (~7.2s per lap). Lower = slower, higher = faster

  // ---------- Refs ----------
  const ringRefs = [useRef<SVGGElement | null>(null), useRef<SVGGElement | null>(null), useRef<SVGGElement | null>(null)];
  const atomRefs = [useRef<SVGGElement | null>(null), useRef<SVGGElement | null>(null), useRef<SVGGElement | null>(null)];

  const ringAngles = useRef([0, 0, 0]); // dynamic ring arc rotations
  const atomAngles = useRef([0, 120, 240]); // dynamic atom angles
  const atomRings = useRef([0, 1, 2]); // fixed ring per atom: 0=outer,1=mid,2=inner

  const paused = useRef(false);
  const last = useRef(performance.now());

  const radii   = [OUTER, MID, INNER];
  const rotorStart = [ROTOR_START.outer, ROTOR_START.mid, ROTOR_START.inner];
  const rotorDur   = [ROTOR_DUR.outer,   ROTOR_DUR.mid,   ROTOR_DUR.inner];
  const rotorDir   = [ROTOR_DIR.outer,   ROTOR_DIR.mid,   ROTOR_DIR.inner];

  // Initial placement so nothing looks frozen pre-RAF
  useEffect(() => {
    for (let i = 0; i < 3; i++) {
      const g = ringRefs[i].current;
      if (g) g.setAttribute("transform", `rotate(${ringAngles.current[i]} 0 0)`);
    }
    for (let k = 0; k < 3; k++) {
      const ri = atomRings.current[k];
      const p = pos(radii[ri], atomAngles.current[k]);
      atomRefs[k].current?.setAttribute("transform", `translate(${p.x}, ${p.y})`);
    }
  }, []);

  useEffect(() => {
    let raf: number | null = null;

    const step = (now: number) => {
      const dtRaw = (now - last.current) / 1000;
      last.current = now;

      if (!paused.current) {
        const dt = Math.max(0, Math.min(0.05, dtRaw)); // clamp for background tabs

        // 1) advance ring arcs
        for (let i = 0; i < 3; i++) {
          const speed = (360 / rotorDur[i]) * rotorDir[i]; // deg/sec
          ringAngles.current[i] = norm(ringAngles.current[i] + speed * dt);
          ringRefs[i].current?.setAttribute("transform", `rotate(${ringAngles.current[i]} 0 0)`);
        }

        // 2) move atoms; if they hit blank, SNAP to arc START on their ring
        for (let k = 0; k < 3; k++) {
          atomAngles.current[k] = norm(atomAngles.current[k] + ATOM_SPEED * dt);

          const ringIndex = atomRings.current[k]; // fixed ring
          const start = norm(rotorStart[ringIndex] + ringAngles.current[ringIndex]);
          const end = norm(start + SWEEP_DEG);

          if (!inInterval(atomAngles.current[k], start, end)) {
            // Jump back to the START of the coloured arc for this ring at this moment
            atomAngles.current[k] = start;
          }

          const r = radii[ringIndex];
          const p = pos(r, atomAngles.current[k]);
          atomRefs[k].current?.setAttribute("transform", `translate(${p.x}, ${p.y})`);
        }
      }

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const handleEnter = () => {
    paused.current = true;
  };

  const handleLeave = () => {
    paused.current = false;
    last.current = performance.now();
  };

  const COVER_SWEEP = (r: number, start: number) => arcPath(r, start, start + SWEEP_DEG);

  return (
    <div
      className="relative flex items-center justify-center w-full"
      style={{ width: size, height: size }}
    >
      <svg
        className="block"
        style={{ width: "100%", height: "100%" }}
        viewBox="-360 -360 720 720"
        aria-hidden
      >
        <defs>
          {/* atom glow */}
          <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* gradients: outer RED, middle GREEN, inner BLUE (multi-stop blends) */}
          <linearGradient id="g-outer" gradientUnits="userSpaceOnUse" x1={-OUTER} y1={-OUTER} x2={OUTER} y2={OUTER}>
            {/* vibrant red → pink blend */}
            <stop offset="0%"   stopColor="#ff9ecf" />   {/* light pink highlight */}
            <stop offset="35%"  stopColor="#ff4d8d" />   {/* hot pink core */}
            <stop offset="70%"  stopColor="#ff1f5a" />   {/* vivid rose red */}
            <stop offset="100%" stopColor="#be123c" />   {/* deep crimson anchor */}
          </linearGradient>
          <linearGradient id="g-mid" gradientUnits="userSpaceOnUse" x1={-255} y1={-255} x2={255} y2={255}>
            <stop offset="0%"   stopColor="#86efac" />
            <stop offset="50%"  stopColor="#22c55e" />
            <stop offset="100%" stopColor="#166534" />
          </linearGradient>
          <linearGradient id="g-inner" gradientUnits="userSpaceOnUse" x1={-INNER} y1={-INNER} x2={INNER} y2={INNER}>
            <stop offset="0%"   stopColor="#93c5fd" />
            <stop offset="50%"  stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>
        </defs>

        {/* Outer ring */}
        <g>
          <circle r={OUTER} cx={0} cy={0} fill="none" stroke={`rgba(255,255,255,0.08)`} strokeWidth={STROKES.outer} />
          <g ref={el => (ringRefs[0].current = el)}>
            <path d={COVER_SWEEP(OUTER, ROTOR_START.outer)} fill="none" stroke="url(#g-outer)" strokeWidth={STROKES.outer} strokeLinecap="round" />
          </g>
        </g>

        {/* Middle ring */}
        <g>
          <circle r={MID} cx={0} cy={0} fill="none" stroke={`rgba(255,255,255,0.08)`} strokeWidth={STROKES.mid} />
          <g ref={el => (ringRefs[1].current = el)}>
            <path
              d={COVER_SWEEP(MID, ROTOR_START.mid)}
              fill="none"
              stroke="url(#g-mid)"
              strokeWidth={STROKES.mid}
              strokeLinecap="round"
            />
          </g>
        </g>

        {/* Inner ring */}
        <g>
          <circle r={INNER} cx={0} cy={0} fill="none" stroke={`rgba(255,255,255,0.10)`} strokeWidth={STROKES.inner} />
          <g ref={el => (ringRefs[2].current = el)}>
            <path
              d={COVER_SWEEP(INNER, ROTOR_START.inner)}
              fill="none"
              stroke="url(#g-inner)"
              strokeWidth={STROKES.inner}
              strokeLinecap="round"
            />
          </g>
        </g>

        {/* Enhanced atoms with realistic appearance and proper labels */}
        <AtomComponent 
          atomRef={atomRefs[0]}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          type="library"
          scale={scale}
          isMobile={isMobile}
          isSmallMobile={isSmallMobile}
        />
        <AtomComponent 
          atomRef={atomRefs[1]}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          type="authors"
          scale={scale}
          isMobile={isMobile}
          isSmallMobile={isSmallMobile}
        />
        <AtomComponent 
          atomRef={atomRefs[2]}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          type="social"
          scale={scale}
          isMobile={isMobile}
          isSmallMobile={isSmallMobile}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="w-full max-w-[60%] pointer-events-auto">{children}</div>
        </div>
      )}
    </div>
  );
}
