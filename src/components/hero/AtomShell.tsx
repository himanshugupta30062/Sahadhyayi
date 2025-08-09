import React from "react";
import { AtomMaterial } from "./AtomMaterials";

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
          fontSize: size * 0.375,
          background: material.background,
          color: material.textColor,
          border: material.border,
          boxShadow: isHovered
            ? `${material.glowEffect}, 0 8px 32px ${material.shadowColor}`
            : `0 4px 20px ${material.shadowColor}`,
          transform: isHovered ? "scale(1.15)" : "scale(1)",
        }}
      >
        <div
          className="absolute rounded-full opacity-20"
          style={{
            inset: size * 0.125,
            background: `radial-gradient(circle at 30% 30%, rgba(0,0,0,0.1), transparent 50%)`,
          }}
        />
        <span className="relative z-10 font-extrabold tracking-wider">{letter}</span>
      </div>
    </div>
  );
};
