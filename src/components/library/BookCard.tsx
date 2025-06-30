
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Download, Info, ExternalLink } from 'lucide-react';
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

  const handleReadFree = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (book.internet_archive_url) {
      window.open(book.internet_archive_url, '_blank');
    }
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

        {/* Hover Overlay with Download and Details Buttons */}
        <div className={`absolute inset-0 bg-black/60 flex items-center justify-center gap-3 transition-all duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="flex flex-col items-center gap-2 bg-green-500/80 backdrop-blur-sm hover:bg-green-600/90 text-white px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105"
            title="Download PDF"
          >
            <Download className="w-5 h-5" />
            <span className="text-xs font-medium">Download</span>
          </button>
          
          {/* Details Button */}
          <Link
            to={`/books/${book.id}`}
            className="flex flex-col items-center gap-2 bg-blue-500/80 backdrop-blur-sm hover:bg-blue-600/90 text-white px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105"
            title="View Details"
          >
            <Info className="w-5 h-5" />
            <span className="text-xs font-medium">Details</span>
          </Link>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 group-hover:text-amber-600 transition-colors duration-200">
            {book.title}
          </h3>
          {book.author && (
            <p className="text-gray-600 text-sm mt-1">{book.author}</p>
          )}
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {book.genre && (
              <span className="inline-block bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-medium">
                {book.genre}
              </span>
            )}
            {book.language && book.language !== 'English' && (
              <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                {book.language}
              </span>
            )}
          </div>
          {book.publication_year && (
            <span className="text-xs text-gray-500 font-medium">{book.publication_year}</span>
          )}
        </div>

        {/* Read Free Online Button (if available) */}
        {book.internet_archive_url && (
          <div className="pt-2">
            <Button
              onClick={handleReadFree}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Read Free Online
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BookCard;
