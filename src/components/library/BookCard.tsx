
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Download, Info, Plus, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { slugify } from '@/utils/slugify';
import { useAuth } from '@/contexts/authHelpers';
import { useAddToPersonalLibrary, usePersonalLibrary } from '@/hooks/usePersonalLibrary';
import { EnhancedLazyImage } from '@/components/ui/EnhancedLazyImage';
import GeneratedBookCover from '@/components/library/GeneratedBookCover';
import { BookQualityBadge } from '@/components/library/BookQualityBadge';
import { useResolvedBookCover } from '@/utils/catalog/bookCoverResolver';
import type { Book } from '@/hooks/useLibraryBooks';


interface BookCardProps {
  book: Book;
  onDownloadPDF: (book: Book) => void;
}

const BookCard = ({ book, onDownloadPDF }: BookCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: personalLibrary = [] } = usePersonalLibrary();
  const addToLibrary = useAddToPersonalLibrary();
  
  const isInLibrary = personalLibrary.some(item => item.book_id === book.id);

  const { coverUrl: resolvedCover } = useResolvedBookCover({
    id: book.id,
    title: book.title,
    author: book.author,
    isbn: (book as any).isbn,
    cover_image_url: book.cover_image_url,
  });

  const activeCoverUrl = book.cover_image_url || resolvedCover;

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDownloadPDF(book);
  };

  const handleAddToLibrary = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate(`/signin?redirect=${encodeURIComponent(`/book/${book.id}`)}&intent=add_shelf&book_id=${encodeURIComponent(book.id)}`);
      return;
    }
    if (isInLibrary) return;
    addToLibrary.mutate(book.id);
  };

  return (
    <Card className="group hover:shadow-warm transition-all duration-300 transform hover:-translate-y-1 bg-card border-border overflow-hidden">
      <div 
        className="aspect-[3/4] bg-gradient-primary relative overflow-hidden cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {activeCoverUrl ? (
          <EnhancedLazyImage
            src={activeCoverUrl}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            fallback={
              <GeneratedBookCover title={book.title} author={book.author} genre={book.genre} />
            }
          />
        ) : (
          <GeneratedBookCover title={book.title} author={book.author} genre={book.genre} />
        )}

        {/* Quality / Access Badge Top Left */}
        {book.accessStatus && (
          <div className="absolute top-2 left-2 z-10 pointer-events-auto">
            <BookQualityBadge
              status={book.accessStatus}
              qualityScore={book.qualityScore}
              whyThisEdition={book.whyThisEdition}
              size="sm"
            />
          </div>
        )}

        {/* Alternative Editions count pill Top Right */}
        {Boolean(book.alternativeEditionsCount && book.alternativeEditionsCount > 0) && (
          <div className="absolute top-2 right-2 z-10 pointer-events-auto">
            <span className="bg-black/75 backdrop-blur-sm text-white/95 text-[10px] font-medium px-2 py-0.5 rounded-full shadow-sm border border-white/20">
              +{book.alternativeEditionsCount} {book.alternativeEditionsCount === 1 ? 'edition' : 'editions'}
            </span>
          </div>
        )}

        {/* Enhanced Action Buttons Overlay - Icon Only with Hover Text */}
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          } 
          flex items-center justify-center gap-4`}
        >
          {/* Add to Library Button - Available to authenticated users and guests */}
          <button
            onClick={handleAddToLibrary}
            disabled={user && (isInLibrary || addToLibrary.isPending)}
            className={`
              group/btn relative flex items-center justify-center w-12 h-12 rounded-full
              transition-all duration-300 transform hover:scale-110 active:scale-95
              shadow-lg hover:shadow-xl backdrop-blur-sm
              ${
                isInLibrary
                  ? 'bg-green-600 text-white cursor-default'
                  : addToLibrary.isPending
                  ? 'bg-muted/80 text-muted-foreground cursor-not-allowed opacity-60'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }
            `}
            title={
              !user
                ? "Sign in to add to library"
                : isInLibrary 
                ? "Already in library" 
                : addToLibrary.isPending 
                ? "Adding..." 
                : "Add to library"
            }
            aria-label={
              !user
                ? "Sign in to add to library"
                : isInLibrary 
                ? "Already in library" 
                : addToLibrary.isPending 
                ? "Adding to library..." 
                : "Add to library"
            }
          >
            {isInLibrary ? (
              <Check className="w-5 h-5" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
            
            {/* Hover Text Tooltip */}
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className="bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {!user ? 'Sign In to Save' : isInLibrary ? 'In Library' : addToLibrary.isPending ? 'Adding...' : 'Add to Library'}
              </div>
            </div>
          </button>

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
            {/* Add to Library Button - Mobile */}
            <button
              onClick={handleAddToLibrary}
              disabled={user && (isInLibrary || addToLibrary.isPending)}
              className={`
                flex items-center justify-center w-10 h-10 rounded-full
                transition-all duration-200 backdrop-blur-sm
                ${
                  isInLibrary
                    ? 'bg-green-600 text-white cursor-default'
                    : addToLibrary.isPending
                    ? 'bg-muted/60 text-muted-foreground cursor-not-allowed opacity-60'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }
              `}
              title={
                !user
                  ? "Sign in to add to library"
                  : isInLibrary 
                  ? "Already in library" 
                  : addToLibrary.isPending 
                  ? "Adding..." 
                  : "Add to library"
              }
              aria-label={
                !user
                  ? "Sign in to add to library"
                  : isInLibrary 
                  ? "Already in library" 
                  : addToLibrary.isPending 
                  ? "Adding to library..." 
                  : "Add to library"
              }
            >
              {isInLibrary ? (
                <Check className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </button>

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
          <div className="flex flex-wrap gap-1.5 items-center">
            {book.genre && (
              <span className="inline-block bg-sahadhyayi-amber-light text-sahadhyayi-warm px-2 py-0.5 rounded-full text-xs font-medium border border-sahadhyayi-amber/20">
                {book.genre}
              </span>
            )}
            {book.language && book.language !== 'English' && (
              <span className="inline-block bg-accent text-accent-foreground px-2 py-0.5 rounded-full text-xs font-medium border border-border">
                {book.language}
              </span>
            )}
            {/* Format badges */}
            {book.epub_url && (
              <span className="inline-block bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded text-[10px] tracking-wide border border-emerald-300 dark:border-emerald-800">
                EPUB
              </span>
            )}
            {book.pdf_url && (
              <span className="inline-block bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold px-1.5 py-0.5 rounded text-[10px] tracking-wide border border-blue-300 dark:border-blue-800">
                PDF
              </span>
            )}
          </div>
          {book.publication_year && (
            <span className="text-xs text-muted-foreground font-medium shrink-0">{book.publication_year}</span>
          )}
        </div>

        {/* Why this edition rationale snippet */}
        {book.whyThisEdition && (
          <p className="text-[11px] text-muted-foreground/90 italic line-clamp-1 border-t border-border/40 pt-1.5">
            {book.whyThisEdition}
          </p>
        )}

      </CardContent>
    </Card>
  );
};

export default BookCard;
