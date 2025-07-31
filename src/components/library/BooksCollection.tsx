
import * as React from 'react';
import { useMemo, useEffect, useState, useRef } from 'react';
import { Library, Search, Trash2 } from 'lucide-react';
import { usePersonalLibrary, useCleanupUnusedBooks } from '@/hooks/usePersonalLibrary';
import { useBookSearch } from '@/hooks/useBookSearch';
import { usePaginatedLibraryBooks } from '@/hooks/usePaginatedLibraryBooks';
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
import LoadingSpinner from '@/components/LoadingSpinner';
import LibraryPagination from './LibraryPagination';
import { searchExternalSources, type ExternalBook } from '@/utils/searchExternalSources';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  
  // All library books with server-side pagination
  const {
    data: paginatedData,
    isLoading: isLoadingAll,
    page,
    pageSize,
    totalPages,
    setPage,
    setPageSize,
    refetch: refetchAll,
  } = usePaginatedLibraryBooks({
    searchQuery,
    selectedGenre,
    selectedAuthor,
    selectedYear,
    selectedLanguage,
  });
  
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
  const [openAccessBooks, setOpenAccessBooks] = useState<ExternalBook[]>([]);
  const [lastSearchTerm, setLastSearchTerm] = useState('');
  const [useExternalSources, setUseExternalSources] = useState(true);

  // Pagination state for personal library only
  const [pageSizePersonal, setPageSizePersonal] = useState(10);
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
    const results = await searchBooks(searchTerm);
    let external: ExternalBook[] = [];
    if (useExternalSources) {
      try {
        external = await searchExternalSources(searchTerm);
      } catch {
        // ignore external search errors
      }
    }

    const uniqueExternal = external.filter(ext => {
      return !results.some(r => r.title === ext.title && r.author === ext.author);
    });

    if ((results && results.length > 0) || uniqueExternal.length > 0) {
      setFoundBooks(results);
      setOpenAccessBooks(uniqueExternal);
      setLastSearchTerm(searchTerm);
      setShowSelectionModal(true);
    }
  };

  const handleBooksAdded = () => {
    // Refresh all library data when books are added
    refetchAll();
    if (user) {
      refetchPersonal();
    }
  };

  const handleCleanup = async () => {
    if (user) {
      await cleanupMutation.mutateAsync();
      refetchAll(); // Refresh all books after cleanup
    }
  };

  const getFilteredBooks = (books: Book[]) => {

    const filtered = books.filter(book => {
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          book.title.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query) ||
          (book.genre && book.genre.toLowerCase().includes(query));
        if (!matchesSearch) {
          return false;
        }
      }

      // Genre filter - Handle Hindi specially
      if (selectedGenre !== 'All') {
        if (selectedGenre === 'Hindi') {
          if (book.language !== 'Hindi') {
            return false;
          }
        } else if (book.genre !== selectedGenre) {
          return false;
        }
      }

      // Author filter
      if (selectedAuthor !== 'All' && book.author !== selectedAuthor) {
        return false;
      }

      // Year filter
      if (selectedYear && book.publication_year !== parseInt(selectedYear)) {
        return false;
      }

      // Language filter
      if (selectedLanguage !== 'All' && book.language !== selectedLanguage) {
        return false;
      }

      return true;
    });

    

    // Sort to prioritize books that have both a cover image and PDF first,
    // followed by those that only have a PDF, then the rest
    filtered.sort((a, b) => {
      const score = (book: Book) => {
        const hasCover = Boolean(book.cover_image_url);
        const hasPdf = Boolean(book.pdf_url);
        if (hasCover && hasPdf) return 3;
        if (hasPdf) return 2;
        if (hasCover) return 1;
        return 0;
      };

      const diff = score(b) - score(a);
      if (diff !== 0) return diff;
      return 0;
    });

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
    } catch {
      alert('Failed to download PDF. Please try again.');
    }
  };

  const filteredAllBooks = useMemo(
    () => getFilteredBooks(paginatedData?.books ?? []),
    [paginatedData, searchQuery, selectedGenre, selectedAuthor, selectedYear, selectedLanguage, priceRange]
  );
  const filteredPersonalBooks = useMemo(
    () => getFilteredBooks(personalBooks),
    [personalBooks, searchQuery, selectedGenre, selectedAuthor, selectedYear, selectedLanguage, priceRange]
  );

  // Reset page when filters change handled inside hook

  const paginatedPersonalBooks = useMemo(
    () =>
      filteredPersonalBooks.slice(
        (currentPagePersonal - 1) * pageSizePersonal,
        currentPagePersonal * pageSizePersonal
      ),
    [filteredPersonalBooks, currentPagePersonal, pageSizePersonal]
  );

  useEffect(() => {
    setCurrentPagePersonal(1);
  }, [filteredPersonalBooks, pageSizePersonal]);


  const startPersonal =
    filteredPersonalBooks.length === 0
      ? 0
      : (currentPagePersonal - 1) * pageSizePersonal + 1;
  const endPersonal = Math.min(
    currentPagePersonal * pageSizePersonal,
    filteredPersonalBooks.length
  );

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
              <BookSearchBar
                onSearch={handleSearch}
                loading={searchLoading}
                onToggleExternal={setUseExternalSources}
              />
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
            All Books ({paginatedData?.totalCount ?? 0})
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
          {/* Enhanced All Books Header */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                  <Library className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    All Books
                  </h2>
                  <div className="h-1 w-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="text-sm text-gray-600 font-medium">
                  Showing {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, paginatedData?.totalCount ?? 0)} of {paginatedData?.totalCount ?? 0} books
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">Books per page:</span>
                  <Select 
                    value={String(pageSize)} 
                    onValueChange={(value) => {
                      setPageSize(parseInt(value, 10));
                      setPage(1); // Reset to page 1 when changing page size
                    }}
                  >
                    <SelectTrigger className="w-20 h-9 border-2 border-gray-200 hover:border-blue-300 transition-colors">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-2 border-gray-200 shadow-lg z-50">
                      {[5, 10, 20].map((size) => (
                        <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div ref={allGridRef} className="space-y-6">
            {isLoadingAll ? (
              <LoadingSpinner />
            ) : (
              <>
                <BooksGrid books={filteredAllBooks} onDownloadPDF={handleDownloadPDF} />
                
                <LibraryPagination
                  totalCount={paginatedData?.totalCount ?? 0}
                  currentPage={page}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                  scrollTargetRef={allGridRef}
                />
              </>
            )}
          </div>
        </TabsContent>

        {user && (
          <TabsContent value="my-library" className="space-y-6">
            {/* Enhanced Personal Library Header */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
                    <Library className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-2">
                      My Personal Library
                    </h2>
                    <div className="h-1 w-16 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full"></div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="text-sm text-gray-600 font-medium">
                    Showing {startPersonal}-{endPersonal} of {filteredPersonalBooks.length} books
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">Books per page:</span>
                    <Select value={String(pageSizePersonal)} onValueChange={(value) => setPageSizePersonal(parseInt(value, 10))}>
                      <SelectTrigger className="w-20 h-9 border-2 border-gray-200 hover:border-amber-300 transition-colors">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-2 border-gray-200 shadow-lg z-50">
                        {[5, 10, 20].map((size) => (
                          <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
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
                  pageSize={pageSizePersonal}
                  onPageChange={setCurrentPagePersonal}
                  onPageSizeChange={setPageSizePersonal}
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
        onClose={() => {
          setShowSelectionModal(false);
          setOpenAccessBooks([]);
        }}
        books={foundBooks}
        externalBooks={openAccessBooks}
        searchTerm={lastSearchTerm}
        onBooksAdded={handleBooksAdded}
      />
    </div>
  );
};

export default BooksCollection;
