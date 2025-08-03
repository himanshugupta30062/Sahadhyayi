import React from "react";
import { LucideIcon } from "lucide-react";

interface FloatingIconProps {
  Icon: LucideIcon;
  position: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  color: string;
  delay: number;
  size?: number;
}

export const FloatingIcon: React.FC<FloatingIconProps> = ({
  Icon,
  position,
  color,
  delay,
  size = 64,
}) => {
  return (
    <div
      className="absolute flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm shadow-2xl transition-all duration-500 hover:scale-110 z-[3]"
      style={{
        ...position,
        width: size,
        height: size,
        animation: `iconPulse 4s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    >
      <Icon size={size / 2} className={color} />
      <style>{`
        @keyframes iconPulse {
          0%, 100% {
            opacity: 0.8;
            transform: scale(1);
          }
          50% { 
            opacity: 0.3; 
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
};