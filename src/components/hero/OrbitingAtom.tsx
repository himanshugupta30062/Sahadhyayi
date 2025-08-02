import React, { useState, useEffect } from "react";
import { AtomShell, ATOM_MATERIALS, AtomMaterial } from "./AtomMaterials";

interface OrbitingAtomProps {
  orbitRadius: number;
  letter: string;
  label: string;
  materialId: string;
  duration: number;
  initialAngle: number;
  alternateOrbits?: number[];
  orbitSwitchInterval?: number;
  size?: number;
  onHoverChange?: (isHovered: boolean) => void;
}

export const OrbitingAtom: React.FC<OrbitingAtomProps> = ({
  orbitRadius,
  letter,
  label,
  materialId,
  duration,
  initialAngle,
  alternateOrbits = [],
  orbitSwitchInterval = 15000,
  size = 48,
  onHoverChange,
}) => {
  const [currentOrbitRadius, setCurrentOrbitRadius] = useState(orbitRadius);
  const [isHovered, setIsHovered] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(initialAngle);
  
  const material = ATOM_MATERIALS[materialId];
  const orbitSize = currentOrbitRadius * 2;

  // Dynamic orbit switching with angle constraint
  useEffect(() => {
    if (alternateOrbits.length === 0) return;
    
    const interval = setInterval(() => {
      const allOrbits = [orbitRadius, ...alternateOrbits];
      const currentIndex = allOrbits.indexOf(currentOrbitRadius);
      const nextIndex = (currentIndex + 1) % allOrbits.length;
      const nextOrbit = allOrbits[nextIndex];
      
      // When switching orbits, ensure we stay within the colored arc (0-180 degrees)
      setCurrentOrbitRadius(nextOrbit);
      
      // If current angle is outside the colored arc, move to within the arc
      setCurrentAngle(prevAngle => {
        const normalizedAngle = prevAngle % 360;
        if (normalizedAngle > 180 && normalizedAngle < 360) {
          // If in the blank space (180-360), move to equivalent position in colored arc (0-180)
          return normalizedAngle - 180;
        }
        return normalizedAngle;
      });
    }, orbitSwitchInterval);

    return () => clearInterval(interval);
  }, [orbitRadius, alternateOrbits, orbitSwitchInterval, currentOrbitRadius]);

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        width: orbitSize,
        height: orbitSize,
        left: `calc(50% - ${currentOrbitRadius}px)`,
        top: `calc(50% - ${currentOrbitRadius}px)`,
        transition: "all 2s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <div
        className="group w-full h-full absolute"
        style={{
          animation: isHovered ? "none" : `constrainedOrbit-${duration} ${duration}s linear infinite`,
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
              animation: isHovered ? "none" : `constrainedCounterRotate-${duration} ${duration}s linear infinite`,
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
        @keyframes constrainedOrbit-${duration} {
          0% { transform: rotate(0deg); }
          50% { transform: rotate(180deg); }
          50.01% { transform: rotate(0deg); }
          100% { transform: rotate(180deg); }
        }
        @keyframes constrainedCounterRotate-${duration} {
          0% { transform: rotate(0deg); }
          50% { transform: rotate(-180deg); }
          50.01% { transform: rotate(0deg); }
          100% { transform: rotate(-180deg); }
        }
      `}</style>
    </div>
  );
};