
import * as React from 'react';
import { useState, useRef } from 'react';
import { Library, Search, BookOpen, AlertCircle, RefreshCw, Sparkles, Globe } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import PersonalLibrary from '@/components/PersonalLibrary';
import { useBookSearch } from '@/hooks/useBookSearch';
import { usePaginatedLibraryBooks } from '@/hooks/usePaginatedLibraryBooks';
import { isVerifiedPdf, type Book } from '@/hooks/useLibraryBooks';
import BooksGrid from './BooksGrid';
import LoadingGrid from './LoadingGrid';
import BookSearchBar from '@/components/books/BookSearchBar';
import BookSelectionModal from './BookSelectionModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

const QUICK_SEARCH_CHIPS = [
  'Bhagavad Gita',
  'Munshi Premchand',
  'Leo Tolstoy',
  'Fyodor Dostoevsky',
  'Rabindranath Tagore',
  'Marcus Aurelius',
  'Philosophy',
  'World History',
];

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
  const queryClient = useQueryClient();
  
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
        description: 'Try different keywords, an author name, or check spelling.',
      });
    }
  };

  const handleBooksAdded = () => {
    // Invalidate all related book queries so header, catalog count, and book grid update immediately
    void queryClient.invalidateQueries({ queryKey: ['library-book-count'] });
    void queryClient.invalidateQueries({ queryKey: ['paginated-library-books'] });
    void queryClient.invalidateQueries({ queryKey: ['paginated-library-all'] });
    void queryClient.invalidateQueries({ queryKey: ['library-books'] });
    void queryClient.invalidateQueries({ queryKey: ['community-stats'] });
    void queryClient.invalidateQueries({ queryKey: ['all-library-books'] });
    refetchAll();
    window.dispatchEvent(new Event('shelfUpdated'));
    window.dispatchEvent(new Event('libraryUpdated'));
  };

  // Note: Cleanup functionality has been removed for security reasons
  // The cleanup_unused_books() function is now admin-only and should be
  // triggered through admin dashboard or scheduled background jobs

  // Filtering is already done server-side by usePaginatedLibraryBooks
  // No need for redundant client-side filtering

  const handleDownloadPDF = async (book: Book) => {
    if (!book.pdf_url || !isVerifiedPdf(book)) {
      toast({
        title: 'Direct PDF not available',
        description: 'This edition is available via online reader or external source rather than direct file download.',
        variant: 'destructive',
      });
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
    <div className="space-y-6">
      {/* Books Collection with Tabs */}
      <Tabs defaultValue="all-books" className="w-full">
        <TabsList className={`grid w-full ${user ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <TabsTrigger value="all-books" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span>Browse Catalog ({paginatedData?.totalCount ?? 0})</span>
          </TabsTrigger>
          <TabsTrigger value="external-finder" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#B68A35] dark:text-[#D5B16D]" />
            <span>Ultimate Book Finder</span>
          </TabsTrigger>
          {user && (
            <TabsTrigger value="my-library" className="flex items-center gap-2">
              <div className="p-1 bg-gradient-to-br from-amber-500 to-orange-600 rounded">
                <Library className="w-3 h-3 text-white" />
              </div>
              <span>My Personal Library</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tab 2: Ultimate Book Finder */}
        <TabsContent value="external-finder" className="space-y-6 mt-6">
          <Card className="bg-gradient-to-br from-amber-50/50 via-white to-emerald-50/30 dark:from-[#141815] dark:via-[#101412] dark:to-[#171D19] border-[#E8E2D9] dark:border-[#26302A] shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#1C442D] text-white dark:bg-[#D5B16D] dark:text-black rounded-xl shadow-xs">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl font-serif font-bold text-[#1C201D] dark:text-[#F3F0E7]">
                        Ultimate Book Finder
                      </h3>
                      <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                        Open Access — No Sign-in Required
                      </Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-[#636B65] dark:text-[#A5ADA6] font-normal mt-0.5">
                      Federated search across Open Library, Project Gutenberg, Google Books, and Internet Archive. Anyone can import books directly to the library.
                    </p>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-1">
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
                  onClick={() => {
                    refetchAll();
                    void queryClient.invalidateQueries({ queryKey: ['library-book-count'] });
                    void queryClient.invalidateQueries({ queryKey: ['paginated-library-all'] });
                    window.dispatchEvent(new Event('shelfUpdated'));
                  }}
                  disabled={searchLoading}
                  className="flex items-center gap-2 border-[#E8E2D9] dark:border-[#26302A] h-12"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </Button>
              </div>

              {/* Quick Search Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-xs text-[#636B65] dark:text-[#A5ADA6] font-medium mr-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#B68A35] dark:text-[#D5B16D]" /> Popular searches:
                </span>
                {QUICK_SEARCH_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleSearch(chip)}
                    disabled={searchLoading}
                    className="text-xs px-2.5 py-1 rounded-full border border-[#E8E2D9] dark:border-[#26302A] bg-white dark:bg-[#1A201C] hover:border-[#B68A35] dark:hover:border-[#D5B16D] hover:text-[#B68A35] dark:hover:text-[#D5B16D] transition-colors shadow-2xs cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {searchError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{searchError}</AlertDescription>
                </Alert>
              )}

              {/* Source badges information */}
              <div className="bg-[#FAF7F2] dark:bg-[#161B18] p-4 rounded-xl border border-[#E8E2D9] dark:border-[#26302A]">
                <div className="grid sm:grid-cols-2 gap-4 text-xs text-[#636B65] dark:text-[#A5ADA6]">
                  <div>
                    <span className="font-semibold text-[#1C201D] dark:text-[#F3F0E7] flex items-center gap-1.5 mb-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#B68A35] dark:text-[#D5B16D]" /> How it works:
                    </span>
                    <ul className="space-y-1">
                      <li>• Searches multiple verified literary repositories simultaneously</li>
                      <li>• Displays high-resolution cover art, book descriptions, and formats</li>
                      <li>• Single-click <strong>"Add to Library"</strong> saves the book instantly to our communal catalog</li>
                      <li>• Immediately increments Digital Library headers and catalog counts</li>
                    </ul>
                  </div>
                  <div>
                    <span className="font-semibold text-[#1C201D] dark:text-[#F3F0E7] flex items-center gap-1.5 mb-1.5">
                      <Globe className="w-3.5 h-3.5 text-emerald-600" /> Integrated Sources:
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <Badge variant="outline" className="text-[11px] bg-white dark:bg-[#1A201C] border-[#E8E2D9] dark:border-[#26302A]">
                        Open Library (20M+ editions)
                      </Badge>
                      <Badge variant="outline" className="text-[11px] bg-white dark:bg-[#1A201C] border-[#E8E2D9] dark:border-[#26302A]">
                        Project Gutenberg (70,000+ public domain)
                      </Badge>
                      <Badge variant="outline" className="text-[11px] bg-white dark:bg-[#1A201C] border-[#E8E2D9] dark:border-[#26302A]">
                        Google Books (Previews & metadata)
                      </Badge>
                      <Badge variant="outline" className="text-[11px] bg-white dark:bg-[#1A201C] border-[#E8E2D9] dark:border-[#26302A]">
                        Internet Archive (Historical scans)
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 1: Primary Catalog Browsing */}
        <TabsContent value="all-books" className="space-y-6 mt-6">
          {/* Enhanced All Books Header */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                  <Library className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C201D] dark:text-[#F3F0E7] tracking-tight mb-2">
                    All Books
                  </h2>
                  <div className="h-1 w-12 bg-[#1C442D] dark:bg-[#D5B16D] rounded-full"></div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="text-sm text-[#636B65] dark:text-[#A5ADA6] font-medium">
                  {paginatedData?.totalCount
                    ? `Showing ${((page - 1) * pageSize) + 1}–${Math.min(page * pageSize, paginatedData.totalCount)} of ${paginatedData.totalCount} books`
                    : 'No books match the current filters'}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[#636B65] dark:text-[#A5ADA6]">Per page:</span>
                  <Select 
                    value={String(pageSize)} 
                    onValueChange={(value) => {
                      setPageSize(Number.parseInt(value, 10));
                      setPage(1); // Reset to page 1 when changing page size
                    }}
                  >
                    <SelectTrigger className="w-18 h-8 text-xs border border-[#E8E2D9] dark:border-[#26302A] bg-white dark:bg-[#181F1B] text-[#1C201D] dark:text-[#F3F0E7] hover:border-[#1C442D] dark:hover:border-[#D5B16D] transition-colors rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#181F1B] border border-[#E8E2D9] dark:border-[#26302A] text-xs shadow-md z-50">
                      {[12, 24, 48, 96].map((size) => (
                        <SelectItem key={size} value={size.toString()} className="text-xs cursor-pointer">{size}</SelectItem>
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
