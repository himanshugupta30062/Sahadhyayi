import React from "react";
import { BookOpen, Brain } from "lucide-react";

interface BookExpertIconProps {
  size?: number;
  color?: string; // Tailwind class like "text-emerald-400"
}

export const BookExpertIcon: React.FC<BookExpertIconProps> = ({
  size = 64,
  color = "text-emerald-400",
}) => {
  const brainSize = size * 0.45;
  return (
    <div className="relative inline-block">
      <BookOpen className={color} size={size} />
      <Brain
        className={`${color} absolute`}
        size={brainSize}
        style={{
          top: size * 0.05,
          right: size * 0.05,
        }}
      />
    </div>
  );
};

export default BookExpertIcon;
