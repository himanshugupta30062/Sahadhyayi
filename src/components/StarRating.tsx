import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  readOnly?: boolean;
  onChange?: (value: number) => void;
}

const StarRating: React.FC<StarRatingProps> = ({ value, readOnly = false, onChange }) => {
  return (
    <div className="flex">
      {Array.from({ length: 5 }, (_, i) => {
        const filled = i < Math.round(value);
        return (
          <Star
            key={i}
            className={`w-5 h-5 ${filled ? 'text-yellow-500 fill-current' : 'text-gray-300'} ${readOnly ? '' : 'cursor-pointer'}`}
            onClick={!readOnly && onChange ? () => onChange(i + 1) : undefined}
          />
        );
      })}
    </div>
  );
};

export default StarRating;
