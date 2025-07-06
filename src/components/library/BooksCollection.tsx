
import React, { useMemo, useEffect, useState } from 'react';
import { Library, Search, Plus, Trash2 } from 'lucide-react';
import { usePersonalLibrary, useCleanupUnusedBooks } from '@/hooks/usePersonalLibrary';
import { useBookSearch } from '@/hooks/useBookSearch';
import type { Book } from '@/hooks/useLibraryBooks';
import BooksGrid from './BooksGrid';
import LoadingGrid from './LoadingGrid';
import BookSearchBar from '@/components/books/BookSearchBar';
import BookSelectionModal from './BookSelectionModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();
  const { data: personalLibrary = [], isLoading, refetch } = usePersonalLibrary();
  const cleanupMutation = useCleanupUnusedBooks();
  
  // Book search functionality
  const {
    loading: searchLoading,
    error: searchError,
    searchBooks,
  } = useBookSearch();

  // Modal state for book selection
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [foundBooks, setFoundBooks] = useState<any[]>([]);
  const [lastSearchTerm, setLastSearchTerm] = useState('');

  // Convert personal library to Book format for compatibility
  const books: Book[] = useMemo(() => {
    return personalLibrary.map(item => ({
      id: item.books_library.id,
      title: item.books_library.title,
      author: item.books_library.author || 'Unknown Author',
      genre: item.books_library.genre,
      cover_image_url: item.books_library.cover_image_url,
      description: item.books_library.description,
      publication_year: item.books_library.publication_year,
      language: item.books_library.language || 'English',
      pdf_url: item.books_library.pdf_url,
      created_at: item.added_at,
      price: 0, // Not applicable for personal library
      rating: 0, // Could be added later
      isbn: null,
      pages: null,
      author_bio: null
    }));
  }, [personalLibrary]);

  const handleSearch = async (searchTerm: string) => {
    console.log('🔍 Starting book search for:', searchTerm);
    const results = await searchBooks(searchTerm);
    
    if (results && results.length > 0) {
      console.log('📚 Found books:', results.length);
      setFoundBooks(results);
      setLastSearchTerm(searchTerm);
      setShowSelectionModal(true);
    }
  };

  const handleCleanup = async () => {
    if (user) {
      await cleanupMutation.mutateAsync();
      refetch(); // Refresh the library after cleanup
    }
  };

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

      // Price filter (skip for personal library as prices are always 0)
      // const bookPrice = book.price || 0;
      // if (bookPrice < priceRange[0] || bookPrice > priceRange[1]) {
      //   console.log('Book filtered out by price filter:', book.title);
      //   return false;
      // }

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
              <h3 className="text-lg font-bold text-gray-900">Ultimate Book Finder</h3>
              <p className="text-sm text-gray-600 font-normal">
                Search millions of books from 4 major sources & choose which versions to add to your library
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 w-full">
              <BookSearchBar onSearch={handleSearch} loading={searchLoading} />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => refetch()}
                disabled={searchLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
              {user && (
                <Button
                  variant="outline"
                  onClick={handleCleanup}
                  disabled={cleanupMutation.isPending}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                  Cleanup
                </Button>
              )}
            </div>
          </div>

          {searchError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{searchError}</AlertDescription>
            </Alert>
          )}

          <div className="bg-white/60 backdrop-blur-sm p-4 rounded-lg border border-blue-100">
            <div className="grid sm:grid-cols-2 gap-4 text-xs text-gray-600">
              <div>
                <span className="font-medium text-gray-900">🔍 How it works:</span>
                <br />• Searches 4 APIs simultaneously
                <br />• Shows all available versions
                <br />• You choose which to add to your library
                <br />• Auto-cleanup removes unused older versions
              </div>
              <div>
                <span className="font-medium text-gray-900">📚 Sources:</span>
                <br />• Open Library (metadata & covers)
                <br />• Google Books (descriptions & previews)
                <br />• Project Gutenberg (free PDFs)
                <br />• Internet Archive (historical texts)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Library Section */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
          <Library className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
          My Personal Library
        </h2>
        {filteredBooks.length > 0 && (
          <span className="text-sm text-gray-500 bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
            {filteredBooks.length} books
          </span>
        )}
      </div>

      {/* Books Grid */}
      <BooksGrid books={filteredBooks} onDownloadPDF={handleDownloadPDF} />

      {/* Book Selection Modal */}
      <BookSelectionModal
        isOpen={showSelectionModal}
        onClose={() => setShowSelectionModal(false)}
        books={foundBooks}
        searchTerm={lastSearchTerm}
      />
    </div>
  );
};

export default BooksCollection;
