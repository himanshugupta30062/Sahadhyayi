// HeroAtomicRings.tsx — five animated orbits for the Sahadhyayi reading ecosystem.

import React, { useEffect, useId, useRef } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

const toRadTop = (deg: number) => (deg - 90) * (Math.PI / 180);
const norm = (angle: number) => ((angle % 360) + 360) % 360;
const pos = (radius: number, deg: number) => ({
  x: radius * Math.cos(toRadTop(deg)),
  y: radius * Math.sin(toRadTop(deg)),
});

function arcPath(radius: number, startDeg: number, endDeg: number) {
  const a0 = toRadTop(startDeg);
  const a1 = toRadTop(endDeg);
  const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  const x0 = radius * Math.cos(a0);
  const y0 = radius * Math.sin(a0);
  const x1 = radius * Math.cos(a1);
  const y1 = radius * Math.sin(a1);
  return `M ${x0} ${y0} A ${radius} ${radius} 0 ${largeArc} 1 ${x1} ${y1}`;
}

type OrbitIcon = "book" | "quill" | "people" | "article" | "games";

interface OrbitConfig {
  id: string;
  label: string;
  href: string;
  icon: OrbitIcon;
  radius: number;
  strokeWidth: number;
  atomRadius: number;
  atomColor: string;
  gradientColors: [string, string, string, string];
  start: number;
  duration: number;
  direction: 1 | -1;
  initialProgress: number;
}

const ORBITS: OrbitConfig[] = [
  {
    id: "library",
    label: "Library",
    href: "/library",
    icon: "book",
    radius: 285,
    strokeWidth: 20,
    atomRadius: 15,
    atomColor: "#ef4444",
    gradientColors: ["#ff9ecf", "#ff4d8d", "#ff1f5a", "#be123c"],
    start: -18,
    duration: 42,
    direction: 1,
    initialProgress: 48,
  },
  {
    id: "authors",
    label: "Authors",
    href: "/authors",
    icon: "quill",
    radius: 255,
    strokeWidth: 14,
    atomRadius: 14,
    atomColor: "#22c55e",
    gradientColors: ["#86efac", "#4ade80", "#22c55e", "#166534"],
    start: 12,
    duration: 37,
    direction: -1,
    initialProgress: 112,
  },
  {
    id: "social",
    label: "Social Media",
    href: "/social",
    icon: "people",
    radius: 225,
    strokeWidth: 10,
    atomRadius: 14,
    atomColor: "#3b82f6",
    gradientColors: ["#93c5fd", "#60a5fa", "#3b82f6", "#1e3a8a"],
    start: -36,
    duration: 32,
    direction: 1,
    initialProgress: 190,
  },
  {
    id: "articles",
    label: "Articles",
    href: "/articles",
    icon: "article",
    radius: 210,
    strokeWidth: 8,
    atomRadius: 13,
    atomColor: "#d99a24",
    gradientColors: ["#f8d887", "#eab545", "#d99a24", "#986515"],
    start: 24,
    duration: 28,
    direction: -1,
    initialProgress: 84,
  },
  {
    id: "games",
    label: "Games",
    href: "/games",
    icon: "games",
    radius: 198,
    strokeWidth: 6,
    atomRadius: 13,
    atomColor: "#8b5cf6",
    gradientColors: ["#c4b5fd", "#a78bfa", "#8b5cf6", "#5b21b6"],
    start: -8,
    duration: 24,
    direction: 1,
    initialProgress: 150,
  },
];

interface HeroAtomicRingsProps {
  size?: number | string;
  className?: string;
  children?: ReactNode;
}

