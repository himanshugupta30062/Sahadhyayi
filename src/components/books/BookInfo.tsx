
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, BookOpen, Calendar, Globe, Info } from 'lucide-react';

interface BookInfoProps {
  author: string;
  rating?: number;
  genre?: string;
  publicationYear?: number;
  pages?: number;
  language?: string;
  isbn?: string;
  onAuthorClick: () => void;
}

const BookInfo = ({ 
  author, 
  rating, 
  genre, 
  publicationYear, 
  pages, 
  language, 
  isbn, 
  onAuthorClick 
}: BookInfoProps) => {
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
    }
    if (hasHalfStar) {
      stars.push(<Star key="half" className="w-4 h-4 fill-yellow-400 text-yellow-400 opacity-50" />);
    }
    const remainingStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
    }
    return stars;
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-2xl font-semibold text-gray-800">by {author}</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onAuthorClick}
          className="p-1 h-auto text-blue-600 hover:text-blue-800"
          title="Learn more about the author"
        >
          <Info className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-1">
          {renderStars(rating || 0)}
          <span className="ml-2 font-medium text-lg">{(rating || 0).toFixed(1)}</span>
        </div>
        {genre && <Badge variant="secondary" className="text-sm px-3 py-1">{genre}</Badge>}
      </div>
      
      {/* Book Metadata */}
      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
        {publicationYear && (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Published {publicationYear}</span>
          </div>
        )}
        {pages && (
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span>{pages} pages</span>
          </div>
        )}
        {language && (
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span>{language}</span>
          </div>
        )}
        {isbn && (
          <div className="text-xs">
            <span className="font-medium">ISBN:</span> {isbn}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookInfo;
