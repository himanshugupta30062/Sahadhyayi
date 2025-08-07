
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
    <Card className="group hover:shadow-warm transition-all duration-300 transform hover:-translate-y-1 bg-card border-border overflow-hidden">
      <div 
        className="aspect-[3/4] bg-gradient-primary relative overflow-hidden cursor-pointer"
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

        {/* Enhanced Action Buttons Overlay - Desktop & Mobile Optimized */}
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0 md:opacity-0'
          } 
          flex flex-col justify-end p-3 md:flex-row md:items-center md:justify-center md:gap-3`}
        >
          {/* Download Button - Enhanced Design */}
          <button
            onClick={handleDownload}
            disabled={!book.pdf_url}
            className={`
              flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm
              transition-all duration-300 transform hover:scale-105 active:scale-95
              shadow-lg hover:shadow-xl backdrop-blur-sm
              mb-2 md:mb-0 md:flex-col md:px-6 md:py-3 md:rounded-xl
              ${
                book.pdf_url 
                  ? 'bg-sahadhyayi-orange text-white hover:bg-sahadhyayi-orange/90 shadow-orange-500/25' 
                  : 'bg-muted/80 text-muted-foreground cursor-not-allowed opacity-60'
              }
            `}
            title={book.pdf_url ? "Download PDF" : "PDF not available"}
          >
            <Download className="w-4 h-4 md:w-5 md:h-5" />
            <span className="md:text-xs md:font-semibold">
              {book.pdf_url ? 'Download' : 'No PDF'}
            </span>
          </button>
          
          {/* Details Button - Enhanced Design */}
          <Link
            to={`/book/${book.id}`}
            className="
              flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm
              bg-card/90 hover:bg-card text-card-foreground border border-border/50
              transition-all duration-300 transform hover:scale-105 active:scale-95
              shadow-lg hover:shadow-xl backdrop-blur-sm
              md:flex-col md:px-6 md:py-3 md:rounded-xl md:border-white/20 md:bg-white/10 md:text-white md:hover:bg-white/20
            "
            title="View Details"
          >
            <Info className="w-4 h-4 md:w-5 md:h-5" />
            <span className="md:text-xs md:font-semibold">Details</span>
          </Link>
        </div>

        {/* Mobile-Only Quick Actions Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 md:hidden">
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              disabled={!book.pdf_url}
              className={`
                flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium
                transition-all duration-200 backdrop-blur-sm
                ${
                  book.pdf_url 
                    ? 'bg-sahadhyayi-orange text-white hover:bg-sahadhyayi-orange/90' 
                    : 'bg-muted/60 text-muted-foreground cursor-not-allowed opacity-60'
                }
              `}
            >
              <Download className="w-3.5 h-3.5" />
              {book.pdf_url ? 'Get PDF' : 'No PDF'}
            </button>
            
            <Link
              to={`/book/${book.id}`}
              className="
                flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium
                bg-white/10 text-white hover:bg-white/20 border border-white/20
                transition-all duration-200 backdrop-blur-sm
              "
            >
              <Info className="w-3.5 h-3.5" />
              View
            </Link>
          </div>
        </div>
      </div>

      <CardContent className="p-3 md:p-4 space-y-2 md:space-y-3">
        <div>
          <h3 className="font-semibold text-base md:text-lg text-card-foreground line-clamp-2 group-hover:text-sahadhyayi-orange transition-colors duration-200">
            {book.title}
          </h3>
          {book.author && (
            <p className="text-muted-foreground text-sm mt-1 truncate">
              <Link 
                to={`/authors/${slugify(book.author)}`}
                className="hover:text-sahadhyayi-orange transition-colors duration-200"
              >
                {book.author}
              </Link>
            </p>
          )}
        </div>

        {/* Enhanced Metadata with better mobile layout */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {book.genre && (
              <span className="inline-block bg-sahadhyayi-amber-light text-sahadhyayi-warm px-2 py-1 rounded-full text-xs font-medium border border-sahadhyayi-amber/20">
                {book.genre}
              </span>
            )}
            {book.language && book.language !== 'English' && (
              <span className="inline-block bg-accent text-accent-foreground px-2 py-1 rounded-full text-xs font-medium border border-border">
                {book.language}
              </span>
            )}
          </div>
          {book.publication_year && (
            <span className="text-xs text-muted-foreground font-medium">{book.publication_year}</span>
          )}
        </div>

        {/* Authentication-aware actions */}
        <AuthenticatedActions book={book} onDownloadPDF={onDownloadPDF} />
      </CardContent>
    </Card>
  );
};

export default BookCard;
