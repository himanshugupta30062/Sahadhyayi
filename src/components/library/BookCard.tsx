
import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Download, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Book } from '@/hooks/useLibraryBooks';

interface BookCardProps {
  book: Book;
  onDownloadPDF: (book: Book) => void;
}

const BookCard = ({ book, onDownloadPDF }: BookCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDownloadPDF(book);
  };

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-white/90 backdrop-blur-sm border-amber-200 overflow-hidden">
      <div 
        className="aspect-[3/4] bg-gradient-to-br from-amber-500 to-orange-600 relative overflow-hidden cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {book.cover_image_url ? (
          <img
            src={book.cover_image_url}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
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

        {/* Hover Overlay with Action Links */}
        <div className={`absolute inset-0 bg-black/60 flex items-center justify-center gap-4 transition-all duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <button
            onClick={handleDownload}
            className="flex flex-col items-center gap-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-3 rounded-lg transition-all duration-200 hover:scale-105"
            title="Download PDF"
          >
            <Download className="w-6 h-6" />
            <span className="text-xs font-medium">Download</span>
          </button>
          
          <Link
            to={`/books/${book.id}`}
            className="flex flex-col items-center gap-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-3 rounded-lg transition-all duration-200 hover:scale-105"
            title="View Details"
          >
            <Info className="w-6 h-6" />
            <span className="text-xs font-medium">About</span>
          </Link>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 group-hover:text-amber-600 transition-colors duration-200">
            {book.title}
          </h3>
        </div>

        {book.genre && (
          <div className="flex items-center gap-2">
            <span className="inline-block bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-medium">
              {book.genre}
            </span>
            {book.publication_year && (
              <span className="text-xs text-gray-500">{book.publication_year}</span>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0 px-4 pb-4">
        <Link to={`/books/${book.id}`} className="w-full">
          <Button variant="outline" size="sm" className="w-full">
            Read More
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default BookCard;
