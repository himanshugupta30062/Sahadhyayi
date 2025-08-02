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
  metallic: {
    id: "metallic",
    name: "Metallic",
    background: "linear-gradient(135deg, #d4af37, #ffd700, #b8860b)",
    textColor: "#1a1a1a",
    border: "2px solid rgba(255, 215, 0, 0.6)",
    shadowColor: "rgba(255, 215, 0, 0.4)",
    glowEffect: "0 0 30px rgba(255, 215, 0, 0.6)",
  },
  crystal: {
    id: "crystal",
    name: "Crystal",
    background: "linear-gradient(135deg, #e0f2fe, #b3e5fc, #81d4fa)",
    textColor: "#0d47a1",
    border: "2px solid rgba(129, 212, 250, 0.8)",
    shadowColor: "rgba(129, 212, 250, 0.5)",
    glowEffect: "0 0 30px rgba(129, 212, 250, 0.7)",
  },
  plasma: {
    id: "plasma",
    name: "Plasma",
    background: "linear-gradient(135deg, #1de9b6, #00bcd4, #4dd0e1)",
    textColor: "#ffffff",
    border: "2px solid rgba(29, 233, 182, 0.8)",
    shadowColor: "rgba(29, 233, 182, 0.5)",
    glowEffect: "0 0 30px rgba(29, 233, 182, 0.8)",
  },
};

interface AtomShellProps {
  material: AtomMaterial;
  letter: string;
  label: string;
  isHovered: boolean;
}

export const AtomShell: React.FC<AtomShellProps> = ({
  material,
  letter,
  label,
  isHovered,
}) => {
  return (
    <div
      className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl cursor-pointer transition-all duration-500 relative overflow-hidden"
      style={{
        background: material.background,
        color: material.textColor,
        border: material.border,
        boxShadow: isHovered ? 
          `${material.glowEffect}, 0 8px 32px ${material.shadowColor}` : 
          `0 4px 20px ${material.shadowColor}`,
        transform: isHovered ? "scale(1.15)" : "scale(1)",
      }}
    >
      {/* Inner glow effect */}
      <div
        className="absolute inset-1 rounded-full opacity-30"
        style={{
          background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), transparent 50%)`,
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