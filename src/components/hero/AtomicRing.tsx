import React from "react";

interface AtomicRingProps {
  radius: number;
  color: string;
  rotation: number;
  duration: number;
  strokeWidth?: number;
}

export const AtomicRing: React.FC<AtomicRingProps> = ({
  radius,
  color,
  rotation,
  duration,
  strokeWidth = 28
}) => {
  const size = radius * 2;
  const center = radius;
  const arcRadius = radius - strokeWidth / 2;

  // Create a 180-degree arc path
  const createArcPath = () => {
    const startAngle = 0;
    const endAngle = 180;
    const startX = center + arcRadius * Math.cos((startAngle - 90) * Math.PI / 180);
    const startY = center + arcRadius * Math.sin((startAngle - 90) * Math.PI / 180);
    const endX = center + arcRadius * Math.cos((endAngle - 90) * Math.PI / 180);
    const endY = center + arcRadius * Math.sin((endAngle - 90) * Math.PI / 180);
    
    return `M ${startX} ${startY} A ${arcRadius} ${arcRadius} 0 0 1 ${endX} ${endY}`;
  };

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        width: size,
        height: size,
        left: `calc(50% - ${radius}px)`,
        top: `calc(50% - ${radius}px)`,
        transform: `rotate(${rotation}deg)`,
        animation: `spin-${duration} ${duration}s linear infinite`,
      }}
    >
      <svg width={size} height={size} className="absolute inset-0">
        <defs>
          <linearGradient id="red-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="50%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#f87171" />
          </linearGradient>
          <filter id={`glow-${radius}`}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <path
          d={createArcPath()}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          filter={`url(#glow-${radius})`}
        />
      </svg>
      <style>{`
        @keyframes spin-${duration} {
          0% { transform: rotate(${rotation}deg); }
          100% { transform: rotate(${360 + rotation}deg); }
        }
      `}</style>
    </div>
  );
};