export default function HeroAtomicRings({ size = 720, className = "", children }: HeroAtomicRingsProps) {
  const navigate = useNavigate();
  const generatedId = useId().replace(/:/g, "");
  const gradientId = (orbitId: string) => `g-${orbitId}-${generatedId}`;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const ringRefs = useRef<(SVGGElement | null)[]>([]);
  const atomRefs = useRef<(SVGGElement | null)[]>([]);
  const ringAngles = useRef(ORBITS.map(() => 0));
  // Each atom moves only along its own coloured arc and fades near the gap.
  const atomProgress = useRef(ORBITS.map((orbit) => orbit.initialProgress));
  const pausedForKeyboard = useRef(false);
  const COVERAGE = 0.65;
  const SWEEP_DEG = 360 * COVERAGE;
  const ATOM_SPEED = 30;
  const ATOM_FADE_ANGLE = 18;

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let prefersReducedMotion = motionQuery.matches;
    let raf: number | null = null;
    let isInViewport = true;
    let lastFrameTime = performance.now();

    const renderScene = () => {
      ringRefs.current.forEach((ring, index) => {
        ring?.setAttribute("transform", `rotate(${ringAngles.current[index] || 0} 0 0)`);
      });

      atomRefs.current.forEach((atom, index) => {
        if (!atom) return;
        const orbit = ORBITS[index];
        const progress = atomProgress.current[index] ?? 0;
        const angle = norm(orbit.start + (ringAngles.current[index] || 0) + progress);
        const point = pos(orbit.radius, angle);
        atom.setAttribute("transform", `translate(${point.x}, ${point.y})`);
        const distanceFromEdge = Math.min(progress, SWEEP_DEG - progress);
        atom.setAttribute("opacity", String(Math.max(0, Math.min(1, distanceFromEdge / ATOM_FADE_ANGLE))));
      });
    };

    const tick = (now: number) => {
      const elapsed = Math.min(0.05, Math.max(0, (now - lastFrameTime) / 1000));
      lastFrameTime = now;

      if (!pausedForKeyboard.current && !document.hidden && !prefersReducedMotion) {
        ringAngles.current = ringAngles.current.map((angle, index) =>
          norm(angle + (360 / ORBITS[index].duration) * ORBITS[index].direction * elapsed),
        );
        atomProgress.current = atomProgress.current.map(
          (progress) => (progress + ATOM_SPEED * elapsed) % SWEEP_DEG,
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
      if (prefersReducedMotion || document.hidden || !isInViewport || raf !== null) return;
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

    const observer = typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver(([entry]) => {
          isInViewport = entry.isIntersecting;
          if (isInViewport) startAnimation();
          else stopAnimation();
        }, { rootMargin: "100px" })
      : null;
    if (containerRef.current) observer?.observe(containerRef.current);

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
      observer?.disconnect();
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

  const coverSweep = (radius: number, start: number) => arcPath(radius, start, start + SWEEP_DEG);

  const renderOrbitIcon = (icon: OrbitIcon) => {
    switch (icon) {
      case "book":
        return (
          <path
            d="M -6 -3.5 C -3 -4.5 -1 -4.5 0 -2.5 C 1 -4.5 3 -4.5 6 -3.5 L 6 3.5 C 3 2.5 1 2.5 0 4.5 C -1 2.5 -3 2.5 -6 3.5 Z M 0 -2.5 L 0 4.5"
            fill="none" stroke="#ffffff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"
          />
        );
      case "quill":
        return (
          <path
            d="M 3.5 -5 L 4.5 -4 L -2.2 2.7 C -3.5 4.2 -4.7 4.4 -4.7 4.4 C -4.7 4.4 -4.5 3 -3.1 1.8 Z M -1.5 2 L 1.6 3.1"
            fill="none" stroke="#ffffff" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"
          />
        );
      case "people":
        return (
          <>
            <circle cx="-2" cy="-2.5" r="2.2" fill="#ffffff" />
            <path d="M -5.5 3.5 C -5.5 1.5 -3 1.5 -2 1.5 C -1 1.5 1.5 1.5 1.5 3.5" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="2.5" cy="-2" r="1.8" fill="#ffffff" />
            <path d="M 2 1.8 C 2.5 1.8 4.5 2 4.5 3.5" fill="none" stroke="#ffffff" strokeWidth="1.1" strokeLinecap="round" />
          </>
        );
      case "article":
        return (
          <path
            d="M -4.5 -5.5 H 1.8 L 5 -2.3 V 5.5 H -4.5 Z M 1.8 -5.5 V -2.3 H 5 M -2 0.2 H 2.5 M -2 2.7 H 2"
            fill="none" stroke="#ffffff" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round"
          />
        );
      case "games":
        return (
          <>
            <rect x="-4.5" y="-4.5" width="9" height="9" rx="1.8" fill="none" stroke="#ffffff" strokeWidth="1.2" />
            <circle cx="-2" cy="-2" r="0.9" fill="#ffffff" />
            <circle cx="2" cy="2" r="0.9" fill="#ffffff" />
            <circle cx="2" cy="-2" r="0.9" fill="#ffffff" />
            <circle cx="-2" cy="2" r="0.9" fill="#ffffff" />
          </>
        );
    }
  };

  return (
    <div
      ref={containerRef}
      className={"relative w-full h-full aspect-square flex items-center justify-center " + className}
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
        aria-label="Explore Sahadhyayi through the Library, Authors, Social Media, Articles, and Games orbits"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {ORBITS.map((orbit) => (
            <linearGradient
              key={orbit.id}
              id={gradientId(orbit.id)}
              gradientUnits="userSpaceOnUse"
              x1={-orbit.radius}
              y1={-orbit.radius}
              x2={orbit.radius}
              y2={orbit.radius}
            >
              {orbit.gradientColors.map((color, index) => (
                <stop key={color} offset={`${(index / (orbit.gradientColors.length - 1)) * 100}%`} stopColor={color} />
              ))}
            </linearGradient>
          ))}
        </defs>

        {ORBITS.map((orbit, index) => (
          <g key={orbit.id}>
            <circle
              r={orbit.radius}
              cx={0}
              cy={0}
              fill="none"
              stroke="rgba(0,0,0,0.06)"
              className="dark:stroke-[rgba(255,255,255,0.09)]"
              strokeWidth={orbit.strokeWidth}
            />
            <g ref={(element) => { ringRefs.current[index] = element; }}>
              <path
                d={coverSweep(orbit.radius, orbit.start)}
                fill="none"
                stroke={`url(#${gradientId(orbit.id)})`}
                strokeWidth={orbit.strokeWidth}
                strokeLinecap="round"
              />
            </g>
          </g>
        ))}

        {ORBITS.map((orbit, index) => (
          <g
            key={`${orbit.id}-atom`}
            ref={(element) => { atomRefs.current[index] = element; }}
            role="link"
            tabIndex={0}
            aria-label={`Explore ${orbit.label}`}
            onClick={() => navigate(orbit.href)}
            onKeyDown={(event) => handleNodeKeyDown(event, orbit.href)}
            onFocus={() => setKeyboardPause(true)}
            onBlur={() => setKeyboardPause(false)}
            className="pointer-events-auto cursor-pointer outline-none"
          >
            <circle r={orbit.atomRadius} fill={orbit.atomColor} />
            {renderOrbitIcon(orbit.icon)}
            <text
              y={orbit.label === "Social Media" ? 27 : 26}
              textAnchor="middle"
              fontSize={orbit.label === "Social Media" ? 8 : 9}
              fontWeight={600}
              fill="currentColor"
              className="text-[#1C201D] dark:text-[#f8fafc]"
            >
              {orbit.label}
            </text>
          </g>
        ))}
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="w-full max-w-[92%] sm:max-w-[88%] pointer-events-auto flex items-center justify-center">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
