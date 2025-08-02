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
}) => {
  const [currentOrbitRadius, setCurrentOrbitRadius] = useState(orbitRadius);
  const [isHovered, setIsHovered] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(initialAngle);
  
  const material = ATOM_MATERIALS[materialId];
  const orbitSize = currentOrbitRadius * 2;

  // Dynamic orbit switching
  useEffect(() => {
    if (alternateOrbits.length === 0) return;
    
    const interval = setInterval(() => {
      const allOrbits = [orbitRadius, ...alternateOrbits];
      const currentIndex = allOrbits.indexOf(currentOrbitRadius);
      const nextIndex = (currentIndex + 1) % allOrbits.length;
      setCurrentOrbitRadius(allOrbits[nextIndex]);
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
          animation: `orbit-${duration} ${duration}s linear infinite`,
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
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div
            style={{
              animation: `counter-rotate-${duration} ${duration}s linear infinite`,
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
        @keyframes orbit-${duration} {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes counter-rotate-${duration} {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
      `}</style>
    </div>
  );
};