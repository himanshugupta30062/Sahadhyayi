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
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          aria-label={`Rate ${n} star`}
          onClick={() => onChange?.(n)}
          className={`p-1 ${n <= Math.round(value) ? 'text-yellow-500' : 'text-gray-300'} ${readOnly ? '' : 'cursor-pointer'}`}
          data-testid={`star-${n}`}
        >
          <Star className="w-5 h-5" />
        </button>
      ))}
    </div>
  );
};

export default StarRating;
