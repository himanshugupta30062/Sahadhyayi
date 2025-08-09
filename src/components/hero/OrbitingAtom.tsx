import React, { useState, useEffect } from "react";
import { AtomShell, ATOM_MATERIALS, AtomMaterial } from "./AtomMaterials";

interface OrbitingAtomProps {
  orbitRadius: number;
  letter: string;
  label: string;
  materialId: string;
  duration: number;
  initialAngle: number;
  availableOrbits: number[];
  orbitSwitchInterval?: number;
  size?: number;
  onHoverChange?: (isHovered: boolean) => void;
  onOrbitChange?: (newOrbit: number) => void;
  isPaused?: boolean;
}

export const OrbitingAtom: React.FC<OrbitingAtomProps> = ({
  orbitRadius,
  letter,
  label,
  materialId,
  duration,
  initialAngle,
  availableOrbits,
  orbitSwitchInterval = 15000,
  size = 48,
  onHoverChange,
  onOrbitChange,
  isPaused = false,
}) => {
  const [currentOrbitRadius, setCurrentOrbitRadius] = useState(orbitRadius);
  const [isHovered, setIsHovered] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const material = ATOM_MATERIALS[materialId];
  const orbitSize = currentOrbitRadius * 2;

  // Chemistry rule: Switch to unoccupied orbits only
  useEffect(() => {
    if (availableOrbits.length <= 1) return; // No alternatives available
    
    const interval = setInterval(() => {
      if (isHovered || isTransitioning) return; // Don't switch during hover or transition
      
      const otherOrbits = availableOrbits.filter(orbit => orbit !== currentOrbitRadius);
      if (otherOrbits.length > 0) {
        setIsTransitioning(true);
        const nextOrbit = otherOrbits[Math.floor(Math.random() * otherOrbits.length)];
        
        // Smooth transition with pleasant timing
        setTimeout(() => {
          setCurrentOrbitRadius(nextOrbit);
          onOrbitChange?.(nextOrbit);
          
          setTimeout(() => {
            setIsTransitioning(false);
          }, 2000); // Transition duration
        }, 500); // Small delay for natural feel
      }
    }, orbitSwitchInterval);

    return () => clearInterval(interval);
  }, [availableOrbits, currentOrbitRadius, orbitSwitchInterval, isHovered, isTransitioning, onOrbitChange]);

  // Update orbit when prop changes (from parent state management)
  useEffect(() => {
    if (orbitRadius !== currentOrbitRadius) {
      setCurrentOrbitRadius(orbitRadius);
    }
  }, [orbitRadius]);

  // Match the AtomicRing's arc path exactly - full circle with stroke compensation
  const strokeWidth = 28; // Match AtomicRing strokeWidth
  const pathRadius = currentOrbitRadius - strokeWidth / 2; // Match ring's arc radius
  const center = currentOrbitRadius;
  
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        width: orbitSize,
        height: orbitSize,
        left: `calc(50% - ${currentOrbitRadius}px)`,
        top: `calc(50% - ${currentOrbitRadius}px)`,
        transition: "all 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        opacity: isTransitioning ? 0.7 : 1,
      }}
    >
      <div
        className="absolute"
        style={{
          offsetPath: `circle(${pathRadius}px at ${center}px ${center}px)`,
          offsetRotate: "0deg",
          animation: `moveAtom-${duration} ${duration}s linear infinite`,
          animationPlayState: (isHovered || isTransitioning || isPaused) ? "paused" : "running",
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
        @keyframes moveAtom-${duration} {
          0% { offset-distance: 0%; }
          100% { offset-distance: 100%; }
        }
      `}</style>
    </div>
  );
};
