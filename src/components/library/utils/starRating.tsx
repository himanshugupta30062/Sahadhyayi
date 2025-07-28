
import * as React from 'react';
import { Star } from 'lucide-react';

export const renderStars = (rating: number) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  
  for (let i = 0; i < fullStars; i++) {
    stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
  }
  
  const remainingStars = 5 - fullStars;
  for (let i = 0; i < remainingStars; i++) {
    stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
  }

  return stars;
};
