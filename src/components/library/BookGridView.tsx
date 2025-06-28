
import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, StarHalf } from 'lucide-react';
import type { Book } from '@/hooks/useLibraryBooks';

interface BookGridViewProps {
  books: Book[];
}

const BookGridView = ({ books }: BookGridViewProps) => {
  const [userShelves, setUserShelves] = useState<Record<string, string>>({});

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
    }

    if (hasHalfStar) {
      stars.push(<StarHalf key="half" className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
    }

    const remainingStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
    }

    return stars;
  };

  const handleShelfChange = (bookId: string, shelf: string) => {
    setUserShelves(prev => ({ ...prev, [bookId]: shelf }));
  };

  if (books.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No books found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {books.map((book) => (
        <Card key={book.id} className="overflow-hidden hover:shadow-lg transition-shadow">
          {/* Book Cover */}
          <div className="aspect-[3/4] bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
            {book.cover_image_url ? (
              <img
                src={book.cover_image_url}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-4">
                <div className="text-sm">{book.title}</div>
              </div>
            )}
          </div>

          <CardContent className="p-4 space-y-2">
            {/* Title */}
            <h3 className="font-semibold text-lg leading-tight line-clamp-2 hover:text-orange-600 cursor-pointer">
              {book.title}
            </h3>

            {/* Author */}
            <p className="text-gray-600 text-sm">{book.author}</p>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {renderStars(book.rating || 0)}
              </div>
              <span className="text-sm font-medium">{(book.rating || 0).toFixed(1)}</span>
              <span className="text-xs text-gray-500">({Math.floor(Math.random() * 1000)} ratings)</span>
            </div>

            {/* Description */}
            {book.description && (
              <p className="text-sm text-gray-700 line-clamp-2">
                {book.description}
              </p>
            )}
          </CardContent>

          <CardFooter className="p-4 pt-0">
            {/* Shelf Selector */}
            <Select
              value={userShelves[book.id] || 'want-to-read'}
              onValueChange={(value) => handleShelfChange(book.id, value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="want-to-read">Want to Read</SelectItem>
                <SelectItem value="currently-reading">Currently Reading</SelectItem>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="did-not-finish">Did Not Finish</SelectItem>
              </SelectContent>
            </Select>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default BookGridView;
