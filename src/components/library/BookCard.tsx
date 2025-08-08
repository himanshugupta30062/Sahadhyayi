
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Download, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { slugify } from '@/utils/slugify';
import type { Book } from '@/hooks/useLibraryBooks';
import { LazyImage } from '@/components/ui/LazyImage';


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
          <LazyImage
            src={book.cover_image_url}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/default-cover.jpg';
              (e.currentTarget as HTMLImageElement).onerror = null;
            }}
          />
        ) : (
          <LazyImage
            src="/default-cover.jpg"
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              const pic = target.parentElement as HTMLElement;
              pic.style.display = 'none';
              pic.nextElementSibling?.classList.remove('hidden');
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

        {/* Enhanced Action Buttons Overlay - Icon Only with Hover Text */}
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          } 
          flex items-center justify-center gap-4`}
        >
          {/* Download Button - Icon Only */}
          <button
            onClick={handleDownload}
            disabled={!book.pdf_url}
            className={`
              group/btn relative flex items-center justify-center w-12 h-12 rounded-full
              transition-all duration-300 transform hover:scale-110 active:scale-95
              shadow-lg hover:shadow-xl backdrop-blur-sm
              ${
                book.pdf_url 
                  ? 'bg-sahadhyayi-orange text-white hover:bg-sahadhyayi-orange/90' 
                  : 'bg-muted/80 text-muted-foreground cursor-not-allowed opacity-60'
              }
            `}
            title={book.pdf_url ? "Download PDF" : "PDF not available"}
            aria-label={book.pdf_url ? "Download PDF" : "PDF not available"}
          >
            <Download className="w-5 h-5" />
            
            {/* Hover Text Tooltip */}
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className="bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {book.pdf_url ? 'Download' : 'No PDF'}
              </div>
            </div>
          </button>
          
          {/* Details Button - Icon Only */}
          <Link
            to={`/book/${book.id}`}
            className="
              group/btn relative flex items-center justify-center w-12 h-12 rounded-full
              bg-white/10 hover:bg-white/20 text-white border border-white/20
              transition-all duration-300 transform hover:scale-110 active:scale-95
              shadow-lg hover:shadow-xl backdrop-blur-sm
            "
            title="View Details"
            aria-label={`View details for ${book.title}`}
          >
            <Info className="w-5 h-5" />
            
            {/* Hover Text Tooltip */}
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className="bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                Details
              </div>
            </div>
          </Link>
        </div>

        {/* Mobile Quick Actions - Simplified */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 md:hidden transition-opacity duration-300 ${
            isHovered ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleDownload}
              disabled={!book.pdf_url}
              className={`
                flex items-center justify-center w-10 h-10 rounded-full
                transition-all duration-200 backdrop-blur-sm
                ${
                  book.pdf_url 
                    ? 'bg-sahadhyayi-orange text-white hover:bg-sahadhyayi-orange/90' 
                    : 'bg-muted/60 text-muted-foreground cursor-not-allowed opacity-60'
                }
              `}
              title={book.pdf_url ? "Download PDF" : "PDF not available"}
              aria-label={book.pdf_url ? "Download PDF" : "PDF not available"}
            >
              <Download className="w-4 h-4" />
            </button>
            
            <Link
              to={`/book/${book.id}`}
              className="
                flex items-center justify-center w-10 h-10 rounded-full
                bg-white/10 text-white hover:bg-white/20 border border-white/20
                transition-all duration-200 backdrop-blur-sm
              "
              title="View Details"
              aria-label={`View details for ${book.title}`}
            >
              <Info className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      <CardContent className="p-3 md:p-4 space-y-2 md:space-y-3">
        <div>
          <h3 className="font-semibold text-base md:text-lg text-card-foreground line-clamp-2 group-hover:text-sahadhyayi-orange transition-colors duration-200">
            <Link
              to={`/book/${book.id}`}
              className="hover:text-sahadhyayi-orange"
            >
              {book.title}
            </Link>
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

      </CardContent>
    </Card>
  );
};

export default BookCard;
