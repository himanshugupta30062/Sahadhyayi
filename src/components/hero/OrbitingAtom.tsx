import React from "react";

interface OrbitingAtomProps {
  orbitRadius: number;
  letter: string;
  label: string;
  bgColor: string;
  textColor: string;
  duration: number;
  initialAngle: number;
}

export const OrbitingAtom: React.FC<OrbitingAtomProps> = ({
  orbitRadius,
  letter,
  label,
  bgColor,
  textColor,
  duration,
  initialAngle,
}) => {
  const orbitSize = orbitRadius * 2;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        width: orbitSize,
        height: orbitSize,
        left: `calc(50% - ${orbitRadius}px)`,
        top: `calc(50% - ${orbitRadius}px)`,
      }}
    >
      <div
        className="group w-full h-full absolute"
        style={{
          animation: `orbit-${duration} ${duration}s linear infinite`,
          transform: `rotate(${initialAngle}deg)`,
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
        >
          <div 
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-2xl font-bold text-lg cursor-pointer transition-all duration-300 hover:scale-110 ${bgColor} ${textColor}`}
            style={{ 
              boxShadow: "0 0 32px 8px rgba(255,255,255,0.1)",
            }}
          >
            {letter}
            <span className="absolute top-full left-1/2 transform -translate-x-1/2 mt-3 bg-white/95 text-black px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl z-20 whitespace-nowrap text-sm font-medium backdrop-blur-sm">
              {label}
            </span>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes orbit-${duration} {
          0% { transform: rotate(${initialAngle}deg); }
          100% { transform: rotate(${360 + initialAngle}deg); }
        }
      `}</style>
    </div>
  );
};