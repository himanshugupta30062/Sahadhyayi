import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import type { Book } from './useLibraryBooks';
import { getBookCompletenessScore } from './useLibraryBooks';

// Only select columns we actually use
const PAGINATED_SELECT = 'id,title,author,genre,cover_image_url,description,publication_year,language,pdf_url,created_at,isbn,pages,author_bio';

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

const isNcertOrCbseBook = (book: Book) => {
  const t = (book.title || '').toLowerCase();
  const a = (book.author || '').toLowerCase();
  const g = (book.genre || '').toLowerCase();
  const d = (book.description || '').toLowerCase();
  return t.includes('ncert') || a.includes('ncert') || g.includes('ncert') || d.includes('ncert') ||
         t.includes('cbse') || a.includes('cbse') || g.includes('cbse') || d.includes('cbse');
};

const mapBook = (book: any): Book => ({
  id: book.id,
  title: book.title,
  author: book.author || 'Unknown Author',
  genre: book.genre,
  cover_image_url: book.cover_image_url,
  description: book.description,
  publication_year: book.publication_year,
  language: book.language || 'English',
  pdf_url: book.pdf_url,
  created_at: book.created_at,
  price: 0,
  isbn: book.isbn,
  pages: book.pages,
  author_bio: book.author_bio,
});

/** Fetch all matching books in batches to avoid 1000-row limit */
async function fetchFilteredBooks(
  searchQuery?: string,
  selectedGenre?: string,
  selectedAuthor?: string,
  selectedYear?: string,
  selectedLanguage?: string,
): Promise<Book[]> {
  const BATCH = 500;
  const all: any[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    let query = supabase
      .from('books_library')
      .select(PAGINATED_SELECT)
      .range(offset, offset + BATCH - 1);

    if (searchQuery && searchQuery.trim()) {
      query = query.or(
        `title.ilike.%${searchQuery}%,author.ilike.%${searchQuery}%,genre.ilike.%${searchQuery}%`
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
    if (error) throw error;
    if (data && data.length > 0) {
      all.push(...data);
      offset += BATCH;
      hasMore = data.length === BATCH;
    } else {
      hasMore = false;
    }
  }

  // Map, sort, dedup — then spread within tiers to preserve cover priority
  const mapped = all.map(mapBook);

  mapped.sort((a, b) => {
    const diff = getBookCompletenessScore(b) - getBookCompletenessScore(a);
    if (diff !== 0) return diff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Deduplicate by title
  const seen = new Set<string>();
  const deduped = mapped.filter(book => {
    const key = book.title.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Split into 3 tiers: with-cover, no-cover, NCERT/CBSE
  const withCover: Book[] = [];
  const noCover: Book[] = [];
  const ncert: Book[] = [];
  for (const book of deduped) {
    if (isNcertOrCbseBook(book)) {
      ncert.push(book);
    } else if (book.cover_image_url) {
      withCover.push(book);
    } else {
      noCover.push(book);
    }
  }

  // Round-robin spread by author within each tier to avoid author clustering
  const spreadByAuthor = (books: Book[]): Book[] => {
    const authorGroups = new Map<string, Book[]>();
    for (const book of books) {
      const k = (book.author || 'Unknown').trim().toLowerCase();
      if (!authorGroups.has(k)) authorGroups.set(k, []);
      authorGroups.get(k)!.push(book);
    }
    const queues = Array.from(authorGroups.values());
    queues.sort((a, b) => b.length - a.length);
    const result: Book[] = [];
    let rem = true;
    while (rem) {
      rem = false;
      for (const q of queues) {
        if (q.length > 0) {
          result.push(q.shift()!);
          if (q.length > 0) rem = true;
        }
      }
    }
    return result;
  };

  // Books with covers ALWAYS come first, then no-cover, then NCERT/CBSE last
  return [...spreadByAuthor(withCover), ...spreadByAuthor(noCover), ...spreadByAuthor(ncert)];
}

export const usePaginatedLibraryBooks = (params: UsePaginatedLibraryBooksParams = {}) => {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

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

  // Derive paginated view from cached data (instant, no fetch)
  const paginatedData = React.useMemo((): PaginatedBooksResponse | undefined => {
    const allBooks = allBooksQuery.data;
    if (!allBooks) return undefined;

    const totalCount = allBooks.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (page - 1) * pageSize;
    const books = allBooks.slice(startIndex, startIndex + pageSize);

    return {
      books,
      totalCount,
      totalPages,
      currentPage: page,
      pageSize,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }, [allBooksQuery.data, page, pageSize]);

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
