import React, { useMemo } from "react";

interface AtomicRingProps {
  radius: number;          // px
  color: string;           // solid or "url(#ring-gradient-*)"
  rotation: number;        // starting angle
  duration: number;        // seconds per 360° rotation
  strokeWidth?: number;    // px
  isPaused?: boolean;
  gapDegrees?: number;     // visual gap at arc ends
  glow?: number;           // 0..4, glow strength
}

export const AtomicRing: React.FC<AtomicRingProps> = ({
  radius,
  color,
  rotation,
  duration,
  strokeWidth = 28,
  isPaused = false,
  gapDegrees = 14,
  glow = 2.2,
}) => {
  const size = radius * 2;
  const c = radius;
  const r = Math.max(1, radius - strokeWidth / 2);

  // top half-arc with a little gap at each end
  const d = useMemo(() => {
    const start = (-90 + gapDegrees / 2) * (Math.PI / 180);
    const end   = ( 90 - gapDegrees / 2) * (Math.PI / 180);
    const sx = c + r * Math.cos(start);
    const sy = c + r * Math.sin(start);
    const ex = c + r * Math.cos(end);
    const ey = c + r * Math.sin(end);
    return `M ${sx} ${sy} A ${r} ${r} 0 0 1 ${ex} ${ey}`;
  }, [c, r, gapDegrees]);

  return (
    <div
      className="absolute pointer-events-none z-[1]"
      style={{
        width: size,
        height: size,
        left: `calc(50% - ${radius}px)`,
        top:  `calc(50% - ${radius}px)`,
        transformOrigin: "50% 50%",
        animation: `atomic-spin ${duration}s linear infinite`,
        animationPlayState: isPaused ? "paused" : "running",
        willChange: "transform",
      }}
    >
      <svg width={size} height={size} className="absolute inset-0">
        <defs>
          {/* OUTER gradient: cyan -> teal -> magenta (like the screenshot) */}
          <linearGradient id="ring-gradient-outer" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#20E0D2" />
            <stop offset="52%"  stopColor="#13C296" />
            <stop offset="100%" stopColor="#FF3EA5" />
          </linearGradient>
          {/* MIDDLE gradient: deep navy -> blue */}
          <linearGradient id="ring-gradient-middle" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#0B1E3A" />
            <stop offset="100%" stopColor="#1B68FF" />
          </linearGradient>
          {/* INNER gradient: blue greenish cycle */}
          <linearGradient id="ring-gradient-inner" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#1AD1B9" />
            <stop offset="100%" stopColor="#19A0F5" />
          </linearGradient>

          <filter id={`ring-glow-${radius}`}>
            <feGaussianBlur stdDeviation={glow} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          filter={`url(#ring-glow-${radius})`}
        />
      </svg>

      <style>{`
        @keyframes atomic-spin {
          0%   { transform: rotate(${rotation}deg); }
          100% { transform: rotate(${360 + rotation}deg); }
        }
      `}</style>
    </div>
  );
};
