import React from "react";

interface AtomicRingProps {
  radius: number;
  color: string;
  rotation: number;
  duration: number;
  strokeWidth?: number;
  isPaused?: boolean;
}

export const AtomicRing: React.FC<AtomicRingProps> = ({
  radius,
  color,
  rotation,
  duration,
  strokeWidth = 28,
  isPaused = false
}) => {
  const size = radius * 2;
  const center = radius;
  const arcRadius = radius - strokeWidth / 2;


  return (
    <div
      className="absolute pointer-events-none z-[1]"
      style={{
        width: size,
        height: size,
        left: `calc(50% - ${radius}px)`,
        top: `calc(50% - ${radius}px)`,
        transformOrigin: "50% 50%",
        animation: `atomic-spin ${duration}s linear infinite`,
        animationPlayState: isPaused ? "paused" : "running",
        willChange: "transform",
      }}
    >
      <svg width={size} height={size} className="absolute inset-0">
        <defs>
          <linearGradient id="dark-red-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7f1d1d" />
            <stop offset="50%" stopColor="#991b1b" />
            <stop offset="100%" stopColor="#b91c1c" />
          </linearGradient>
          <filter id={`glow-${radius}`}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <circle
          cx={center}
          cy={center}
          r={arcRadius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          filter={`url(#glow-${radius})`}
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
