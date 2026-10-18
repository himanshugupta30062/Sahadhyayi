
import * as React from 'react';
import { useState, useRef } from 'react';
import { Library, Search } from 'lucide-react';
import PersonalLibrary from '@/components/PersonalLibrary';
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
import { useAuth } from '@/contexts/authHelpers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoadingSpinner from '@/components/LoadingSpinner';
import LibraryPagination from './LibraryPagination';
import { searchExternalSources, type ExternalBook } from '@/utils/searchExternalSources';
import { searchLibgen, type LibgenBook } from '@/utils/libgenApi';
import { toast } from '@/hooks/use-toast';
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
    isError: isErrorAll,
    error: errorAll,
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

  const allGridRef = useRef<HTMLDivElement>(null);

  const handleSearch = async (searchTerm: string) => {
    const results = await searchBooks(searchTerm);
    const external: ExternalBook[] = [];
    let libgenBooks: LibgenBook[] = [];
    
    // Concurrently search Libgen if external sources enabled
    if (useExternalSources) {
      try {
        const response = await searchLibgen(searchTerm);
        if (response.success && response.books) {
          libgenBooks = response.books;
        }
      } catch (error) {
        console.warn('Libgen search notice:', error);
      }
    }

    // Convert Libgen books to ExternalBook format for display
    const libgenExternalBooks: ExternalBook[] = libgenBooks.map(book => ({
      id: book.id,
      title: book.title,
      author: book.author,
      year: book.year || '',
      language: '',
      extension: book.format || '',
      size: book.size || '',
      md5: book.id,
      downloadUrl: book.mirrorLink,
      source: 'libgen' as any
    }));

    // Combine all external sources
    const allExternalBooks = [...external, ...libgenExternalBooks];

    // Filter out duplicates between internal and external results
    const uniqueExternal = allExternalBooks.filter(ext => {
      return !results.some(r => 
        r.title.toLowerCase() === ext.title.toLowerCase() && 
        r.author?.toLowerCase() === ext.author?.toLowerCase()
      );
    });

    if ((results && results.length > 0) || uniqueExternal.length > 0) {
      setFoundBooks(results);
      setOpenAccessBooks(uniqueExternal);
      setLastSearchTerm(searchTerm);
      setShowSelectionModal(true);
    } else {
      toast({
        title: 'No books found',
        description: 'Try different keywords or check your spelling.',
        variant: 'destructive',
      });
    }
  };

  const handleBooksAdded = () => {
    // Refresh all library data when books are added
      refetchAll();
      window.dispatchEvent(new Event('shelfUpdated'));
  };

  // Note: Cleanup functionality has been removed for security reasons
  // The cleanup_unused_books() function is now admin-only and should be
  // triggered through admin dashboard or scheduled background jobs

  // Filtering is already done server-side by usePaginatedLibraryBooks
  // No need for redundant client-side filtering

  const handleDownloadPDF = async (book: Book) => {
    if (!book.pdf_url) {
      toast({ title: 'PDF not available', description: 'This book does not have a PDF file.', variant: 'destructive' });
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = book.pdf_url;
      link.download = `${book.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      toast({ title: 'Download failed', description: 'Please try again.', variant: 'destructive' });
    }
  };

  const displayBooks = paginatedData?.books ?? [];
  

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
            <Button
              variant="outline"
              onClick={() => { refetchAll(); window.dispatchEvent(new Event('shelfUpdated')); }}
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
                My Personal Library
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
                  {paginatedData?.totalCount
                    ? `Showing ${((page - 1) * pageSize) + 1}-${Math.min(page * pageSize, paginatedData.totalCount)} of ${paginatedData.totalCount} books`
                    : 'No books match the current filters'}
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
                      {[12, 24, 48, 96].map((size) => (
                        <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Quality Standards Banner */}
          <div className="bg-gradient-to-r from-amber-50/80 via-white to-blue-50/80 border border-amber-200/70 rounded-xl p-3.5 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-amber-100 text-amber-700">✨</span>
              <span className="font-semibold text-gray-900">Quality-First Catalog:</span>
              <span className="text-gray-600 hidden md:inline">
                We evaluate content integrity, reflowable EPUB typography, and verified open licenses.
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap text-[11px] text-gray-500">
              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ● Carefully Edited
              </span>
              <span className="inline-flex items-center gap-1 text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                ● Open Textbooks
              </span>
              <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                ● Public Domain
              </span>
            </div>
          </div>

          <div ref={allGridRef} className="space-y-6">
            {isLoadingAll ? (
              <LoadingSpinner />
            ) : isErrorAll ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center space-y-4">
                <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
                <h3 className="text-lg font-semibold text-red-900">Unable to load library catalog</h3>
                <p className="text-sm text-red-600 max-w-md mx-auto">
                  {errorAll instanceof Error ? errorAll.message : 'An unexpected error occurred while fetching books.'}
                </p>
                <Button onClick={() => refetchAll()} variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            ) : (
              <>
                <BooksGrid books={displayBooks} onDownloadPDF={handleDownloadPDF} />
                
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
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
                    <Library className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                    My Personal Library
                  </h2>
                </div>
              </div>
              <PersonalLibrary />
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
