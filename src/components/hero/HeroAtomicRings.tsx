// HeroAtomicRings.tsx — atoms rotate on paths; snap to arc START when hitting blank
// Themes: outer=RED blend, middle=GREEN blend, inner=BLUE blend
// Rings: single ~65% coloured arc each, rotating; thickness increases outward

import React, { useEffect, useRef, ReactNode } from "react";

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
}

export default function HeroAtomicRings({ size = 720, children }: HeroAtomicRingsProps) {
  // ===== Visual config =====
  const CORE  = 200;  // Social Media (innermost)
  const INNER = 235;  // Authors
  const MID   = 270;  // Games
  const OUTER = 305;  // Library (outermost)

  const STROKES = { core: 8, inner: 10, mid: 14, outer: 20 } as const;

  // Coloured arc coverage: ~65% of circumference
  const COVERAGE = 0.65;                 // try 0.60–0.70
  const SWEEP_DEG = 360 * COVERAGE;      // e.g. 234°

  // Rotating arc start angles + speeds
  const ROTOR_START = { outer: -18, mid: 12, inner: -36, core: 24 } as const;
  const ROTOR_DUR   = { outer: 42,  mid: 36, inner: 30,  core: 26 } as const;
  const ROTOR_DIR   = { outer: 1,   mid: -1, inner: 1,   core: -1 } as const;

  // Atom motion — continuous path rotation
  const ATOM_SPEED = 30;  // deg/sec (~12s per lap). Lower = slower, higher = faster

  // ---------- Refs ----------
  const ringRefs = [useRef<SVGGElement | null>(null), useRef<SVGGElement | null>(null), useRef<SVGGElement | null>(null), useRef<SVGGElement | null>(null)];
  const atomRefs = [useRef<SVGGElement | null>(null), useRef<SVGGElement | null>(null), useRef<SVGGElement | null>(null), useRef<SVGGElement | null>(null)];

  const ringAngles = useRef([0, 0, 0, 0]);
  const atomAngles = useRef([0, 120, 240, 60]);
  const atomRings = useRef([0, 1, 2, 3]); // 0=outer,1=mid,2=inner,3=core

  const paused = useRef(false);
  const last = useRef(performance.now());

  const radii   = [OUTER, MID, INNER, CORE];
  const rotorStart = [ROTOR_START.outer, ROTOR_START.mid, ROTOR_START.inner, ROTOR_START.core];
  const rotorDur   = [ROTOR_DUR.outer,   ROTOR_DUR.mid,   ROTOR_DUR.inner,   ROTOR_DUR.core];
  const rotorDir   = [ROTOR_DIR.outer,   ROTOR_DIR.mid,   ROTOR_DIR.inner,   ROTOR_DIR.core];

  // Initial placement so nothing looks frozen pre-RAF
  useEffect(() => {
    for (let i = 0; i < 4; i++) {
      const g = ringRefs[i].current;
      if (g) g.setAttribute("transform", `rotate(${ringAngles.current[i]} 0 0)`);
    }
    for (let k = 0; k < 4; k++) {
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
        for (let i = 0; i < 4; i++) {
          const speed = (360 / rotorDur[i]) * rotorDir[i];
          ringAngles.current[i] = norm(ringAngles.current[i] + speed * dt);
          ringRefs[i].current?.setAttribute("transform", `rotate(${ringAngles.current[i]} 0 0)`);
        }

        // 2) move atoms; if they hit blank, SNAP to arc START on their ring
        for (let k = 0; k < 4; k++) {
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
          <linearGradient id="g-core" gradientUnits="userSpaceOnUse" x1={-CORE} y1={-CORE} x2={CORE} y2={CORE}>
            <stop offset="0%"   stopColor="#fbbf24" />
            <stop offset="50%"  stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
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

        {/* Core ring (Games) */}
        <g>
          <circle r={CORE} cx={0} cy={0} fill="none" stroke={`rgba(255,255,255,0.10)`} strokeWidth={STROKES.core} />
          <g ref={el => (ringRefs[3].current = el)}>
            <path
              d={COVER_SWEEP(CORE, ROTOR_START.core)}
              fill="none"
              stroke="url(#g-core)"
              strokeWidth={STROKES.core}
              strokeLinecap="round"
            />
          </g>
        </g>

        {/* ATOMS — rotate on path; snap to arc START if they hit blank */}
        {/* Outer ring: Library */}
        <g
          ref={el => (atomRefs[0].current = el)}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          className="pointer-events-auto cursor-pointer"
        >
          <circle r={16} fill="#ef4444" filter="url(#soft)" />
          <text y={6} textAnchor="middle" fontSize={12} fontWeight={700} fill="#ffffff">L</text>
          <text y={30} textAnchor="middle" fontSize={10} fontWeight={500} fill="#f8fafc">Library</text>
        </g>
        {/* Mid ring: Games */}
        <g
          ref={el => (atomRefs[1].current = el)}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          className="pointer-events-auto cursor-pointer"
        >
          <circle r={15} fill="#22c55e" filter="url(#soft)" />
          <text y={6} textAnchor="middle" fontSize={11} fontWeight={700} fill="#f8fafc">G</text>
          <text y={28} textAnchor="middle" fontSize={9} fontWeight={500} fill="#f8fafc">Games</text>
        </g>
        {/* Inner ring: Authors */}
        <g
          ref={el => (atomRefs[2].current = el)}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          className="pointer-events-auto cursor-pointer"
        >
          <circle r={15} fill="#3b82f6" filter="url(#soft)" />
          <text y={6} textAnchor="middle" fontSize={11} fontWeight={700} fill="#f8fafc">A</text>
          <text y={28} textAnchor="middle" fontSize={9} fontWeight={500} fill="#f8fafc">Authors</text>
        </g>
        {/* Core ring: Social Media */}
        <g
          ref={el => (atomRefs[3].current = el)}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          className="pointer-events-auto cursor-pointer"
        >
          <circle r={14} fill="#f59e0b" filter="url(#soft)" />
          <text y={5} textAnchor="middle" fontSize={11} fontWeight={700} fill="#ffffff">S</text>
          <text y={27} textAnchor="middle" fontSize={9} fontWeight={500} fill="#f8fafc">Social Media</text>
        </g>
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="w-full max-w-[60%] pointer-events-auto">{children}</div>
        </div>
      )}
    </div>
  );
}
