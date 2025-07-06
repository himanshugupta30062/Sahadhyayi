
import React, { useMemo, useEffect, useState, useRef } from 'react';
import { Library, Search, Plus, Trash2 } from 'lucide-react';
import { usePersonalLibrary, useCleanupUnusedBooks } from '@/hooks/usePersonalLibrary';
import { useBookSearch } from '@/hooks/useBookSearch';
import { useAllLibraryBooks } from '@/hooks/useLibraryBooks';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LibraryPagination from './LibraryPagination';

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
  
  // All library books (global)
  const { data: allLibraryBooks = [], isLoading: isLoadingAll, refetch: refetchAll } = useAllLibraryBooks();
  
  // Personal library (user-specific)
  const { data: personalLibrary = [], isLoading: isLoadingPersonal, refetch: refetchPersonal } = usePersonalLibrary();
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

  // Pagination state
  const [pageSize, setPageSize] = useState(10);
  const [currentPageAll, setCurrentPageAll] = useState(1);
  const [currentPagePersonal, setCurrentPagePersonal] = useState(1);
  const allGridRef = useRef<HTMLDivElement>(null);
  const personalGridRef = useRef<HTMLDivElement>(null);

  // Convert personal library to Book format for compatibility
  const personalBooks: Book[] = useMemo(() => {
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
      price: 0,
      rating: 0,
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
      refetchAll(); // Refresh all books after cleanup
    }
  };

  const getFilteredBooks = (books: Book[]) => {
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

      console.log('Book passed all filters:', book.title);
      return true;
    });

    console.log('Filtered books result:', filtered.length, 'books');
    console.log('Hindi books in result:', filtered.filter(book => book.language === 'Hindi').map(book => book.title));
    
    return filtered;
  };

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

  const filteredAllBooks = useMemo(() => getFilteredBooks(allLibraryBooks), [allLibraryBooks, searchQuery, selectedGenre, selectedAuthor, selectedYear, selectedLanguage, priceRange]);
  const filteredPersonalBooks = useMemo(() => getFilteredBooks(personalBooks), [personalBooks, searchQuery, selectedGenre, selectedAuthor, selectedYear, selectedLanguage, priceRange]);


  const paginatedAllBooks = useMemo(
    () =>
      filteredAllBooks.slice((currentPageAll - 1) * pageSize, currentPageAll * pageSize),
    [filteredAllBooks, currentPageAll, pageSize]
  );

  const paginatedPersonalBooks = useMemo(
    () =>
      filteredPersonalBooks.slice(
        (currentPagePersonal - 1) * pageSize,
        currentPagePersonal * pageSize
      ),
    [filteredPersonalBooks, currentPagePersonal, pageSize]
  );

  useEffect(() => {
    setCurrentPageAll(1);
  }, [filteredAllBooks, pageSize]);

  useEffect(() => {
    setCurrentPagePersonal(1);
  }, [filteredPersonalBooks, pageSize]);

  if (isLoadingAll) {
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
                onClick={() => { refetchAll(); refetchPersonal(); }}
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

      {/* Books Collection with Tabs */}
      <Tabs defaultValue="all-books" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all-books" className="flex items-center gap-2">
            <Library className="w-4 h-4" />
            All Books ({filteredAllBooks.length})
          </TabsTrigger>
          {user && (
            <TabsTrigger value="my-library" className="flex items-center gap-2">
              <div className="p-1 bg-gradient-to-br from-amber-500 to-orange-600 rounded">
                <Library className="w-3 h-3 text-white" />
              </div>
              My Personal Library ({filteredPersonalBooks.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="all-books" className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Library className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Digital Library Collection
            </h2>
            {filteredAllBooks.length > 0 && (
              <span className="text-sm text-gray-500 bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                {filteredAllBooks.length} books
              </span>
            )}
          </div>
          <div ref={allGridRef} className="space-y-6">
            <BooksGrid books={paginatedAllBooks} onDownloadPDF={handleDownloadPDF} />
            <LibraryPagination
              totalCount={filteredAllBooks.length}
              currentPage={currentPageAll}
              pageSize={pageSize}
              onPageChange={setCurrentPageAll}
              onPageSizeChange={setPageSize}
              scrollTargetRef={allGridRef}
            />
          </div>
        </TabsContent>

        {user && (
          <TabsContent value="my-library" className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
                <Library className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                My Personal Library
              </h2>
              {filteredPersonalBooks.length > 0 && (
                <span className="text-sm text-gray-500 bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
                  {filteredPersonalBooks.length} books
                </span>
              )}
            </div>
            
            {isLoadingPersonal ? (
              <LoadingGrid />
            ) : (
              <div ref={personalGridRef} className="space-y-6">
                <BooksGrid
                  books={paginatedPersonalBooks}
                  onDownloadPDF={handleDownloadPDF}
                />
                <LibraryPagination
                  totalCount={filteredPersonalBooks.length}
                  currentPage={currentPagePersonal}
                  pageSize={pageSize}
                  onPageChange={setCurrentPagePersonal}
                  onPageSizeChange={setPageSize}
                  scrollTargetRef={personalGridRef}
                />
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

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
