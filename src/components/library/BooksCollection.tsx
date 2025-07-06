
import React, { useMemo, useEffect } from 'react';
import { Library, Search, Plus } from 'lucide-react';
import { useLibraryBooks } from '@/hooks/useLibraryBooks';
import { useBookSearch } from '@/hooks/useBookSearch';
import type { Book } from '@/hooks/useLibraryBooks';
import BooksGrid from './BooksGrid';
import LoadingGrid from './LoadingGrid';
import BookSearchBar from '@/components/books/BookSearchBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';

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
  const { data: books = [], isLoading, refetch } = useLibraryBooks();
  
  // Book search functionality
  const {
    loading: searchLoading,
    error: searchError,
    searchBooks,
    getAllLibraryBooks,
  } = useBookSearch();

  // Refresh books when search completes
  useEffect(() => {
    if (!searchLoading) {
      refetch();
    }
  }, [searchLoading, refetch]);

  const filteredBooks = useMemo(() => {
    console.log('Filtering books with criteria:', {
      searchQuery,
      selectedGenre,
      selectedAuthor,
      selectedYear,
      selectedLanguage,
      priceRange,
      totalBooks: books.length
    });

    const filtered = books.filter(book => {
      console.log('Checking book:', book.title, 'Language:', book.language, 'Genre:', book.genre);
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          book.title.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query) ||
          (book.genre && book.genre.toLowerCase().includes(query));
        if (!matchesSearch) {
          console.log('Book filtered out by search:', book.title);
          return false;
        }
      }

      // Genre filter - Handle Hindi specially
      if (selectedGenre !== 'All') {
        if (selectedGenre === 'Hindi') {
          if (book.language !== 'Hindi') {
            console.log('Book filtered out by Hindi language filter:', book.title, 'Language:', book.language);
            return false;
          }
        } else if (book.genre !== selectedGenre) {
          console.log('Book filtered out by genre filter:', book.title, 'Expected:', selectedGenre, 'Actual:', book.genre);
          return false;
        }
      }

      // Author filter
      if (selectedAuthor !== 'All' && book.author !== selectedAuthor) {
        console.log('Book filtered out by author filter:', book.title);
        return false;
      }

      // Year filter
      if (selectedYear && book.publication_year !== parseInt(selectedYear)) {
        console.log('Book filtered out by year filter:', book.title);
        return false;
      }

      // Language filter
      if (selectedLanguage !== 'All' && book.language !== selectedLanguage) {
        console.log('Book filtered out by language filter:', book.title);
        return false;
      }

      // Price filter
      const bookPrice = book.price || 0;
      if (bookPrice < priceRange[0] || bookPrice > priceRange[1]) {
        console.log('Book filtered out by price filter:', book.title);
        return false;
      }

      console.log('Book passed all filters:', book.title);
      return true;
    });

    console.log('Filtered books result:', filtered.length, 'books');
    console.log('Hindi books in result:', filtered.filter(book => book.language === 'Hindi').map(book => book.title));
    
    return filtered;
  }, [books, searchQuery, selectedGenre, selectedAuthor, selectedYear, selectedLanguage, priceRange]);

  const handleDownloadPDF = async (book: Book) => {
    if (!book.pdf_url) {
      alert('PDF not available for this book');
      return;
    }

    try {
      // Create a temporary link element to trigger download
      const link = document.createElement('a');
      link.href = book.pdf_url;
      link.download = `${book.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  if (isLoading) {
    return <LoadingGrid />;
  }

  return (
    <div className="space-y-8">
      {/* API Search Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Search className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Add New Books</h3>
              <p className="text-sm text-gray-600 font-normal">
                Search millions of books from Open Library & Google Books
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 w-full">
              <BookSearchBar onSearch={searchBooks} loading={searchLoading} />
            </div>
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={searchLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>

          {searchError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{searchError}</AlertDescription>
            </Alert>
          )}

          <div className="bg-white/60 backdrop-blur-sm p-3 rounded-lg border border-blue-100">
            <div className="grid sm:grid-cols-2 gap-3 text-xs text-gray-600">
              <div>
                <span className="font-medium text-gray-900">How it works:</span> Search → Find books → Auto-save to library
              </div>
              <div>
                <span className="font-medium text-gray-900">Tips:</span> Try specific titles, authors, or topics for best results
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
          <Library className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
          Library Collection
        </h2>
        {filteredBooks.length > 0 && (
          <span className="text-sm text-gray-500 bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
            {filteredBooks.length} books found
          </span>
        )}
      </div>

      {/* Books Grid */}
      <BooksGrid books={filteredBooks} onDownloadPDF={handleDownloadPDF} />
    </div>
  );
};

export default BooksCollection;
