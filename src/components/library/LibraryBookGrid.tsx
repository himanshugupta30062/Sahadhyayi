import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Download, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface LibraryBook {
  id: string | number;
  title: string;
  author?: string | null;
  genre?: string | null;
  language?: string | null;
  publication_year?: string | number | null;
  cover_image_url?: string | null;
  pdf_url?: string | null;
}

interface LibraryShelfItem {
  id: string | number;
  status?: string | null;
  books_library?: LibraryBook | null;
}

interface LibraryBookGridProps {
  items: LibraryShelfItem[];
  showStatusBadge?: boolean;
  publicationYearClassName?: string;
}

/**
 * Shared presentation for books saved to either personal library or bookshelf.
 * The owning pages retain their own data hooks, empty states and page behaviour.
 */
const LibraryBookGrid: React.FC<LibraryBookGridProps> = ({
  items,
  showStatusBadge = false,
  publicationYearClassName = 'text-xs text-muted-foreground font-medium',
}) => {
  const handleDownloadPDF = (pdfUrl: string | null | undefined, title: string) => {
    if (!pdfUrl) {
      window.alert('PDF not available for this book');
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.alert('Failed to download PDF. Please try again.');
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map((item) => {
        const book = item.books_library;
        if (!book) return null;

        const statusLabel = item.status === 'reading'
          ? 'Reading'
          : item.status === 'completed'
            ? 'Completed'
            : item.status === 'want_to_read'
              ? 'Want to Read'
              : 'Unknown';
        const statusClass = item.status === 'reading'
          ? 'bg-green-500'
          : item.status === 'completed'
            ? 'bg-blue-500'
            : item.status === 'want_to_read'
              ? 'bg-yellow-500'
              : 'bg-gray-500';

        return (
          <Card key={item.id} className="group hover:shadow-warm transition-all duration-300 transform hover:-translate-y-1 bg-card border-border overflow-hidden">
            <div className="aspect-[3/4] bg-gradient-primary relative overflow-hidden">
              <img
                src={book.cover_image_url || '/default-cover.jpg'}
                alt={book.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(event) => {
                  const image = event.currentTarget;
                  if (!image.src.endsWith('/default-cover.jpg')) {
                    image.src = '/default-cover.jpg';
                    return;
                  }
                  image.style.display = 'none';
                  image.nextElementSibling?.classList.remove('hidden');
                }}
              />

              <div className="hidden w-full h-full flex items-center justify-center text-white p-4">
                <div className="text-center">
                  <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-80" />
                  <div className="text-sm font-medium leading-tight">
                    {book.title.length > 30 ? `${book.title.substring(0, 30)}...` : book.title}
                  </div>
                </div>
              </div>

              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    handleDownloadPDF(book.pdf_url, book.title);
                  }}
                  disabled={!book.pdf_url}
                  className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl backdrop-blur-sm ${book.pdf_url
                    ? 'bg-sahadhyayi-orange text-white hover:bg-sahadhyayi-orange/90'
                    : 'bg-muted/80 text-muted-foreground cursor-not-allowed opacity-60'
                  }`}
                  title={book.pdf_url ? 'Download PDF' : 'PDF not available'}
                  aria-label={book.pdf_url ? 'Download PDF' : 'PDF not available'}
                >
                  <Download className="w-5 h-5" />
                </button>

                <Link
                  to={`/book/${book.id}`}
                  className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl backdrop-blur-sm"
                  title="View Details"
                  aria-label={`View details for ${book.title}`}
                >
                  <Info className="w-5 h-5" />
                </Link>
              </div>

              {showStatusBadge && (
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${statusClass}`}>
                    {statusLabel}
                  </span>
                </div>
              )}
            </div>

            <CardContent className="p-3 md:p-4 space-y-2 md:space-y-3">
              <div>
                <h3 className="font-semibold text-base md:text-lg text-card-foreground line-clamp-2 group-hover:text-sahadhyayi-orange transition-colors duration-200">
                  <Link to={`/book/${book.id}`} className="hover:text-sahadhyayi-orange">
                    {book.title}
                  </Link>
                </h3>
                {Boolean(book.author) && (
                  <p className="text-muted-foreground text-sm mt-1 truncate">{book.author}</p>
                )}
              </div>

              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {Boolean(book.genre) && (
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
                {Boolean(book.publication_year) && (
                  <span className={publicationYearClassName}>{book.publication_year}</span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default LibraryBookGrid;
