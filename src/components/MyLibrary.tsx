
import React from 'react';
import { useUserBookshelf } from '@/hooks/useUserBookshelf';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Download, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '@/components/LoadingSpinner';

const MyLibrary = () => {
  const { user } = useAuth();
  const { data: bookshelfData, isLoading, error } = useUserBookshelf();

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">Sign in to view your personal library.</p>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    console.error('Error loading bookshelf:', error);
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load your library. Please try again.</p>
      </div>
    );
  }

  if (!bookshelfData || bookshelfData.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardContent className="p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Your Library is Empty</h3>
          <p className="text-gray-600 mb-6">
            Start building your personal library by adding books from the "All Books" section.
          </p>
          <p className="text-sm text-gray-500">
            Use the "Add to Shelf" button on any book to add it to your personal collection.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleDownloadPDF = (pdfUrl: string, title: string) => {
    if (!pdfUrl) {
      alert('PDF not available for this book');
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
      alert('Failed to download PDF. Please try again.');
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {bookshelfData.map((item) => {
        const book = item.books_library;
        if (!book) return null;

        return (
          <Card key={item.id} className="group hover:shadow-warm transition-all duration-300 transform hover:-translate-y-1 bg-card border-border overflow-hidden">
            <div className="aspect-[3/4] bg-gradient-primary relative overflow-hidden cursor-pointer">
              {book.cover_image_url ? (
                <img
                  src={book.cover_image_url}
                  alt={book.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.src = '/default-cover.jpg';
                    e.currentTarget.onerror = null;
                  }}
                />
              ) : (
                <img
                  src="/default-cover.jpg"
                  alt={book.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              )}
              
              {/* Fallback placeholder */}
              <div className="hidden w-full h-full flex items-center justify-center text-white p-4">
                <div className="text-center">
                  <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-80" />
                  <div className="text-sm font-medium leading-tight">
                    {book.title.length > 30 ? book.title.substring(0, 30) + '...' : book.title}
                  </div>
                </div>
              </div>

              {/* Action Buttons Overlay */}
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-4">
                {/* Download Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDownloadPDF(book.pdf_url, book.title);
                  }}
                  disabled={!book.pdf_url}
                  className={`
                    flex items-center justify-center w-12 h-12 rounded-full
                    transition-all duration-300 transform hover:scale-110 active:scale-95
                    shadow-lg hover:shadow-xl backdrop-blur-sm
                    ${book.pdf_url 
                      ? 'bg-sahadhyayi-orange text-white hover:bg-sahadhyayi-orange/90' 
                      : 'bg-muted/80 text-muted-foreground cursor-not-allowed opacity-60'
                    }
                  `}
                  title={book.pdf_url ? "Download PDF" : "PDF not available"}
                  aria-label={book.pdf_url ? "Download PDF" : "PDF not available"}
                >
                  <Download className="w-5 h-5" />
                </button>
                
                {/* Details Button */}
                <Link
                  to={`/book/${book.id}`}
                  className="
                    flex items-center justify-center w-12 h-12 rounded-full
                    bg-white/10 hover:bg-white/20 text-white border border-white/20
                    transition-all duration-300 transform hover:scale-110 active:scale-95
                    shadow-lg hover:shadow-xl backdrop-blur-sm
                  "
                  title="View Details"
                  aria-label={`View details for ${book.title}`}
                >
                  <Info className="w-5 h-5" />
                </Link>
              </div>

              {/* Status Badge */}
              <div className="absolute top-2 right-2">
                <span className={`
                  px-2 py-1 rounded-full text-xs font-medium
                  ${item.status === 'reading' ? 'bg-green-500 text-white' :
                    item.status === 'completed' ? 'bg-blue-500 text-white' :
                    item.status === 'want_to_read' ? 'bg-yellow-500 text-white' :
                    'bg-gray-500 text-white'
                  }
                `}>
                  {item.status === 'reading' ? 'Reading' :
                   item.status === 'completed' ? 'Completed' :
                   item.status === 'want_to_read' ? 'Want to Read' :
                   'Unknown'}
                </span>
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
                    {book.author}
                  </p>
                )}
              </div>

              {/* Metadata */}
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
      })}
    </div>
  );
};

export default MyLibrary;
