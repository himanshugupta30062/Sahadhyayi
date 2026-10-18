// HeroAtomicRings.tsx — four colourful orbits with smooth, fade-through atom motion
// Themes: outer=RED blend, middle=GREEN blend, inner=BLUE blend, core=GOLD blend
// Rings: single ~65% coloured arc each, rotating; thickness increases outward

import React, { useEffect, useId, useRef } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

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

interface HeroAtomicRingsProps {
  size?: number | string;
  className?: string;
  children?: ReactNode;
}

export default function HeroAtomicRings({ size = 720, className = "", children }: HeroAtomicRingsProps) {
  const navigate = useNavigate();
  const generatedId = useId().replace(/:/g, "");
  const softFilterId = `soft-${generatedId}`;
  const outerGradientId = `g-outer-${generatedId}`;
  const middleGradientId = `g-mid-${generatedId}`;
  const innerGradientId = `g-inner-${generatedId}`;
  const coreGradientId = `g-core-${generatedId}`;
  // ===== Visual config =====
  const CORE  = 210;  // innermost
  const INNER = 225;
  const MID   = 255;
  const OUTER = 285;  // thickest

  const STROKES = { core: 8, inner: 10, mid: 14, outer: 20 } as const;

  // Coloured arc coverage: ~65% of circumference
  const COVERAGE = 0.65;
  const SWEEP_DEG = 360 * COVERAGE;

  // Rotating arc start angles + speeds
  const ROTOR_START = { outer: -18, mid: 12, inner: -36, core: 24 } as const;
  const ROTOR_DUR   = { outer: 42,  mid: 36, inner: 30,  core: 26 } as const;
  const ROTOR_DIR   = { outer: 1,   mid: -1, inner: 1,   core: -1 } as const;

  // Atom motion — continuous path rotation
  const ATOM_SPEED = 30;  // deg/sec

  // ---------- Animation refs and geometry ----------
  const ringRefs = useRef<(SVGGElement | null)[]>([]);
  const atomRefs = useRef<(SVGGElement | null)[]>([]);
  const ringAngles = useRef([0, 0, 0, 0]);
  // Each atom advances only within its ring arc. It fades out before looping,
  // so it never visibly snaps from one end of the coloured arc to the other.
  const atomProgress = useRef([48, 112, 190, 84]);
  const pausedForKeyboard = useRef(false);
  const radii = [OUTER, MID, INNER, CORE];
  const rotorStart = [ROTOR_START.outer, ROTOR_START.mid, ROTOR_START.inner, ROTOR_START.core];
  const rotorDur = [ROTOR_DUR.outer, ROTOR_DUR.mid, ROTOR_DUR.inner, ROTOR_DUR.core];
  const rotorDir = [ROTOR_DIR.outer, ROTOR_DIR.mid, ROTOR_DIR.inner, ROTOR_DIR.core];
  const ATOM_FADE_ANGLE = 18;

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let prefersReducedMotion = motionQuery.matches;
    let raf: number | null = null;
    let lastFrameTime = performance.now();

    const renderScene = () => {
      ringRefs.current.forEach((ring, index) => {
        ring?.setAttribute("transform", `rotate(${ringAngles.current[index] || 0} 0 0)`);
      });

      atomRefs.current.forEach((atom, index) => {
        if (!atom) return;
        const progress = atomProgress.current[index] ?? 0;
        const angle = norm(rotorStart[index] + (ringAngles.current[index] || 0) + progress);
        const point = pos(radii[index], angle);
        atom.setAttribute("transform", `translate(${point.x}, ${point.y})`);
        const distanceFromEdge = Math.min(progress, SWEEP_DEG - progress);
        const opacity = Math.max(0, Math.min(1, distanceFromEdge / ATOM_FADE_ANGLE));
        atom.setAttribute("opacity", String(opacity));
      });
    };

    const tick = (now: number) => {
      const elapsed = Math.min(0.05, Math.max(0, (now - lastFrameTime) / 1000));
      lastFrameTime = now;

      if (!pausedForKeyboard.current && !document.hidden && !prefersReducedMotion) {
        ringAngles.current = ringAngles.current.map((angle, index) =>
          norm(angle + (360 / rotorDur[index]) * rotorDir[index] * elapsed),
        );
        atomProgress.current = atomProgress.current.map((progress) =>
          (progress + ATOM_SPEED * elapsed) % SWEEP_DEG,
        );
      }

      renderScene();
      if (!prefersReducedMotion && !document.hidden) {
        raf = window.requestAnimationFrame(tick);
      } else {
        raf = null;
      }
    };

    const stopAnimation = () => {
      if (raf !== null) {
        window.cancelAnimationFrame(raf);
        raf = null;
      }
    };
    const startAnimation = () => {
      if (prefersReducedMotion || document.hidden || raf !== null) return;
      lastFrameTime = performance.now();
      raf = window.requestAnimationFrame(tick);
    };
    const onVisibilityChange = () => {
      if (document.hidden) stopAnimation();
      else startAnimation();
    };
    const onMotionPreferenceChange = (event: MediaQueryListEvent) => {
      prefersReducedMotion = event.matches;
      if (prefersReducedMotion) {
        stopAnimation();
        renderScene();
      } else {
        startAnimation();
      }
    };

    renderScene();
    startAnimation();
    document.addEventListener("visibilitychange", onVisibilityChange);
    if (typeof motionQuery.addEventListener === "function") {
      motionQuery.addEventListener("change", onMotionPreferenceChange);
    } else {
      motionQuery.addListener(onMotionPreferenceChange);
    }

    return () => {
      stopAnimation();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (typeof motionQuery.removeEventListener === "function") {
        motionQuery.removeEventListener("change", onMotionPreferenceChange);
      } else {
        motionQuery.removeListener(onMotionPreferenceChange);
      }
    };
  }, []);

  const setKeyboardPause = (paused: boolean) => {
    pausedForKeyboard.current = paused;
  };

  const handleNodeKeyDown = (event: ReactKeyboardEvent<SVGGElement>, href: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigate(href);
    }
  };

  const COVER_SWEEP = (r: number, start: number) => arcPath(r, start, start + SWEEP_DEG);

  return (
    <div
      className={`relative w-full h-full aspect-square flex items-center justify-center ${className}`}
      style={
        typeof size === "number"
          ? { width: size, height: size }
          : typeof size === "string" && size !== "100%"
          ? { width: size, height: size }
          : { width: "100%", height: "100%" }
      }
    >
      <svg
        className="block w-full h-full max-w-full max-h-full"
        viewBox="-360 -360 720 720"
        role="group"
        aria-label="Explore Sahadhyayi through the Library, Authors, Social Media, and Discovery orbits"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* atom glow */}
          <filter id={softFilterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* gradients: outer RED, middle GREEN, inner BLUE, core GOLD */}
          <linearGradient id={outerGradientId} gradientUnits="userSpaceOnUse" x1={-OUTER} y1={-OUTER} x2={OUTER} y2={OUTER}>
            <stop offset="0%"   stopColor="#ff9ecf" />
            <stop offset="35%"  stopColor="#ff4d8d" />
            <stop offset="70%"  stopColor="#ff1f5a" />
            <stop offset="100%" stopColor="#be123c" />
          </linearGradient>
          <linearGradient id={middleGradientId} gradientUnits="userSpaceOnUse" x1={-255} y1={-255} x2={255} y2={255}>
            <stop offset="0%"   stopColor="#86efac" />
            <stop offset="50%"  stopColor="#22c55e" />
            <stop offset="100%" stopColor="#166534" />
          </linearGradient>
          <linearGradient id={innerGradientId} gradientUnits="userSpaceOnUse" x1={-INNER} y1={-INNER} x2={INNER} y2={INNER}>
            <stop offset="0%"   stopColor="#93c5fd" />
            <stop offset="50%"  stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>
          <linearGradient id={coreGradientId} gradientUnits="userSpaceOnUse" x1={-CORE} y1={-CORE} x2={CORE} y2={CORE}>
            <stop offset="0%"   stopColor="#fbbf24" />
            <stop offset="50%"  stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
        </defs>

        {/* Outer ring */}
        <g>
          <circle r={OUTER} cx={0} cy={0} fill="none" stroke="rgba(0,0,0,0.06)" className="dark:stroke-[rgba(255,255,255,0.08)]" strokeWidth={STROKES.outer} />
          <g ref={(el) => { ringRefs.current[0] = el; }}>
            <path d={COVER_SWEEP(OUTER, ROTOR_START.outer)} fill="none" stroke={`url(#${outerGradientId})`} strokeWidth={STROKES.outer} strokeLinecap="round" />
          </g>
        </g>

        {/* Middle ring */}
        <g>
          <circle r={MID} cx={0} cy={0} fill="none" stroke="rgba(0,0,0,0.06)" className="dark:stroke-[rgba(255,255,255,0.08)]" strokeWidth={STROKES.mid} />
          <g ref={(el) => { ringRefs.current[1] = el; }}>
            <path
              d={COVER_SWEEP(MID, ROTOR_START.mid)}
              fill="none"
              stroke={`url(#${middleGradientId})`}
              strokeWidth={STROKES.mid}
              strokeLinecap="round"
            />
          </g>
        </g>

        {/* Inner ring */}
        <g>
          <circle r={INNER} cx={0} cy={0} fill="none" stroke="rgba(0,0,0,0.08)" className="dark:stroke-[rgba(255,255,255,0.10)]" strokeWidth={STROKES.inner} />
          <g ref={(el) => { ringRefs.current[2] = el; }}>
            <path
              d={COVER_SWEEP(INNER, ROTOR_START.inner)}
              fill="none"
              stroke={`url(#${innerGradientId})`}
              strokeWidth={STROKES.inner}
              strokeLinecap="round"
            />
          </g>
        </g>

        {/* Core ring */}
        <g>
          <circle r={CORE} cx={0} cy={0} fill="none" stroke="rgba(0,0,0,0.08)" className="dark:stroke-[rgba(255,255,255,0.10)]" strokeWidth={STROKES.core} />
          <g ref={(el) => { ringRefs.current[3] = el; }}>
            <path
              d={COVER_SWEEP(CORE, ROTOR_START.core)}
              fill="none"
              stroke={`url(#${coreGradientId})`}
              strokeWidth={STROKES.core}
              strokeLinecap="round"
            />
          </g>
        </g>

        {/* ATOMS — each node follows its ring's arc and softly fades at the gap */}
        {/* Outer ring: Library */}
        <g
          ref={(el) => { atomRefs.current[0] = el; }}
          role="link"
          tabIndex={0}
          aria-label="Explore Library"
          onClick={() => navigate("/library")}
          onKeyDown={(event) => handleNodeKeyDown(event, "/library")}
          onFocus={() => setKeyboardPause(true)}
          onBlur={() => setKeyboardPause(false)}
          className="pointer-events-auto cursor-pointer outline-none"
        >
          <circle r={16} fill="#ef4444" filter={`url(#${softFilterId})`} />
          {/* Mini open book vector icon */}
          <path
            d="M -6 -3.5 C -3 -4.5 -1 -4.5 0 -2.5 C 1 -4.5 3 -4.5 6 -3.5 L 6 3.5 C 3 2.5 1 2.5 0 4.5 C -1 2.5 -3 2.5 -6 3.5 Z M 0 -2.5 L 0 4.5"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <text y={30} textAnchor="middle" fontSize={10} fontWeight={500} fill="currentColor" className="text-[#1C201D] dark:text-[#f8fafc]">Library</text>
        </g>
        {/* Mid ring: Authors */}
        <g
          ref={(el) => { atomRefs.current[1] = el; }}
          role="link"
          tabIndex={0}
          aria-label="Explore Authors"
          onClick={() => navigate("/authors")}
          onKeyDown={(event) => handleNodeKeyDown(event, "/authors")}
          onFocus={() => setKeyboardPause(true)}
          onBlur={() => setKeyboardPause(false)}
          className="pointer-events-auto cursor-pointer outline-none"
        >
          <circle r={15} fill="#22c55e" filter={`url(#${softFilterId})`} />
          {/* Quill / Pen vector icon */}
          <path
            d="M 3.5 -4.5 L 4.5 -3.5 L -2 3 C -3 4.5 -4.5 4.5 -4.5 4.5 C -4.5 4.5 -4.5 3 -3 2 Z"
            fill="#ffffff"
          />
          <text y={28} textAnchor="middle" fontSize={9} fontWeight={500} fill="currentColor" className="text-[#1C201D] dark:text-[#f8fafc]">Authors</text>
        </g>
        {/* Inner ring: Social Media */}
        <g
          ref={(el) => { atomRefs.current[2] = el; }}
          role="link"
          tabIndex={0}
          aria-label="Explore Social Media"
          onClick={() => navigate("/social")}
          onKeyDown={(event) => handleNodeKeyDown(event, "/social")}
          onFocus={() => setKeyboardPause(true)}
          onBlur={() => setKeyboardPause(false)}
          className="pointer-events-auto cursor-pointer outline-none"
        >
          <circle r={15} fill="#3b82f6" filter={`url(#${softFilterId})`} />
          {/* Users group vector icon */}
          <circle cx="-2" cy="-2.5" r="2.2" fill="#ffffff" />
          <path d="M -5.5 3.5 C -5.5 1.5 -3 1.5 -2 1.5 C -1 1.5 1.5 1.5 1.5 3.5" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="2.5" cy="-2" r="1.8" fill="#ffffff" />
          <path d="M 2 1.8 C 2.5 1.8 4.5 2 4.5 3.5" fill="none" stroke="#ffffff" strokeWidth="1.1" strokeLinecap="round" />
          <text y={28} textAnchor="middle" fontSize={9} fontWeight={500} fill="currentColor" className="text-[#1C201D] dark:text-[#f8fafc]">Social Media</text>
        </g>
        {/* Core ring: Discovery */}
        <g
          ref={(el) => { atomRefs.current[3] = el; }}
          role="link"
          tabIndex={0}
          aria-label="Explore Discovery"
          onClick={() => navigate("/discovery")}
          onKeyDown={(event) => handleNodeKeyDown(event, "/discovery")}
          onFocus={() => setKeyboardPause(true)}
          onBlur={() => setKeyboardPause(false)}
          className="pointer-events-auto cursor-pointer outline-none"
        >
          <circle r={14} fill="#f59e0b" filter={`url(#${softFilterId})`} />
          {/* 4-point star vector icon */}
          <path d="M 0 -4.5 L 1.2 -1.2 L 4.5 0 L 1.2 1.2 L 0 4.5 L -1.2 1.2 L -4.5 0 L -1.2 -1.2 Z" fill="#ffffff" />
          <text y={27} textAnchor="middle" fontSize={9} fontWeight={500} fill="currentColor" className="text-[#1C201D] dark:text-[#f8fafc]">Discovery</text>
        </g>
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="w-full max-w-[92%] sm:max-w-[88%] pointer-events-auto flex items-center justify-center">{children}</div>
        </div>
      )}
    </div>
  );
}
