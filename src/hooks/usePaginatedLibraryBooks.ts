import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import type { Book } from './useLibraryBooks';
import {
  getBookCompletenessScore,
  compareLibraryBooks,
  diversifyBooksPerPage,
} from './useLibraryBooks';
import { normalizeCoverUrl } from '@/utils/normalizeCoverUrl';
import { mapRawToEdition, clusterEditionsIntoWorks } from '@/utils/catalog/deduplicationEngine';
import {
  BASE_BOOK_SELECT_COLUMNS,
  detectBookSchemaCapabilities,
  getPublicBookSelectColumns,
  applyPublicBookFilter,
  filterPublicBooks,
} from '@/utils/catalog/bookVisibility';

interface UsePaginatedLibraryBooksParams {
  searchQuery?: string;
  selectedGenre?: string;
  selectedAuthor?: string;
  selectedYear?: string;
  selectedLanguage?: string;
  priceRange?: [number, number];
}

interface PaginatedBooksResponse {
  books: Book[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/** Fetch all matching books in batches to avoid 1000-row limit */
async function fetchFilteredBooks(
  searchQuery?: string,
  selectedGenre?: string,
  selectedAuthor?: string,
  selectedYear?: string,
  selectedLanguage?: string,
): Promise<Book[]> {
  const caps = await detectBookSchemaCapabilities();
  const selectColumns = getPublicBookSelectColumns(caps);
  const safeSearchQuery = (searchQuery || '').replace(/[,()]/g, ' ').replace(/\s+/g, ' ').trim();
  const BATCH = 500;
  const all: any[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    let query = supabase
      .from('books_library')
      .select(selectColumns)
      .order('created_at', { ascending: false })
      .range(offset, offset + BATCH - 1);

    query = applyPublicBookFilter(query, caps);

    if (safeSearchQuery) {
      query = query.or(
        `title.ilike.%${safeSearchQuery}%,author.ilike.%${safeSearchQuery}%,genre.ilike.%${safeSearchQuery}%`
      );
    }
    if (selectedGenre && selectedGenre !== 'All') {
      if (selectedGenre === 'Hindi') {
        query = query.eq('language', 'Hindi');
      } else {
        query = query.eq('genre', selectedGenre);
      }
    }
    if (selectedAuthor && selectedAuthor !== 'All') {
      query = query.eq('author', selectedAuthor);
    }
    if (selectedYear && selectedYear.trim()) {
      query = query.eq('publication_year', parseInt(selectedYear));
    }
    if (selectedLanguage && selectedLanguage !== 'All') {
      query = query.eq('language', selectedLanguage);
    }

    const { data, error } = await query;
    if (error) {
      if (caps.hasStatus || caps.hasCatalogStatus) {
        console.warn('fetchFilteredBooks probe mismatch, falling back to base columns:', error.message);
        let fallbackQuery = supabase
          .from('books_library')
          .select(BASE_BOOK_SELECT_COLUMNS)
          .order('created_at', { ascending: false })
          .range(offset, offset + BATCH - 1);

        fallbackQuery = applyPublicBookFilter(fallbackQuery, { hasStatus: false, hasCatalogStatus: false, checked: true });

        if (safeSearchQuery) {
          fallbackQuery = fallbackQuery.or(
            `title.ilike.%${safeSearchQuery}%,author.ilike.%${safeSearchQuery}%,genre.ilike.%${safeSearchQuery}%`
          );
        }
        if (selectedGenre && selectedGenre !== 'All') {
          if (selectedGenre === 'Hindi') {
            fallbackQuery = fallbackQuery.eq('language', 'Hindi');
          } else {
            fallbackQuery = fallbackQuery.eq('genre', selectedGenre);
          }
        }
        if (selectedAuthor && selectedAuthor !== 'All') {
          fallbackQuery = fallbackQuery.eq('author', selectedAuthor);
        }
        if (selectedYear && selectedYear.trim()) {
          fallbackQuery = fallbackQuery.eq('publication_year', parseInt(selectedYear));
        }
        if (selectedLanguage && selectedLanguage !== 'All') {
          fallbackQuery = fallbackQuery.eq('language', selectedLanguage);
        }

        const fallbackRes = await fallbackQuery;
        if (fallbackRes.error) throw fallbackRes.error;
        if (fallbackRes.data && fallbackRes.data.length > 0) {
          all.push(...fallbackRes.data);
          offset += BATCH;
          hasMore = fallbackRes.data.length === BATCH;
          continue;
        }
      }
      throw error;
    }
    if (data && data.length > 0) {
      all.push(...data);
      offset += BATCH;
      hasMore = data.length === BATCH;
    } else {
      hasMore = false;
    }
  }

  // Filter out archived/superseded books and cluster into Works
  const visibleRows = filterPublicBooks(all);
  const editions = visibleRows.map((row: any) => mapRawToEdition(row));
  const works = clusterEditionsIntoWorks(editions);

  // Convert preferred editions of each work into catalog books with quality metadata
  const deduped: Book[] = works.map(w => {
    const p = w.preferredEdition;
    const rawMatch = all.find(r => r.id === p.id);
    return {
      id: p.id,
      title: p.title,
      author: p.author || 'Unknown Author',
      genre: p.genre || rawMatch?.genre,
      cover_image_url: p.coverImageUrl || rawMatch?.cover_image_url,
      description: p.description || rawMatch?.description,
      publication_year: p.publicationYear || rawMatch?.publication_year,
      language: p.language || rawMatch?.language || 'English',
      pdf_url: p.assets.find(a => a.format === 'pdf')?.downloadUrl || rawMatch?.pdf_url,
      epub_url: p.assets.find(a => a.format === 'epub')?.downloadUrl,
      created_at: rawMatch?.created_at || new Date().toISOString(),
      price: 0,
      isbn: p.isbn13 || p.isbn10 || rawMatch?.isbn,
      pages: p.pages || rawMatch?.pages,
      author_bio: rawMatch?.author_bio,
      accessStatus: p.accessStatus,
      licenseEvidence: p.licenseEvidence,
      qualityScore: p.qualityScore,
      qualityReasons: p.qualityReasons,
      whyThisEdition: p.whyThisEdition,
      isPreferredEdition: true,
      alternativeEditionsCount: w.alternativeEditions.length,
      alternativeEditions: w.alternativeEditions,
      assets: p.assets,
    };
  });

  // Sort deterministically by library completeness hierarchy
  deduped.sort(compareLibraryBooks);

  // Return deterministically sorted catalog; paginatedData applies dynamic diversification per active pageSize
  return deduped;
}

export const usePaginatedLibraryBooks = (params: UsePaginatedLibraryBooksParams = {}) => {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(12);

  const { searchQuery, selectedGenre, selectedAuthor, selectedYear, selectedLanguage, priceRange } = params;

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedGenre, selectedAuthor, selectedYear, selectedLanguage, priceRange]);

