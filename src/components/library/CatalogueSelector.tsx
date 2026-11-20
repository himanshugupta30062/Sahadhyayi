import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  Loader2,
  BookOpen,
  FileText,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Filter,
} from 'lucide-react';

export interface CatalogueBook {
  id: string;
  title: string;
  author: string | null;
  isbn: string | null;
  publication_year: number | null;
  language: string | null;
  cover_image_url: string | null;
  pdf_url: string | null;
  pdf_sha256: string | null;
  pdf_file_size: number | null;
  pdf_page_count: number | null;
  pdf_verification_status: string | null;
  genre: string | null;
  description: string | null;
  status: string | null;
  catalog_status: string | null;
  is_archived: boolean | null;
  created_at: string;
}

export interface CatalogueSelectorProps {
  /** Allow multiple selections */
  multiple?: boolean;
  /** Show book cover images */
  showCovers?: boolean;
  /** Show ISBN */
  showISBN?: boolean;
  /** Show PDF availability status */
  showPDFAvailability?: boolean;
  /** Show only books without PDFs */
  onlyMissingPDF?: boolean;
  /** Initial selected book IDs */
  selectedIds?: string[];
  /** Callback when selection changes */
  onSelectionChange: (ids: string[]) => void;
  /** Placeholder text for search input */
  searchPlaceholder?: string;
  /** Maximum height of results list */
  maxHeight?: string;
  /** Debounce delay in ms */
  debounceMs?: number;
  /** Disabled state */
  disabled?: boolean;
  /** Custom className */
  className?: string;
  /** Label for the selector */
  label?: string;
  /** Help text */
  helpText?: string;
  /** Show filter for PDF status */
  showPDFFilter?: boolean;
  /** Show archived books */
  includeArchived?: boolean;
  /** Pre-selected book ID to highlight (for single select) */
  highlightedId?: string;
}

const SEARCH_DEBOUNCE_MS = 300;
const PAGE_SIZE = 20;

function normalizeSearchTerm(term: string): string {
  return term.trim().replace(/[,()]/g, ' ').replace(/\s+/g, ' ').slice(0, 200);
}

async function searchCatalogueBooks(
  query: string,
  page: number,
  pageSize: number,
  onlyMissingPDF: boolean,
  includeArchived: boolean
): Promise<{ books: CatalogueBook[]; total: number; hasMore: boolean }> {
  const cleanQuery = normalizeSearchTerm(query);
  if (!cleanQuery) {
    // When no query, fetch recent books
    let queryBuilder = supabase
      .from('books_library')
      .select(
        'id,title,author,isbn,publication_year,language,cover_image_url,pdf_url,pdf_sha256,pdf_file_size,pdf_page_count,pdf_verification_status,genre,description,status,catalog_status,is_archived,created_at'
      )
      .order('created_at', { ascending: false });

    if (!includeArchived) {
      queryBuilder = queryBuilder.eq('is_archived', false);
    }
    if (onlyMissingPDF) {
      queryBuilder = queryBuilder.or('pdf_url.is.null,pdf_url.eq.');
    }

    const { data, error } = await queryBuilder.range((page - 1) * pageSize, page * pageSize - 1);
    if (error) throw error;
    return { books: (data || []) as CatalogueBook[], total: data?.length || 0, hasMore: (data?.length || 0) === pageSize };
  }

  // Use the match_catalogue_book RPC for server-side search
  const parts = cleanQuery.split(/\s+/);
  let title = cleanQuery;
  let author = cleanQuery;
  let isbn: string | null = null;

  // Try to extract ISBN if present
  const isbnMatch = cleanQuery.match(/\b(\d{10}|\d{13})\b/);
  if (isbnMatch) {
    isbn = isbnMatch[1];
    title = cleanQuery;
    author = cleanQuery;
  } else {
    // Try to separate title and author if query looks like "Title by Author"
    const byIndex = cleanQuery.toLowerCase().indexOf(' by ');
    if (byIndex > 0) {
      title = cleanQuery.slice(0, byIndex).trim();
      author = cleanQuery.slice(byIndex + 4).trim();
    }
  }

  const { data: matches, error } = await supabase.rpc('match_catalogue_book', {
    p_title: title,
    p_author: author,
    p_isbn: isbn,
    p_limit: pageSize + 1, // Fetch one extra to detect if there are more
  });

  if (error) {
    // Fallback to direct query if RPC fails
    console.warn('Catalogue search RPC failed, falling back to direct query:', error.message);
    let queryBuilder = supabase
      .from('books_library')
      .select(
        'id,title,author,isbn,publication_year,language,cover_image_url,pdf_url,pdf_sha256,pdf_file_size,pdf_page_count,pdf_verification_status,genre,description,status,catalog_status,is_archived,created_at'
      )
      .or(`title.ilike.%${cleanQuery}%,author.ilike.%${cleanQuery}%,isbn.ilike.%${cleanQuery}%`)
      .order('created_at', { ascending: false });

    if (!includeArchived) {
      queryBuilder = queryBuilder.eq('is_archived', false);
    }
    if (onlyMissingPDF) {
      queryBuilder = queryBuilder.or('pdf_url.is.null,pdf_url.eq.');
    }

    const { data, error: queryError } = await queryBuilder.range((page - 1) * pageSize, page * pageSize - 1);
    if (queryError) throw queryError;
    return { books: (data || []) as CatalogueBook[], total: data?.length || 0, hasMore: (data?.length || 0) === pageSize };
  }

  const allMatches = (matches || []) as CatalogueBook[];
  const hasMore = allMatches.length > pageSize;
  const books = hasMore ? allMatches.slice(0, pageSize) : allMatches;

  // Apply client-side filters for missing PDF and archived
  let filtered = books;
  if (!includeArchived) {
    filtered = filtered.filter((b) => !b.is_archived);
  }
  if (onlyMissingPDF) {
    filtered = filtered.filter((b) => !b.pdf_url);
  }

  return { books: filtered, total: allMatches.length, hasMore };
}

