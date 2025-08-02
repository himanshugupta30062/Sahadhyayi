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

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        width: orbitSize,
        height: orbitSize,
        left: `calc(50% - ${currentOrbitRadius}px)`,
        top: `calc(50% - ${currentOrbitRadius}px)`,
        transition: "all 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)", // Smooth, pleasant easing
        opacity: isTransitioning ? 0.7 : 1, // Subtle fade during transition
      }}
    >
      <div
        className="group w-full h-full absolute"
        style={{
          animation: (isHovered || isTransitioning) ? "none" : `coloredArcOrbit-${duration} ${duration}s linear infinite`,
          transformOrigin: "50% 50%",
        }}
      >
        <div
          className="absolute pointer-events-auto"
          style={{
            left: "50%",
            top: "0%",
            transform: "translate(-50%, -50%)",
          }}
          onMouseEnter={() => {
            setIsHovered(true);
            onHoverChange?.(true);
          }}
          onMouseLeave={() => {
            setIsHovered(false);
            onHoverChange?.(false);
          }}
        >
          <div
            style={{
              animation: (isHovered || isTransitioning) ? "none" : `coloredArcCounterRotate-${duration} ${duration}s linear infinite`,
            }}
          >
            <AtomShell
              material={material}
              letter={letter}
              label={label}
              isHovered={isHovered}
              size={size}
            />
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes coloredArcOrbit-${duration} {
          0% { transform: rotate(0deg); }
          50% { transform: rotate(180deg); }
          50.01% { transform: rotate(0deg); }
          100% { transform: rotate(180deg); }
        }
        @keyframes coloredArcCounterRotate-${duration} {
          0% { transform: rotate(0deg); }
          50% { transform: rotate(-180deg); }
          50.01% { transform: rotate(0deg); }
          100% { transform: rotate(-180deg); }
        }
      `}</style>
    </div>
  );
};