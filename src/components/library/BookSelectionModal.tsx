import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  BookOpen,
  Download,
  Plus,
  Check,
  User,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  RotateCcw,
  AlertCircle,
  FileText,
  BookMarked,
  Filter,
} from 'lucide-react';
import OpenAccessBookCard from '@/components/books/OpenAccessBookCard';
import LibgenBookCard from './LibgenBookCard';
import type { ExternalBook } from '@/utils/searchExternalSources';
import { Link } from 'react-router-dom';
import { slugify } from '@/utils/slugify';
import { useAddToPersonalLibrary } from '@/hooks/usePersonalLibrary';
import { useBookSearch, type BookSearchResult, type BookSaveResult, type AccessType } from '@/hooks/useBookSearch';
import { useAuth } from '@/contexts/authHelpers';
import { toast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BookSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: BookSearchResult[];
  externalBooks?: ExternalBook[];
  searchTerm: string;
  onBooksAdded?: () => void;
}

const BookSelectionModal = ({
  isOpen,
  onClose,
  books,
  externalBooks = [],
  searchTerm,
  onBooksAdded,
}: BookSelectionModalProps) => {
  const { user } = useAuth();
  const addToLibraryMutation = useAddToPersonalLibrary();
  const { saveSelectedBooks, loading: isSaving } = useBookSearch();

  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(() => new Set(books.map((b) => b.id)));
  const [savedOutcomes, setSavedOutcomes] = useState<Map<string, BookSaveResult>>(new Map());
  const [currentPage, setCurrentPage] = useState(1);
  const booksPerPage = 10;

  // Filter states
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [formatFilter, setFormatFilter] = useState<string>('all');

  // Compute available sources and formats across results
  const availableSources = useMemo(() => {
    const set = new Set<string>();
    books.forEach((b) => {
      if (b.source) set.add(b.source);
    });
    return Array.from(set);
  }, [books]);

  // Apply filters
  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      if (sourceFilter !== 'all' && book.source !== sourceFilter) {
        return false;
      }
      if (formatFilter === 'pdf' && !book.pdf_url) return false;
      if (formatFilter === 'epub' && !book.epub_url) return false;
      if (formatFilter === 'reader' && !book.reader_url && !book.preview_url) return false;
      return true;
    });
  }, [books, sourceFilter, formatFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredBooks.length / booksPerPage));
  const paginatedBooks = useMemo(() => {
    const startIndex = (currentPage - 1) * booksPerPage;
    return filteredBooks.slice(startIndex, startIndex + booksPerPage);
  }, [filteredBooks, currentPage, booksPerPage]);

  const handleBookSelection = (bookId: string, isSelected: boolean) => {
    const newSelection = new Set(selectedBooks);
    if (isSelected) {
      newSelection.add(bookId);
    } else {
      newSelection.delete(bookId);
    }
    setSelectedBooks(newSelection);
  };

  const handleSelectAllOnPage = () => {
    const unSavedOnPage = paginatedBooks.filter(
      (b) => savedOutcomes.get(b.id)?.status !== 'inserted'
    );
    const allSelected = unSavedOnPage.every((b) => selectedBooks.has(b.id));
    const nextSelection = new Set(selectedBooks);
    if (allSelected) {
      unSavedOnPage.forEach((b) => nextSelection.delete(b.id));
    } else {
      unSavedOnPage.forEach((b) => nextSelection.add(b.id));
    }
    setSelectedBooks(nextSelection);
  };

  const handleSelectAllBooks = () => {
    if (selectedBooks.size === filteredBooks.length) {
      setSelectedBooks(new Set());
    } else {
      setSelectedBooks(new Set(filteredBooks.map((book) => book.id)));
    }
  };

  const handleSaveSelectedBooks = async () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to save books to the Sahadhyayi catalog.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedBooks.size === 0) {
      toast({
        title: 'No books selected',
        description: 'Please select at least one book to save.',
        variant: 'destructive',
      });
      return;
    }

    const booksToSave = books.filter((book) => selectedBooks.has(book.id));

    try {
      const outcome = await saveSelectedBooks(booksToSave);
      const nextOutcomes = new Map(savedOutcomes);

      // Record per-book outcome
      outcome.results.forEach((res) => {
        const matchingBook = booksToSave.find((b) => b.title === res.title);
        if (matchingBook) {
          nextOutcomes.set(matchingBook.id, res);
        }
      });
      setSavedOutcomes(nextOutcomes);

      // Remove successful books from selection, leave failed ones for retry
      const remainingSelected = new Set(selectedBooks);
      outcome.results.forEach((res) => {
        if (res.status === 'inserted' || res.status === 'already_exists' || res.status === 'enriched') {
          const matchingBook = booksToSave.find((b) => b.title === res.title);
          if (matchingBook) remainingSelected.delete(matchingBook.id);
        }
      });
      setSelectedBooks(remainingSelected);

      const parts: string[] = [];
      if (outcome.newlyInserted > 0) parts.push(`${outcome.newlyInserted} newly added`);
      if (outcome.enrichedCount > 0) parts.push(`${outcome.enrichedCount} metadata enriched`);
      if (outcome.duplicatesFound > 0 && outcome.newlyInserted === 0) parts.push(`${outcome.duplicatesFound} already in catalog`);
      if (outcome.failedCount > 0) parts.push(`${outcome.failedCount} failed`);

      toast({
        title: outcome.newlyInserted > 0 || outcome.enrichedCount > 0 ? 'Catalog updated' : 'Save completed',
        description: parts.join(', ') || 'Catalog records updated.',
        variant: outcome.failedCount > 0 && outcome.newlyInserted === 0 ? 'destructive' : 'default',
      });

      onBooksAdded?.();
    } catch (error: any) {
      toast({
        title: 'Error saving books',
        description: error?.message || 'Failed to save books. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleRetrySingle = async (book: BookSearchResult) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to save books.',
        variant: 'destructive',
      });
      return;
    }
    try {
      const outcome = await saveSelectedBooks([book]);
      const nextOutcomes = new Map(savedOutcomes);
      outcome.results.forEach((res) => {
        nextOutcomes.set(book.id, res);
      });
      setSavedOutcomes(nextOutcomes);
      onBooksAdded?.();
    } catch (err: any) {
      toast({
        title: 'Retry failed',
        description: err?.message || 'Could not save book.',
        variant: 'destructive',
      });
    }
  };

  const handleAddToPersonalLibrary = async (bookId: string) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to add books to your personal library.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await addToLibraryMutation.mutateAsync(bookId);
      onBooksAdded?.();
      toast({
        title: 'Saved to personal shelf',
        description: 'Book added to your personal library reading list.',
      });
    } catch {
      // Error handled in mutation
    }
  };

  const renderSourceBadge = (source?: string) => {
    switch (source) {
      case 'standard_ebooks':
        return <Badge className="bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200">Standard Ebooks</Badge>;
      case 'gutenberg':
        return <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200">Project Gutenberg</Badge>;
      case 'open_library':
        return <Badge className="bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-200">Open Library</Badge>;
      case 'google_books':
        return <Badge className="bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950 dark:text-purple-200">Google Books</Badge>;
      case 'internet_archive':
        return <Badge className="bg-stone-100 text-stone-900 border-stone-300 dark:bg-stone-900 dark:text-stone-200">Internet Archive</Badge>;
      case 'openalex':
        return <Badge className="bg-teal-100 text-teal-900 border-teal-300 dark:bg-teal-950 dark:text-teal-200">OpenAlex</Badge>;
      case 'wikisource':
        return <Badge className="bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950 dark:text-sky-200">Wikisource</Badge>;
      case 'sahadhyayi':
        return <Badge className="bg-[#1C442D] text-white">In Sahadhyayi</Badge>;
      default:
        return source ? <Badge variant="outline">{source}</Badge> : null;
    }
  };

  const renderAccessBadge = (accessType?: AccessType) => {
    switch (accessType) {
      case 'full_download':
        return <Badge variant="outline" className="text-emerald-700 border-emerald-300 dark:text-emerald-400">Full Text / Download</Badge>;
      case 'official_reader':
        return <Badge variant="outline" className="text-teal-700 border-teal-300 dark:text-teal-400">Official Reader</Badge>;
      case 'preview':
        return <Badge variant="outline" className="text-amber-700 border-amber-300 dark:text-amber-400">Preview Only</Badge>;
      case 'borrow':
        return <Badge variant="outline" className="text-indigo-700 border-indigo-300 dark:text-indigo-400">Borrow to Read</Badge>;
      default:
        return <Badge variant="outline" className="text-slate-600 border-slate-300 dark:text-slate-400">Metadata Only</Badge>;
    }
  };

  const handleClose = () => {
    setSelectedBooks(new Set());
    setCurrentPage(1);
    onClose();
  };

  if (books.length === 0 && externalBooks.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto bg-[#FAF7F2] dark:bg-[#0E1210] border-[#E8E2D9] dark:border-[#26302A] text-[#1C201D] dark:text-[#F3F0E7]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-[#B68A35] dark:text-[#D5B16D]" />
            <DialogTitle className="text-xl font-serif font-bold text-[#1C201D] dark:text-[#F3F0E7]">
              Book Search Results — "{searchTerm}"
            </DialogTitle>
          </div>
          <p className="text-sm text-[#636B65] dark:text-[#A5ADA6]">
            Found {filteredBooks.length} book{filteredBooks.length !== 1 ? 's' : ''} across verified public domain and digital library sources.
            {" "}Select titles to save them into Sahadhyayi’s permanent catalog.
          </p>
        </DialogHeader>

        {/* Filters and Search Source Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-y border-[#E8E2D9] dark:border-[#26302A]">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-[#636B65] dark:text-[#A5ADA6]">
              <Filter className="w-3.5 h-3.5" />
              <span>Source:</span>
              <Select value={sourceFilter} onValueChange={(val) => { setSourceFilter(val); setCurrentPage(1); }}>
                <SelectTrigger className="h-8 text-xs bg-white dark:bg-[#161D19] border-[#E8E2D9] dark:border-[#26302A]">
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#161D19] border-[#E8E2D9] dark:border-[#26302A]">
                  <SelectItem value="all">All Sources ({books.length})</SelectItem>
                  {availableSources.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-[#636B65] dark:text-[#A5ADA6]">
              <span>Format:</span>
              <Select value={formatFilter} onValueChange={(val) => { setFormatFilter(val); setCurrentPage(1); }}>
                <SelectTrigger className="h-8 text-xs bg-white dark:bg-[#161D19] border-[#E8E2D9] dark:border-[#26302A]">
                  <SelectValue placeholder="All Formats" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#161D19] border-[#E8E2D9] dark:border-[#26302A]">
                  <SelectItem value="all">All Formats</SelectItem>
                  <SelectItem value="pdf">PDF Download</SelectItem>
                  <SelectItem value="epub">EPUB Download</SelectItem>
                  <SelectItem value="reader">Web Reader</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-page"
                checked={
                  paginatedBooks.length > 0 &&
                  paginatedBooks.every((book) => selectedBooks.has(book.id))
                }
                onCheckedChange={handleSelectAllOnPage}
              />
              <label htmlFor="select-page" className="text-xs font-medium cursor-pointer">
                Select Page
              </label>
            </div>

            {filteredBooks.length > booksPerPage && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all-books"
                  checked={selectedBooks.size === filteredBooks.length && filteredBooks.length > 0}
                  onCheckedChange={handleSelectAllBooks}
                />
                <label htmlFor="select-all-books" className="text-xs font-medium cursor-pointer">
                  Select All ({filteredBooks.length})
                </label>
              </div>
            )}

            <Button
              onClick={handleSaveSelectedBooks}
              disabled={selectedBooks.size === 0 || isSaving}
              size="sm"
              className="bg-[#1C442D] hover:bg-[#255438] text-white dark:bg-[#D5B16D] dark:text-black dark:hover:bg-[#e4c688] font-medium"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              {isSaving ? 'Saving...' : user ? `Save Selected (${selectedBooks.size})` : `Sign In to Save (${selectedBooks.size})`}
            </Button>
          </div>
        </div>

        {/* Books List */}
        <div className="grid gap-3.5 mt-3">
          {paginatedBooks.map((book) => {
            const isSelected = selectedBooks.has(book.id);
            const outcome = savedOutcomes.get(book.id);

            return (
              <Card
                key={book.id}
                className={`overflow-hidden transition-all bg-white dark:bg-[#141816] border-[#E8E2D9] dark:border-[#26302A] shadow-xs ${
                  isSelected ? 'ring-2 ring-[#B68A35] dark:ring-[#D5B16D]' : ''
                }`}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex gap-3 sm:gap-4 items-start">
                    {/* Selection Checkbox */}
                    <div className="flex-shrink-0 pt-1">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleBookSelection(book.id, !!checked)}
                        disabled={outcome?.status === 'inserted'}
                      />
                    </div>

                    {/* Book Cover Thumbnail with 2:3 aspect ratio */}
                    <div className="flex-shrink-0 w-16 sm:w-20 aspect-[2/3] rounded-md overflow-hidden bg-[#EFEBE4] dark:bg-[#1A201C] border border-[#E8E2D9] dark:border-[#26302A]">
                      {book.cover_image_url ? (
                        <img
                          src={book.cover_image_url}
                          alt={book.title}
                          loading="lazy"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-full h-full flex items-center justify-center text-[#636B65] dark:text-[#A5ADA6] text-xs ${
                          book.cover_image_url ? 'hidden' : ''
                        }`}
                      >
                        <BookOpen className="w-6 h-6 opacity-40" />
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-serif font-bold text-base sm:text-lg text-[#1C201D] dark:text-[#F3F0E7] line-clamp-1">
                            {book.title}
                          </h3>
                          {book.author && (
                            <p className="text-xs sm:text-sm text-[#636B65] dark:text-[#A5ADA6] mt-0.5">
                              <Link
                                to={`/authors/${slugify(book.author)}`}
                                className="hover:text-[#B68A35] dark:hover:text-[#D5B16D] transition-colors"
                              >
                                {book.author}
                              </Link>
                            </p>
                          )}

                          {/* Source, Access and Format Badges */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            {renderSourceBadge(book.source)}
                            {renderAccessBadge(book.access_type)}
                            {book.publication_year && (
                              <Badge variant="outline" className="text-[11px] border-[#E8E2D9] dark:border-[#26302A]">
                                {book.publication_year}
                              </Badge>
                            )}
                            {book.genre && (
                              <Badge variant="outline" className="text-[11px] border-[#E8E2D9] dark:border-[#26302A]">
                                {book.genre}
                              </Badge>
                            )}
                            {book.isbn && (
                              <span className="text-[10px] text-[#636B65] dark:text-[#A5ADA6] font-mono">
                                ISBN {book.isbn}
                              </span>
                            )}
                          </div>

                          {/* Outcome Indicators */}
                          {outcome && (
                            <div className="mt-2">
                              {outcome.status === 'inserted' && (
                                <Badge className="bg-emerald-600 text-white text-[11px]">
                                  <Check className="w-3 h-3 mr-1" />
                                  Saved to catalog
                                </Badge>
                              )}
                              {outcome.status === 'enriched' && (
                                <Badge className="bg-blue-600 text-white text-[11px]">
                                  <Check className="w-3 h-3 mr-1" />
                                  Enriched existing record ({outcome.enrichedFields?.join(', ')})
                                </Badge>
                              )}
                              {outcome.status === 'already_exists' && (
                                <Badge variant="outline" className="text-zinc-600 border-zinc-300 dark:text-zinc-400 text-[11px]">
                                  Already in catalog
                                </Badge>
                              )}
                              {outcome.status === 'failed' && (
                                <div className="inline-flex items-center gap-2">
                                  <Badge className="bg-rose-600 text-white text-[11px]">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Failed to save
                                  </Badge>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRetrySingle(book)}
                                    className="h-6 px-2 text-xs"
                                  >
                                    <RotateCcw className="w-3 h-3 mr-1" />
                                    Retry
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}

                          {book.description && (
                            <p className="text-xs text-[#636B65] dark:text-[#A5ADA6] mt-2 line-clamp-2 leading-relaxed">
                              {book.description}
                            </p>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-row sm:flex-col gap-1.5 flex-shrink-0 self-start mt-2 sm:mt-0">
                          {user && (
                            <Button
                              onClick={() => handleAddToPersonalLibrary(book.id)}
                              disabled={addToLibraryMutation.isPending}
                              size="sm"
                              variant="outline"
                              className="text-xs h-8 border-[#E8E2D9] dark:border-[#26302A]"
                            >
                              <User className="w-3.5 h-3.5 mr-1" />
                              Personal Shelf
                            </Button>
                          )}

                          {/* PDF Download Button */}
                          {book.pdf_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                window.open(book.pdf_url!, '_blank');
                              }}
                              className="text-xs h-8 text-emerald-700 dark:text-emerald-400 border-[#E8E2D9] dark:border-[#26302A]"
                            >
                              <Download className="w-3.5 h-3.5 mr-1" />
                              Download PDF
                            </Button>
                          )}

                          {/* EPUB Download Button */}
                          {book.epub_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                window.open(book.epub_url!, '_blank');
                              }}
                              className="text-xs h-8 text-amber-700 dark:text-amber-400 border-[#E8E2D9] dark:border-[#26302A]"
                            >
                              <FileText className="w-3.5 h-3.5 mr-1" />
                              Download EPUB
                            </Button>
                          )}

                          {/* Web Reader / Preview Button */}
                          {(book.reader_url || book.preview_url) && !book.pdf_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                window.open((book.reader_url || book.preview_url)!, '_blank');
                              }}
                              className="text-xs h-8 text-blue-700 dark:text-blue-400 border-[#E8E2D9] dark:border-[#26302A]"
                            >
                              <ExternalLink className="w-3.5 h-3.5 mr-1" />
                              {book.reader_url ? 'Read Online' : 'Preview'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-4 py-3 border-t border-[#E8E2D9] dark:border-[#26302A] mt-2">
            <div className="text-xs text-[#636B65] dark:text-[#A5ADA6]">
              Showing {((currentPage - 1) * booksPerPage) + 1} to {Math.min(currentPage * booksPerPage, filteredBooks.length)} of {filteredBooks.length} books
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-8 px-2.5 text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Previous
              </Button>
              <span className="text-xs px-2 text-[#636B65] dark:text-[#A5ADA6]">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="h-8 px-2.5 text-xs"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* External Libgen Books Section if available */}
        {externalBooks.length > 0 && (
          <div className="mt-4 space-y-3 pt-4 border-t border-[#E8E2D9] dark:border-[#26302A]">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-[#1C201D] dark:text-[#F3F0E7]">
              <BookOpen className="w-4 h-4 text-[#B68A35] dark:text-[#D5B16D]" />
              <span>Additional Mirror Downloads ({externalBooks.length})</span>
            </h3>
            <div className="grid gap-3">
              {externalBooks.map((book) => {
                if (book.source === 'libgen' || book.id.startsWith('libgen-')) {
                  return <LibgenBookCard key={book.id} book={book as any} />;
                }
                return <OpenAccessBookCard key={book.id} book={book} />;
              })}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-[#E8E2D9] dark:border-[#26302A] mt-4">
          <p className="text-xs text-[#636B65] dark:text-[#A5ADA6]">
            {user ? (
              'Select books to add them to the permanent Sahadhyayi library for the community.'
            ) : (
              'Sign in to save books to the community library catalog.'
            )}
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {selectedBooks.size > 0 && (
              <Button
                onClick={handleSaveSelectedBooks}
                disabled={isSaving}
                className="bg-[#1C442D] hover:bg-[#255438] text-white dark:bg-[#D5B16D] dark:text-black font-medium"
              >
                <Plus className="w-4 h-4 mr-1" />
                {isSaving ? 'Saving...' : user ? `Save Selected (${selectedBooks.size})` : `Sign In to Save (${selectedBooks.size})`}
              </Button>
            )}
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookSelectionModal;