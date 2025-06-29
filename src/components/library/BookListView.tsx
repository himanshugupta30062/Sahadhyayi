import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Star, StarHalf, BookOpen, Eye } from 'lucide-react';
import BookReader from './BookReader';
import type { Book } from '@/hooks/useLibraryBooks';

interface BookListViewProps {
  books: Book[];
}

const BookListView = ({ books }: BookListViewProps) => {
  const [userShelves, setUserShelves] = useState<Record<string, string>>({});
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [readerBook, setReaderBook] = useState<Book | null>(null);

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

  const handleReadBook = (book: Book) => {
    setReaderBook(book);
    setIsReaderOpen(true);
  };

  if (books.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No books found matching your criteria.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {books.map((book) => (
          <div key={book.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex gap-6">
              {/* Book Cover */}
              <div className="w-20 h-28 flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center text-white text-xs font-bold">
                {book.cover_image_url ? (
                  <img
                    src={book.cover_image_url}
                    alt={book.title}
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <div className="text-center p-1">
                    <div className="text-xs">{book.title.slice(0, 10)}...</div>
                  </div>
                )}
              </div>

              {/* Book Details */}
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="font-semibold text-xl text-gray-900 hover:text-orange-600 cursor-pointer">
                    {book.title}
                  </h3>
                  <p className="text-gray-600 mt-1">by {book.author}</p>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {renderStars(book.rating || 0)}
                  </div>
                  <span className="font-medium">{(book.rating || 0).toFixed(1)}</span>
                  <span className="text-sm text-gray-500">
                    ({Math.floor(Math.random() * 1000)} ratings)
                  </span>
                </div>

                {/* Description */}
                {book.description && (
                  <p className="text-gray-700 line-clamp-3 text-sm leading-relaxed">
                    {book.description}
                  </p>
                )}

                {/* Genre */}
                {book.genre && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Genre:</span>
                    <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                      {book.genre}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex-shrink-0 w-48 space-y-3">
                <Button
                  onClick={() => handleReadBook(book)}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Read Now
                </Button>
                
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
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Book Reader */}
      <BookReader
        book={readerBook}
        isOpen={isReaderOpen}
        onClose={() => setIsReaderOpen(false)}
      />
    </>
  );
};

export default BookListView;
