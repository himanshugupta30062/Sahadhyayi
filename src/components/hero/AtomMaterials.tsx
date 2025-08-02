import React from "react";

export interface AtomMaterial {
  id: string;
  name: string;
  background: string;
  textColor: string;
  border: string;
  shadowColor: string;
  glowEffect: string;
}

export const ATOM_MATERIALS: Record<string, AtomMaterial> = {
  white: {
    id: "white",
    name: "Standard",
    background: "#ffffff",
    textColor: "#000000",
    border: "2px solid rgba(255, 255, 255, 0.9)",
    shadowColor: "rgba(255, 255, 255, 0.3)",
    glowEffect: "0 0 20px rgba(255, 255, 255, 0.5)",
  },
};

interface AtomShellProps {
  material: AtomMaterial;
  letter: string;
  label: string;
  isHovered: boolean;
  size?: number;
}

export const AtomShell: React.FC<AtomShellProps> = ({
  material,
  letter,
  label,
  isHovered,
  size = 48,
}) => {
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold cursor-pointer transition-all duration-500 relative overflow-hidden"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.375, // Responsive font size based on atom size
        background: material.background,
        color: material.textColor,
        border: material.border,
        boxShadow: isHovered ? 
          `${material.glowEffect}, 0 8px 32px ${material.shadowColor}` : 
          `0 4px 20px ${material.shadowColor}`,
        transform: isHovered ? "scale(1.15)" : "scale(1)",
      }}
    >
      {/* Subtle inner highlight */}
      <div
        className="absolute rounded-full opacity-20"
        style={{
          inset: size * 0.125, // Responsive inset based on size
          background: `radial-gradient(circle at 30% 30%, rgba(0,0,0,0.1), transparent 50%)`,
        }}
      />
      
      {/* Letter */}
      <span className="relative z-10 font-extrabold tracking-wider">
        {letter}
      </span>
      
      {/* Tooltip */}
      <span 
        className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 bg-black/90 text-white px-4 py-2 rounded-lg transition-all duration-300 shadow-2xl z-20 whitespace-nowrap text-sm font-medium backdrop-blur-sm border border-white/20"
        style={{
          opacity: isHovered ? 1 : 0,
          transform: isHovered ? 
            "translate(-50%, 0) scale(1)" : 
            "translate(-50%, -10px) scale(0.9)",
        }}
      >
        {label}
        <div 
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black/90 rotate-45"
          style={{ marginBottom: "-4px" }}
        />
      </span>
    </div>
  );
};