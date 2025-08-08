import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  readOnly?: boolean;
  onChange?: (value: number) => void;
}

const StarRating: React.FC<StarRatingProps> = ({ value, readOnly = false, onChange }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(n => {
        const filled = n <= Math.round(value);
        return (
          <button
            key={n}
            type="button"
            aria-label={`Rate ${n} star`}
            disabled={readOnly}
            onClick={() => !readOnly && onChange?.(n)}
            className={`p-0 bg-transparent border-0 ${readOnly ? '' : 'cursor-pointer'}`}
          >
            <Star className={`w-5 h-5 ${filled ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} />
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
