
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Download, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { slugify } from '@/utils/slugify';
import type { Book } from '@/hooks/useLibraryBooks';
import AuthenticatedActions from './AuthenticatedActions';

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
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.src = '/default-cover.jpg';
              e.currentTarget.onerror = null; // Prevent infinite loop
            }}
          />
        ) : (
          <img
            src="/default-cover.jpg"
            alt={book.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              // If default cover also fails, show placeholder
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
        )}
        
        {/* Fallback placeholder when both cover_url and default-cover.jpg fail */}
        <div className="hidden w-full h-full flex items-center justify-center text-white p-4">
          <div className="text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-80" />
            <div className="text-sm font-medium leading-tight">
              {book.title.length > 30 ? book.title.substring(0, 30) + '...' : book.title}
            </div>
          </div>
        </div>

        {/* Hover Overlay with Download and Details Buttons */}
        <div
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center gap-4 transition-all duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={!book.pdf_url}
            className={`flex flex-col items-center gap-2 text-white px-4 py-3 rounded-xl transition-all duration-300 transform hover:scale-110 ${
              book.pdf_url 
                ? 'bg-primary/90 hover:bg-primary shadow-lg hover:shadow-xl' 
                : 'bg-muted/60 cursor-not-allowed opacity-60'
            }`}
            title={book.pdf_url ? "Download PDF" : "PDF not available"}
          >
            <Download className="w-6 h-6" />
            <span className="text-sm font-semibold">
              {book.pdf_url ? 'Download' : 'No PDF'}
            </span>
          </button>
          
          {/* Details Button */}
          <Link
            to={`/book/${book.id}`}
            className="flex flex-col items-center gap-2 bg-secondary/90 hover:bg-secondary text-secondary-foreground px-4 py-3 rounded-xl transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-xl"
            title="View Details"
          >
            <Info className="w-6 h-6" />
            <span className="text-sm font-semibold">Details</span>
          </Link>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 group-hover:text-amber-600 transition-colors duration-200">
            {book.title}
          </h3>
          {book.author && (
            <p className="text-gray-600 text-sm mt-1">
              <Link to={`/authors/${slugify(book.author)}`}>{book.author}</Link>
            </p>
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

        {/* Authentication-aware actions */}
        <AuthenticatedActions book={book} onDownloadPDF={onDownloadPDF} />
      </CardContent>
    </Card>
  );
};

export default BookCard;