export function CatalogueSelector({
  multiple = false,
  showCovers = true,
  showISBN = true,
  showPDFAvailability = true,
  onlyMissingPDF = false,
  selectedIds = [],
  onSelectionChange,
  searchPlaceholder = 'Search title, author, ISBN, or book ID…',
  maxHeight = '400px',
  debounceMs = SEARCH_DEBOUNCE_MS,
  disabled = false,
  className = '',
  label = 'Catalogue Book',
  helpText,
  showPDFFilter = true,
  includeArchived = false,
  highlightedId,
}: CatalogueSelectorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedSet, setSelectedSet] = useState<Set<string>>(new Set(selectedIds));
  const [filterPDFStatus, setFilterPDFStatus] = useState<'all' | 'with_pdf' | 'without_pdf'>('all');
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Sync selectedIds prop with internal state
  useEffect(() => {
    const nextSelectedSet = new Set(selectedIds);
    setSelectedSet((current) => {
      // Parent callers may provide a fresh array on every render. Avoid
      // scheduling another render when the selected IDs have not changed.
      if (
        current.size === nextSelectedSet.size &&
        Array.from(nextSelectedSet).every((id) => current.has(id))
      ) {
        return current;
      }
      return nextSelectedSet;
    });
  }, [selectedIds]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setCurrentPage(1);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [searchQuery, debounceMs]);

  // Fetch books based on debounced query
  const { data: searchResults, isLoading, error, refetch } = useQuery({
    queryKey: ['catalogue-search', debouncedQuery, currentPage, filterPDFStatus, onlyMissingPDF, includeArchived],
    queryFn: async () => {
      const effectiveOnlyMissingPDF = onlyMissingPDF || filterPDFStatus === 'without_pdf';
      const effectiveIncludeArchived = includeArchived;
      return searchCatalogueBooks(
        debouncedQuery,
        currentPage,
        PAGE_SIZE,
        effectiveOnlyMissingPDF,
        effectiveIncludeArchived
      );
    },
    enabled: currentPage === 1 || hasMore,
    placeholderData: (previousData) => previousData,
  });

  const books = searchResults?.books || [];
  const totalResults = searchResults?.total || 0;

  // Load more results
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    setCurrentPage((prev) => prev + 1);
    // The query will automatically fetch the next page
    await new Promise((resolve) => setTimeout(resolve, 100));
    setIsLoadingMore(false);
  }, [isLoadingMore, hasMore]);

  // Handle scroll to load more
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      if (target.scrollTop + target.clientHeight >= target.scrollHeight - 100) {
        void loadMore();
      }
    },
    [loadMore]
  );

  // Toggle book selection
  const toggleSelection = useCallback(
    (bookId: string) => {
      const newSet = new Set(selectedSet);
      if (multiple) {
        if (newSet.has(bookId)) {
          newSet.delete(bookId);
        } else {
          newSet.add(bookId);
        }
      } else {
        // Single select: replace selection
        newSet.clear();
        newSet.add(bookId);
      }
      setSelectedSet(newSet);
      onSelectionChange(Array.from(newSet));

      // Close dropdown on single select
      if (!multiple) {
        setShowDropdown(false);
        setSearchQuery('');
        setDebouncedQuery('');
        setCurrentPage(1);
      }
    },
    [selectedSet, multiple, onSelectionChange]
  );

  const isSelected = useCallback(
    (bookId: string) => selectedSet.has(bookId),
    [selectedSet]
  );

  const clearSelection = useCallback(() => {
    setSelectedSet(new Set());
    onSelectionChange([]);
  }, [onSelectionChange]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (showDropdown && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showDropdown]);

  const hasPDF = (book: CatalogueBook) => Boolean(book.pdf_url);
  const getPDFStatus = (book: CatalogueBook) => {
    if (!book.pdf_url) return { label: 'No PDF', variant: 'outline' as const, icon: FileText };
    if (book.pdf_verification_status === 'verified') return { label: 'Verified PDF', variant: 'default' as const, icon: Check };
    if (book.pdf_verification_status === 'malware_detected') return { label: 'Malware Detected', variant: 'destructive' as const, icon: X };
    return { label: 'PDF Linked', variant: 'secondary' as const, icon: FileText };
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
  };

  const getCoverUrl = (book: CatalogueBook) => {
    if (book.cover_image_url) return book.cover_image_url;
    if (book.isbn) return `https://covers.openlibrary.org/b/isbn/${book.isbn}-M.jpg?default=false`;
    return null;
  };

  return (
    <div className={`w-full ${className}`}>
      <Label className="block text-sm font-medium mb-1">{label}</Label>

      {/* Search Input & Trigger */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={searchInputRef}
          id="catalogue-search"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          onClick={() => setShowDropdown(true)}
          placeholder={searchPlaceholder}
          className="pl-9 pr-10"
          disabled={disabled}
          aria-expanded={showDropdown}
          aria-controls="catalogue-dropdown"
          aria-label={label}
        />
        {selectedSet.size > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 px-2 text-xs text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              clearSelection();
            }}
            disabled={disabled}
            aria-label="Clear selection"
          >
            <X className="h-3 w-3 mr-1" /> Clear
          </Button>
        )}
      </div>

      {helpText && <p className="mt-1 text-xs text-muted-foreground">{helpText}</p>}

      {/* Selected Chips */}
      {selectedSet.size > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5" role="list" aria-label="Selected books">
          {Array.from(selectedSet).slice(0, 5).map((bookId) => {
            const book = books.find((b) => b.id === bookId);
            return (
              <Badge key={bookId} variant="secondary" className="gap-1" role="listitem">
                {book?.title?.slice(0, 30) || bookId.slice(0, 8)}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelection(bookId);
                  }}
                  disabled={disabled}
                  aria-label={`Remove ${book?.title || bookId}`}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            );
          })}
          {selectedSet.size > 5 && (
            <Badge variant="outline" className="text-xs">
              +{selectedSet.size - 5} more
            </Badge>
          )}
        </div>
      )}

      {/* Dropdown Results */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          id="catalogue-dropdown"
          className="mt-1 z-50"
          role="listbox"
          aria-label={`${label} search results`}
        >
          <div className="rounded-xl border bg-popover shadow-lg overflow-hidden" style={{ maxHeight }}>
            {/* Filter Bar */}
            {showPDFFilter && (
              <div className="border-b p-2 flex flex-wrap items-center gap-2">
                <Filter className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Filter:</span>
                <div className="flex gap-1" role="group" aria-label="PDF status filter">
                  {(['all', 'with_pdf', 'without_pdf'] as const).map((filter) => (
                    <Button
                      key={filter}
                      type="button"
                      variant={filterPDFStatus === filter ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => {
                        setFilterPDFStatus(filter);
                        setCurrentPage(1);
                      }}
                    >
                      {filter === 'all' && 'All'}
                      {filter === 'with_pdf' && 'Has PDF'}
                      {filter === 'without_pdf' && 'Missing PDF'}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Results List */}
            <ScrollArea className="h-full" onScroll={handleScroll}>
              <div className="p-2 space-y-1" role="list">
                {isLoading && currentPage === 1 ? (
                  <div className="flex items-center justify-center py-8" role="status">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="sr-only">Searching catalogue…</span>
                  </div>
                ) : error ? (
                  <div className="py-4 text-center text-sm text-destructive" role="alert">
                    Search failed: {error instanceof Error ? error.message : 'Unknown error'}
                    <Button variant="link" size="sm" className="mt-1" onClick={() => refetch()}>
                      Retry
                    </Button>
                  </div>
                ) : books.length === 0 && debouncedQuery ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No books found matching “{debouncedQuery}”.
                  </div>
                ) : books.length === 0 && !debouncedQuery ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No books in catalogue yet.
                  </div>
                ) : (
                  <>
                    {books.map((book) => {
                      const selected = isSelected(book.id);
                      const pdfStatus = getPDFStatus(book);
                      const coverUrl = getCoverUrl(book);

                      return (
                        <button
                          key={book.id}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          aria-label={`${book.title} by ${book.author || 'Unknown author'}${hasPDF(book) ? ', PDF available' : ', no PDF'}`}
                          onClick={() => toggleSelection(book.id)}
                          disabled={disabled}
                          className={`w-full rounded-lg p-3 text-left transition-colors ${
                            selected
                              ? 'bg-primary/10 border-primary'
                              : 'hover:bg-muted/50'
                          } ${book.id === highlightedId ? 'ring-2 ring-primary' : ''} border flex flex-row items-start gap-3`}
                        >
                          {showCovers && coverUrl && (
                            <img
                              src={coverUrl}
                              alt=""
                              className="w-14 h-20 object-cover rounded border flex-shrink-0"
                              loading="lazy"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          )}
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <p className={`font-medium truncate ${selected ? 'text-primary' : ''}`}>
                                  {book.title}
                                </p>
                                {showPDFAvailability && (
                                  <Badge variant={pdfStatus.variant} className="flex-shrink-0 gap-1">
                                    {pdfStatus.icon && React.createElement(pdfStatus.icon, { className: 'h-3 w-3' })}
                                    {pdfStatus.label}
                                  </Badge>
                                )}
                              </div>
                              {book.author && (
                                <p className="mt-0.5 text-sm text-muted-foreground truncate">
                                  {book.author}
                                </p>
                              )}
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                {showISBN && book.isbn && (
                                  <span className="flex items-center gap-1">
                                    <span className="font-mono">ISBN {book.isbn}</span>
                                  </span>
                                )}
                                {Boolean(book.publication_year) && (
                                  <span>· {book.publication_year}</span>
                                )}
                                {book.language && (
                                  <span>· {book.language}</span>
                                )}
                                {Boolean(book.pdf_page_count) && (
                                  <span>· {book.pdf_page_count} pages</span>
                                )}
                                {Boolean(book.pdf_file_size) && (
                                  <span>· {formatFileSize(book.pdf_file_size)}</span>
                                )}
                              </div>
                            </div>
                            {selected && (
                              <div className="mt-2 flex items-center justify-between">
                                <span className="text-xs text-primary flex items-center gap-1">
                                  <Check className="h-3 w-3" /> Selected
                                </span>
                                {multiple && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 p-0 text-xs text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleSelection(book.id);
                                    }}
                                    disabled={disabled}
                                    aria-label={`Deselect ${book.title}`}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}

                    {/* Load More Trigger */}
                    {hasMore && (
                      <div className="py-4 text-center">
                        {isLoadingMore ? (
                          <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={loadMore}
                            disabled={disabled}
                            className="w-full"
                          >
                            Load more results
                            <ChevronDown className="ml-2 h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Results Summary */}
                    {totalResults > 0 && (
                      <div className="pt-2 border-t text-xs text-muted-foreground text-center">
                        Showing {books.length} of {totalResults} result{totalResults !== 1 ? 's' : ''}
                      </div>
                    )}
                  </>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {/* Hidden accessible selection for form submission */}
      {multiple && selectedSet.size > 0 && (
        <input
          type="hidden"
          name="catalogue_book_ids"
          value={Array.from(selectedSet).join(',')}
        />
      )}
    </div>
  );
}

export default CatalogueSelector;