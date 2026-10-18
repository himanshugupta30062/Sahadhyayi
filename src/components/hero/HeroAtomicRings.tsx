import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

const toRadTop = (degrees: number) => (degrees - 90) * (Math.PI / 180);
const normalizeAngle = (degrees: number) => ((degrees % 360) + 360) % 360;

const pointOnCircle = (radius: number, degrees: number) => {
  const angle = toRadTop(degrees);
  return {
    x: radius * Math.cos(angle),
    y: radius * Math.sin(angle),
  };
};

function arcPath(radius: number, startDegrees: number, endDegrees: number) {
  const start = pointOnCircle(radius, startDegrees);
  const end = pointOnCircle(radius, endDegrees);
  const largeArc = Math.abs(endDegrees - startDegrees) > 180 ? 1 : 0;

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

interface HeroAtomicRingsProps {
  size?: number | string;
  className?: string;
  children?: ReactNode;
}

const RADII = [278, 238, 198] as const;
const STROKES = [18, 13, 9] as const;
const ARC_COVERAGE = 0.72;
const ARC_SWEEP = 360 * ARC_COVERAGE;
const START_ANGLES = [-24, 14, -38] as const;
const ROTATION_DURATIONS = [52, 44, 36] as const;
const ROTATION_DIRECTIONS = [1, -1, 1] as const;
const ATOM_SPEEDS = [16, 19, 14] as const;
const ATOM_FADE_ANGLE = 18;

const DESTINATIONS = [
  { key: 'library', initial: 'L', label: 'Library', href: '/library', color: '#F43F5E' },
  { key: 'authors', initial: 'A', label: 'Authors', href: '/authors', color: '#22C55E' },
  { key: 'social', initial: 'S', label: 'Social Media', href: '/social', color: '#3B82F6' },
] as const;

export default function HeroAtomicRings({
  size = 720,
  className = '',
  children,
}: HeroAtomicRingsProps) {
  const navigate = useNavigate();
  const generatedId = useId().replace(/:/g, '');
  const glowFilterId = `orbit-glow-${generatedId}`;
  const outerGradientId = `orbit-red-${generatedId}`;
  const middleGradientId = `orbit-green-${generatedId}`;
  const innerGradientId = `orbit-blue-${generatedId}`;

  const ringRefs = useRef<(SVGGElement | null)[]>([]);
  const atomRefs = useRef<(SVGGElement | null)[]>([]);
  const ringAngles = useRef<number[]>([0, 0, 0]);
  // The atoms move along their own coloured arc. They fade out before
  // wrapping to the beginning, so they never visibly jump across the gap.
  const atomProgress = useRef<number[]>([52, 126, 204]);
  const pausedForKeyboard = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReducedMotion = motionQuery.matches;
    let animationFrame: number | null = null;
    let lastFrameTime = performance.now();

    const renderScene = () => {
      ringRefs.current.forEach((ring, index) => {
        ring?.setAttribute('transform', `rotate(${ringAngles.current[index] || 0} 0 0)`);
      });

      atomRefs.current.forEach((atom, index) => {
        if (!atom) return;

        const progress = atomProgress.current[index] ?? 0;
        const angle = normalizeAngle(
          START_ANGLES[index] + (ringAngles.current[index] || 0) + progress,
        );
        const point = pointOnCircle(RADII[index], angle);

        atom.setAttribute('transform', `translate(${point.x} ${point.y})`);

        const distanceFromEdge = Math.min(progress, ARC_SWEEP - progress);
        const opacity = Math.max(0, Math.min(1, distanceFromEdge / ATOM_FADE_ANGLE));
        atom.setAttribute('opacity', String(opacity));
      });
    };

    const tick = (now: number) => {
      const elapsed = Math.min(0.05, Math.max(0, (now - lastFrameTime) / 1000));
      lastFrameTime = now;

      if (!pausedForKeyboard.current && !document.hidden) {
        ringAngles.current = ringAngles.current.map((angle, index) =>
          normalizeAngle(angle + (360 / ROTATION_DURATIONS[index]) * ROTATION_DIRECTIONS[index] * elapsed),
        );

        atomProgress.current = atomProgress.current.map((progress, index) =>
          (progress + ATOM_SPEEDS[index] * elapsed) % ARC_SWEEP,
        );

        renderScene();
      }

      animationFrame = window.requestAnimationFrame(tick);
    };

    const stopAnimation = () => {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
      renderScene();
    };

    const startAnimation = () => {
      if (prefersReducedMotion || animationFrame !== null) return;
      lastFrameTime = performance.now();
      animationFrame = window.requestAnimationFrame(tick);
    };

    const onMotionPreferenceChange = (event: MediaQueryListEvent) => {
      prefersReducedMotion = event.matches;
      if (prefersReducedMotion) stopAnimation();
      else startAnimation();
    };

    renderScene();
    startAnimation();

    if (typeof motionQuery.addEventListener === 'function') {
      motionQuery.addEventListener('change', onMotionPreferenceChange);
    } else {
      motionQuery.addListener(onMotionPreferenceChange);
    }

    return () => {
      stopAnimation();
      if (typeof motionQuery.removeEventListener === 'function') {
        motionQuery.removeEventListener('change', onMotionPreferenceChange);
      } else {
        motionQuery.removeListener(onMotionPreferenceChange);
      }
    };
  }, []);

  const setKeyboardPause = (paused: boolean) => {
    pausedForKeyboard.current = paused;
  };

  const navigateTo = (href: string) => {
    navigate(href);
  };

  const handleNodeKeyDown = (event: React.KeyboardEvent<SVGGElement>, href: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      navigateTo(href);
    }
  };

  const ringSize =
    typeof size === 'number'
      ? { width: size, height: size }
      : size === '100%'
        ? { width: '100%', height: '100%' }
        : { width: size, height: size };

  const gradients = [outerGradientId, middleGradientId, innerGradientId];
  const colors = ['#FB7185', '#22C55E', '#3B82F6'];

  return (
    <div
      className={`relative flex aspect-square h-full w-full items-center justify-center ${className}`}
      style={ringSize}
    >
      <svg
        className="block h-full w-full max-h-full max-w-full text-[#1C442D] drop-shadow-[0_12px_22px_rgba(28,32,29,0.07)] dark:text-white dark:drop-shadow-[0_18px_28px_rgba(0,0,0,0.32)]"
        viewBox="-350 -350 700 700"
        preserveAspectRatio="xMidYMid meet"
        role="group"
        aria-label="Explore Sahadhyayi through the Library, Authors, and Social Media orbit"
      >
        <defs>
          <filter id={glowFilterId} x="-70%" y="-70%" width="240%" height="240%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id={outerGradientId} gradientUnits="userSpaceOnUse" x1="-278" y1="-278" x2="278" y2="278">
            <stop offset="0%" stopColor="#FDA4AF" />
            <stop offset="48%" stopColor="#F43F5E" />
            <stop offset="100%" stopColor="#BE123C" />
          </linearGradient>
          <linearGradient id={middleGradientId} gradientUnits="userSpaceOnUse" x1="-238" y1="-238" x2="238" y2="238">
            <stop offset="0%" stopColor="#A3E635" />
            <stop offset="48%" stopColor="#22C55E" />
            <stop offset="100%" stopColor="#15803D" />
          </linearGradient>
          <linearGradient id={innerGradientId} gradientUnits="userSpaceOnUse" x1="-198" y1="-198" x2="198" y2="198">
            <stop offset="0%" stopColor="#93C5FD" />
            <stop offset="48%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>
        </defs>

        {/* Thin neutral tracks add depth without competing with the coloured arcs. */}
        {RADII.map((radius, index) => (
          <circle
            key={`track-${radius}`}
            cx="0"
            cy="0"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKES[index]}
            opacity={index === 0 ? 0.10 : 0.075}
            aria-hidden="true"
          />
        ))}

        {RADII.map((radius, index) => (
          <g
            key={`ring-${radius}`}
            ref={(element) => { ringRefs.current[index] = element; }}
            aria-hidden="true"
          >
            <path
              d={arcPath(radius, START_ANGLES[index], START_ANGLES[index] + ARC_SWEEP)}
              fill="none"
              stroke={`url(#${gradients[index]})`}
              strokeWidth={STROKES[index]}
              strokeLinecap="round"
            />
          </g>
        ))}

        {DESTINATIONS.map((destination, index) => (
          <g
            key={destination.key}
            ref={(element) => { atomRefs.current[index] = element; }}
            role="link"
            tabIndex={0}
            aria-label={`Explore ${destination.label}`}
            className="cursor-pointer outline-none"
            onClick={() => navigateTo(destination.href)}
            onKeyDown={(event) => handleNodeKeyDown(event, destination.href)}
            onFocus={() => setKeyboardPause(true)}
            onBlur={() => setKeyboardPause(false)}
          >
            <circle
              r={index === 0 ? 17 : 16}
              fill={destination.color}
              filter={`url(#${glowFilterId})`}
            />
            <text
              y="4.5"
              textAnchor="middle"
              fontSize="13"
              fontWeight="800"
              fill="#FFFFFF"
              pointerEvents="none"
            >
              {destination.initial}
            </text>
            <text
              y={index === 2 ? 33 : 31}
              textAnchor="middle"
              fontSize={index === 2 ? 10.5 : 11}
              fontWeight="650"
              fill="currentColor"
              className="text-[#1C201D] dark:text-[#F3F0E7]"
              pointerEvents="none"
            >
              {destination.label}
            </text>
            <circle
              className="orbit-focus-ring"
              r="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              opacity="0"
              pointerEvents="none"
            />
          </g>
        ))}
        <style>{`
          .orbit-focus-ring { transition: opacity 120ms ease-out; }
          g[role="link"]:focus-visible .orbit-focus-ring { opacity: 0.85; }
        `}</style>
      </svg>

      {children && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="pointer-events-auto flex w-full max-w-[64%] items-center justify-center">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