  // Fetch ALL matching books once per filter set (cached 5 min).
  // Page changes just slice this cached array — no new network request.
  const allBooksQuery = useQuery({
    queryKey: ['paginated-library-all', searchQuery, selectedGenre, selectedAuthor, selectedYear, selectedLanguage],
    queryFn: () => fetchFilteredBooks(searchQuery, selectedGenre, selectedAuthor, selectedYear, selectedLanguage),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  // Automatically refetch when books are added or shelf updates anywhere
  React.useEffect(() => {
    const handleUpdate = () => {
      allBooksQuery.refetch();
    };

    window.addEventListener('shelfUpdated', handleUpdate);
    window.addEventListener('libraryUpdated', handleUpdate);
    return () => {
      window.removeEventListener('shelfUpdated', handleUpdate);
      window.removeEventListener('libraryUpdated', handleUpdate);
    };
  }, [allBooksQuery]);

  // Derive paginated view from cached data (instant, no fetch)
  const paginatedData = React.useMemo((): PaginatedBooksResponse | undefined => {
    const allBooks = allBooksQuery.data;
    if (!allBooks) return undefined;

    // Apply per-page diversity adjustment so each page contains unique authors & titles
    const shouldDiversify = !selectedAuthor || selectedAuthor === 'All';
    const booksToPaginate = shouldDiversify
      ? diversifyBooksPerPage(allBooks, pageSize)
      : allBooks;

    const totalCount = booksToPaginate.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (page - 1) * pageSize;
    const books = booksToPaginate.slice(startIndex, startIndex + pageSize);

    return {
      books,
      totalCount,
      totalPages,
      currentPage: page,
      pageSize,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }, [allBooksQuery.data, page, pageSize, selectedAuthor]);

  // Preload first 8 cover images for instant rendering
  React.useEffect(() => {
    if (!paginatedData?.books) return;
    const urls = paginatedData.books
      .slice(0, 8)
      .map(b => normalizeCoverUrl(b.cover_image_url))
      .filter(Boolean) as string[];
    urls.forEach(url => {
      const img = new Image();
      img.src = url;
    });
  }, [paginatedData?.books]);

  return {
    data: paginatedData,
    isLoading: allBooksQuery.isLoading,
    isError: allBooksQuery.isError,
    error: allBooksQuery.error,
    refetch: allBooksQuery.refetch,
    page,
    pageSize,
    totalPages: paginatedData?.totalPages ?? 0,
    goToPage: React.useCallback((p: number) => setPage(p), []),
    goToNextPage: React.useCallback(() => setPage(p => p + 1), []),
    goToPrevPage: React.useCallback(() => setPage(p => Math.max(1, p - 1)), []),
    changePageSize: React.useCallback((s: number) => { setPageSize(s); setPage(1); }, []),
    setPage,
    setPageSize,
  };
};
