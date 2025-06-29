
import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, BookOpen, Eye, Library } from 'lucide-react';
import { useLibraryBooks } from '@/hooks/useLibraryBooks';
import InternetArchiveReader from './InternetArchiveReader';
import type { Book } from '@/hooks/useLibraryBooks';

interface BooksCollectionProps {
  searchQuery: string;
  selectedGenre: string;
  selectedAuthor: string;
  selectedYear: string;
  selectedLanguage: string;
  priceRange: [number, number];
}

const BooksCollection = ({
  searchQuery,
  selectedGenre,
  selectedAuthor,
  selectedYear,
  selectedLanguage,
  priceRange
}: BooksCollectionProps) => {
  const { data: books = [], isLoading } = useLibraryBooks();
  const [isReaderOpen, setIsReaderOpen] = React.useState(false);
  const [readerBook, setReaderBook] = React.useState<Book | null>(null);

  const filteredBooks = useMemo(() => {
    const filtered = books.filter(book => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          book.title.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query) ||
          (book.genre && book.genre.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Genre filter
      if (selectedGenre !== 'All' && book.genre !== selectedGenre) return false;

      // Author filter
      if (selectedAuthor !== 'All' && book.author !== selectedAuthor) return false;

      // Year filter
      if (selectedYear && book.publication_year !== parseInt(selectedYear)) return false;

      // Language filter
      if (selectedLanguage !== 'All' && book.language !== selectedLanguage) return false;

      // Price filter
      const bookPrice = book.price || 0;
      if (bookPrice < priceRange[0] || bookPrice > priceRange[1]) return false;

      return true;
    });

    return filtered;
  }, [books, searchQuery, selectedGenre, selectedAuthor, selectedYear, selectedLanguage, priceRange]);

  const handleReadBook = (book: Book) => {
    setReaderBook(book);
    setIsReaderOpen(true);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
    }
    
    const remainingStars = 5 - fullStars;
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
    }

    return stars;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-xl h-80"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Section Header */}
        <div className="flex items-center gap-3">
          <Library className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Books Collection</h2>
          {filteredBooks.length > 0 && (
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {filteredBooks.length} books found
            </span>
          )}
        </div>

        {/* Books Grid */}
        {filteredBooks.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Books Found</h3>
              <p className="text-gray-600">
                Try adjusting your search criteria or filters to find more books.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBooks.map((book) => (
              <Card key={book.id} className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-white/90 backdrop-blur-sm border-0 overflow-hidden">
                <div className="aspect-[3/4] bg-gradient-to-br from-blue-500 to-purple-600 relative overflow-hidden">
                  {book.cover_image_url ? (
                    <img
                      src={book.cover_image_url}
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white p-4">
                      <div className="text-center">
                        <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-80" />
                        <div className="text-sm font-medium leading-tight">
                          {book.title.length > 30 ? book.title.substring(0, 30) + '...' : book.title}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Button
                      onClick={() => handleReadBook(book)}
                      className="bg-white text-black hover:bg-gray-100 transform scale-90 group-hover:scale-100 transition-transform duration-300"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Read Now
                    </Button>
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Internet Archive Book Reader */}
      <InternetArchiveReader
        book={readerBook}
        isOpen={isReaderOpen}
        onClose={() => setIsReaderOpen(false)}
      />
    </>
  );
};

export default BooksCollection;
