import React, { useState } from "react";
import { ATOM_MATERIALS } from "./AtomMaterials";
import { AtomShell } from "./AtomShell";

interface OrbitingAtomProps {
  orbitRadius: number;
  letter: string;
  label: string;
  materialId: string;
  duration: number;
  initialAngle: number;
  size?: number;
  strokeWidth?: number;
  onHoverChange?: (isHovered: boolean) => void;
  isPaused?: boolean;
}

export const OrbitingAtom: React.FC<OrbitingAtomProps> = ({
  orbitRadius,
  letter,
  label,
  materialId,
  duration,
  initialAngle,
  size = 48,
  strokeWidth = 28,
  onHoverChange,
  isPaused = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const material = ATOM_MATERIALS[materialId];
  const orbitSize = orbitRadius * 2;

  // Match the AtomicRing's ring radius with stroke compensation
  const pathRadius = orbitRadius - (strokeWidth ?? 28) / 2;
  const center = orbitRadius;

  // Build the same 180° arc path as AtomicRing (right-side)
  const startAngle = -90;
  const endAngle = 90;
  const startX = center + pathRadius * Math.cos((startAngle * Math.PI) / 180);
  const startY = center + pathRadius * Math.sin((startAngle * Math.PI) / 180);
  const endX = center + pathRadius * Math.cos((endAngle * Math.PI) / 180);
  const endY = center + pathRadius * Math.sin((endAngle * Math.PI) / 180);
  const arcPath = `path('M ${startX} ${startY} A ${pathRadius} ${pathRadius} 0 0 1 ${endX} ${endY}')`;

  const animationDelay = `-${(initialAngle / 360) * duration}s`;
  
  return (
    <div
      className="absolute pointer-events-none z-[4]"
      style={{
        width: orbitSize,
        height: orbitSize,
        left: `calc(50% - ${orbitRadius}px)`,
        top: `calc(50% - ${orbitRadius}px)`,
        willChange: "left, top, width, height",
      }}
    >
      <div
        className="absolute"
        style={{
          offsetPath: arcPath,
          offsetRotate: "0deg",

          animation: `orbit-move ${duration}s linear infinite`,
          animationDelay,
          animationPlayState: (isHovered || isPaused) ? "paused" : "running",
          willChange: "offset-distance, transform",
        }}
      >
        <div
          className="relative pointer-events-auto cursor-pointer flex flex-col items-center"
          style={{ transform: "translate(-50%, -50%)" }}
          onMouseEnter={() => {
            setIsHovered(true);
            onHoverChange?.(true);
          }}
          onMouseLeave={() => {
            setIsHovered(false);
            onHoverChange?.(false);
          }}
          onTouchStart={() => {
            setIsHovered(true);
            onHoverChange?.(true);
          }}
          onTouchEnd={() => {
            setIsHovered(false);
            onHoverChange?.(false);
          }}
        >
          <AtomShell
            material={material}
            letter={letter}
            isHovered={isHovered}
            size={size}
          />
          {/* Always-visible label for accessibility */}
          <div
            className="mt-1 px-2 py-0.5 rounded-full text-xs font-medium text-white bg-black/80 pointer-events-none whitespace-nowrap"
          >
            {label}
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes orbit-move {
          0%   { offset-distance: 0%; }
          100% { offset-distance: 100%; }
        }
        @-webkit-keyframes orbit-move {
          0%   { -webkit-offset-distance: 0%;   offset-distance: 0%; }
          100% { -webkit-offset-distance: 100%; offset-distance: 100%; }
        }
      `}</style>
    </div>
  );
};
