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
      
      {/* Enhanced Tooltip */}
      <div
        className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-6 rounded-xl transition-all duration-500 shadow-2xl z-[100] whitespace-nowrap text-base font-semibold pointer-events-none"
        style={{
          opacity: isHovered ? 1 : 0,
          transform: isHovered ?
            "translate(-50%, 0) scale(1)" :
            "translate(-50%, 15px) scale(0.8)",
          visibility: isHovered ? "visible" : "hidden",
          background: `linear-gradient(135deg, rgba(0,0,0,0.95), rgba(0,0,0,0.85))`,
          color: "#ffffff",
          border: `2px solid ${material.border.match(/rgba\([^)]+\)/)?.[0] || material.border}`,
          padding: "0.75rem 1.25rem",
          backdropFilter: "blur(8px)",
          boxShadow: material.glowEffect + ", 0 8px 32px rgba(0,0,0,0.3)",
          minWidth: "120px",
          textAlign: "center" as const,
        }}
      >
        {letter} - {label}
        <div
          className="absolute top-full left-1/2 transform -translate-x-1/2 w-3 h-3 rotate-45"
          style={{ 
            marginTop: "-6px", 
            background: "linear-gradient(135deg, rgba(0,0,0,0.95), rgba(0,0,0,0.85))",
            border: `2px solid ${material.border.match(/rgba\([^)]+\)/)?.[0] || material.border}`,
            borderTop: "none",
            borderLeft: "none"
          }}
        />
      </div>
    </div>
  );
};