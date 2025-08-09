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
  library: {
    id: "library",
    name: "Library",
    background: "linear-gradient(135deg, #fee2e2, #dc2626, #991b1b)",
    textColor: "#ffffff",
    border: "3px solid rgba(220, 38, 38, 0.8)",
    shadowColor: "rgba(220, 38, 38, 0.4)",
    glowEffect: "0 0 30px rgba(220, 38, 38, 0.6), 0 0 60px rgba(220, 38, 38, 0.3)",
  },
  author: {
    id: "author",
    name: "Authors",
    background: "linear-gradient(135deg, #d1fae5, #10b981, #059669)",
    textColor: "#ffffff",
    border: "3px solid rgba(16, 185, 129, 0.8)",
    shadowColor: "rgba(16, 185, 129, 0.4)",
    glowEffect: "0 0 30px rgba(16, 185, 129, 0.6), 0 0 60px rgba(16, 185, 129, 0.3)",
  },
  social: {
    id: "social",
    name: "Social Media",
    background: "linear-gradient(135deg, #dbeafe, #3b82f6, #1d4ed8)",
    textColor: "#ffffff",
    border: "3px solid rgba(59, 130, 246, 0.8)",
    shadowColor: "rgba(59, 130, 246, 0.4)",
    glowEffect: "0 0 30px rgba(59, 130, 246, 0.6), 0 0 60px rgba(59, 130, 246, 0.3)",
  },
};

interface AtomShellProps {
  material: AtomMaterial;
  letter: string;
  isHovered: boolean;
  size?: number;
}

export const AtomShell: React.FC<AtomShellProps> = ({
  material,
  letter,
  isHovered,
  size = 48,
}) => {
  return (
    <div
      className="rounded-full flex items-center justify-center cursor-pointer relative"
      style={{ width: size, height: size, overflow: "visible", willChange: "transform" }}
    >
      <div
        className="rounded-full flex items-center justify-center font-bold transition-transform duration-500 relative"
        style={{
          width: size,
          height: size,
          fontSize: size * 0.375, // Responsive font size based on atom size
          background: material.background,
          color: material.textColor,
          border: material.border,
          boxShadow: isHovered
            ? `${material.glowEffect}, 0 8px 32px ${material.shadowColor}`
            : `0 4px 20px ${material.shadowColor}`,
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
      </div>
    </div>
  );
};