
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Book } from '@/hooks/useLibraryBooks';
import { renderStars } from './utils/starRating';

interface BookCardProps {
  book: Book;
  onDownloadPDF: (book: Book) => void;
}

const BookCard = ({ book, onDownloadPDF }: BookCardProps) => {
  return (
    <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-white/90 backdrop-blur-sm border-0 overflow-hidden">
      <div className="aspect-[3/4] bg-gradient-to-br from-blue-500 to-purple-600 relative overflow-hidden">
        {book.cover_image_url ? (
          <img
            src={book.cover_image_url}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        
        {/* Fallback placeholder */}
        <div className={`w-full h-full flex items-center justify-center text-white p-4 ${book.cover_image_url ? 'hidden' : ''}`}>
          <div className="text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-80" />
            <div className="text-sm font-medium leading-tight">
              {book.title.length > 30 ? book.title.substring(0, 30) + '...' : book.title}
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
            {book.title}
          </h3>
          <p className="text-gray-600 text-sm">{book.author}</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {renderStars(book.rating || 0)}
            <span className="text-sm font-medium ml-1">{(book.rating || 0).toFixed(1)}</span>
          </div>
          {book.price && (
            <span className="text-lg font-bold text-green-600">${book.price}</span>
          )}
        </div>

        {book.genre && (
          <div className="flex items-center gap-2">
            <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
              {book.genre}
            </span>
            {book.publication_year && (
              <span className="text-xs text-gray-500">{book.publication_year}</span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Link to={`/books/${book.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              About
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookCard;
