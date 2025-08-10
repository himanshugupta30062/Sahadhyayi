// HeroAtomicRings.tsx — atoms rotate on paths; snap to arc START when hitting blank
// Themes: outer=RED blend, middle=GREEN blend, inner=BLUE blend
// Rings: single ~65% coloured arc each, rotating; thickness increases outward

import React, { useEffect, useRef } from "react";

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

export default function HeroAtomicRings() {
  // ===== Visual config =====
  const INNER = 235;  // thinnest
  const MID   = 255;  // medium
  const OUTER = 275;  // thickest

  const STROKES = { inner: 10, mid: 14, outer: 20 } as const; // thicker outward

  // Coloured arc coverage: ~65% of circumference
  const COVERAGE = 0.65;                 // try 0.60–0.70
  const SWEEP_DEG = 360 * COVERAGE;      // e.g. 234°

  // Rotating arc start angles + speeds
  const ROTOR_START = { outer: -18, mid: 12, inner: -36 } as const; // degrees
  const ROTOR_DUR   = { outer: 22,  mid: 18, inner: 14 } as const;  // seconds per 360
  const ROTOR_DIR   = { outer: 1,   mid: -1, inner: 1 } as const;   // +1 cw, -1 ccw

  // Atom motion — continuous path rotation
  const ATOM_SPEED = 60;  // deg/sec (~6s per lap). Lower = slower, higher = faster

  // ---------- Refs ----------
  const ringRefs = [useRef<SVGGElement|null>(null), useRef<SVGGElement|null>(null), useRef<SVGGElement|null>(null)];
  const atomRefs = [useRef<SVGGElement|null>(null), useRef<SVGGElement|null>(null), useRef<SVGGElement|null>(null)];

  const ringAngles = useRef([0, 0, 0]);           // dynamic ring arc rotations
  const atomAngles = useRef([0, 120, 240]);       // dynamic atom angles
  const atomRings  = useRef([0, 1, 2]);           // fixed ring per atom: 0=outer,1=mid,2=inner

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
    let last = performance.now();

    const step = (now: number) => {
      const dtRaw = (now - last) / 1000;
      const dt = Math.max(0, Math.min(0.05, dtRaw)); // clamp for background tabs
      last = now;

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
        const end   = norm(start + SWEEP_DEG);

        if (!inInterval(atomAngles.current[k], start, end)) {
          // Jump back to the START of the coloured arc for this ring at this moment
          atomAngles.current[k] = start;
        }

        const r = radii[ringIndex];
        const p = pos(r, atomAngles.current[k]);
        atomRefs[k].current?.setAttribute("transform", `translate(${p.x}, ${p.y})`);
      }

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => { if (raf) cancelAnimationFrame(raf); };
  }, []);

  const COVER_SWEEP = (r: number, start: number) => arcPath(r, start, start + SWEEP_DEG);

  return (
    <div className="relative flex items-center justify-center w-full">
      <svg className="block" style={{ width: 720, height: 720 }} viewBox="-360 -360 720 720" aria-hidden>
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
            <path d={COVER_SWEEP(MID, ROTOR_START.mid)} fill="none" stroke="url(#g-mid)" strokeWidth={STROKES.mid} strokeLinecap="round" />
          </g>
        </g>

        {/* Inner ring */}
        <g>
          <circle r={INNER} cx={0} cy={0} fill="none" stroke={`rgba(255,255,255,0.10)`} strokeWidth={STROKES.inner} />
          <g ref={el => (ringRefs[2].current = el)}>
            <path d={COVER_SWEEP(INNER, ROTOR_START.inner)} fill="none" stroke="url(#g-inner)" strokeWidth={STROKES.inner} strokeLinecap="round" />
          </g>
        </g>

        {/* ATOMS — rotate on path; snap to arc START if they hit blank */}
        <g ref={el => (atomRefs[0].current = el)}>
          <circle r={9} fill="#ef4444" filter="url(#soft)" />
          <text y={4} textAnchor="middle" fontSize={10} fontWeight={700} fill="#ffffff">A</text>
        </g>
        <g ref={el => (atomRefs[1].current = el)}>
          <circle r={8} fill="#22c55e" filter="url(#soft)" />
          <text y={4} textAnchor="middle" fontSize={9} fontWeight={700} fill="#f8fafc">S</text>
        </g>
        <g ref={el => (atomRefs[2].current = el)}>
          <circle r={8} fill="#3b82f6" filter="url(#soft)" />
          <text y={4} textAnchor="middle" fontSize={9} fontWeight={700} fill="#f8fafc">L</text>
        </g>
      </svg>
    </div>
  );
}
