import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { normalizeCoverUrl } from '@/utils/normalizeCoverUrl';
import { getCoverQualityScore } from '@/utils/getCoverQualityScore';
import {
  BASE_BOOK_SELECT_COLUMNS,
  detectBookSchemaCapabilities,
  getPublicBookSelectColumns,
  applyPublicBookFilter,
  isBookPubliclyVisible,
  filterPublicBooks,
} from '@/utils/catalog/bookVisibility';

import type { AccessStatus, LicenseEvidence } from '@/types/bookCatalog';

export interface Book {
  id: string;
  title: string;
  author: string;
  genre?: string;
  cover_image_url?: string;
  description?: string;
  publication_year?: number;
  language?: string;
  pdf_url?: string;
  epub_url?: string;
  created_at: string;
  price?: number;
  rating?: number;
  isbn?: string;
  pages?: number;
  author_bio?: string;
  accessStatus?: AccessStatus;
  licenseEvidence?: LicenseEvidence;
  qualityScore?: number;
  qualityReasons?: string[];
  whyThisEdition?: string;
  isPreferredEdition?: boolean;
  alternativeEditionsCount?: number;
  alternativeEditions?: any[];
  assets?: any[];
  status?: string;
  catalog_status?: string;
}

// Only select columns we actually use — avoids transferring unnecessary data
export const BOOK_SELECT_COLUMNS = BASE_BOOK_SELECT_COLUMNS;

// Sorting rules (displayed to users via SortingInfoTooltip)
// Sorting rules (displayed to users via SortingInfoTooltip)
export const SORTING_RULES = [
  { label: 'Reflowable EPUB / Complete full text', points: '+300', priority: 'highest' },
  { label: 'Verified ISBN & Bibliographic metadata', points: '+200', priority: 'high' },
  { label: 'Direct open reading access', points: '+150', priority: 'high' },
  { label: 'Editorial assurance (Standard Ebooks / Open Textbooks / Gutenberg)', points: '+150', priority: 'high' },
  { label: 'Comprehensive synopsis & pagination', points: '+100', priority: 'medium' },
  { label: 'Verified high-res cover art', points: '+50', priority: 'medium' },
  { label: 'Ghost/empty record demotion', points: '−400', priority: 'demoted' },
  { label: 'Tie-breaker', points: 'newest first', priority: 'info' },
];

// Function to calculate book completeness score (higher score = better book)
export const getBookCompletenessScore = (book: any): number => {
  let score = 0;

  // Content integrity & readability (max 300)
  const pdf = book.pdf_url || '';
  const epub = book.epub_url || '';
  const isGooglePreview = pdf && pdf.includes('books.google.com');

  if (epub || (pdf && pdf.includes('standardebooks'))) {
    score += 300;
  } else if (pdf && !isGooglePreview) {
    score += 240;
  } else if (isGooglePreview) {
    score += 50;
  }

  // Bibliographic identity (max 200)
  if (book.author && book.author.trim() && book.author !== 'Unknown Author') {
    score += 80;
  }
  if (book.isbn && book.isbn.replace(/[^0-9X]/gi, '').length >= 10) {
    score += 80;
  }
  if (book.publication_year && book.publication_year > 1400) {
    score += 40;
  }

  // Verified access (max 150)
  if (epub || (pdf && !isGooglePreview)) {
    score += 150;
  } else if (isGooglePreview) {
    score += 40;
  }

  // Editorial assurance (max 150)
  const source = (pdf || '').toLowerCase();
  if (source.includes('standardebooks')) {
    score += 150;
  } else if (source.includes('open.umn.edu') || source.includes('openstax')) {
    score += 140;
  } else if (source.includes('gutenberg')) {
    score += 120;
  } else if (source.includes('archive.org')) {
    score += 90;
  } else {
    score += 40;
  }

  // Metadata completeness (max 100)
  if (book.description && book.description.length >= 100) score += 40;
  else if (book.description) score += 20;
  if (book.genre) score += 20;
  if (book.pages && book.pages > 10) score += 20;
  if (book.author_bio) score += 20;

  // Cover presentation (max 50)
  const cover = normalizeCoverUrl(book.cover_image_url);
  if (cover) {
    score += 30;
    score += Math.min(20, Math.round(getCoverQualityScore(cover) / 25));
  }

  // Demotions for empty ghost records
  if (!cover && !pdf && !epub && (!book.description || book.description.length < 20)) {
    score -= 400;
  }

  // Preview cap
  if (isGooglePreview && score > 350) {
    score = 350;
  }

  return score;
};

export const sortBooksByCompleteness = (books: any[]): any[] => {
  return books.sort((a, b) => {
    const scoreA = getBookCompletenessScore(a);
    const scoreB = getBookCompletenessScore(b);
    if (scoreA !== scoreB) return scoreB - scoreA;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
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
  status: book.status,
  catalog_status: book.catalog_status,
});

// Shared cache settings — books don't change often
const CACHE_OPTIONS = {
  staleTime: 5 * 60 * 1000,   // 5 min before refetch
  gcTime: 30 * 60 * 1000,     // 30 min garbage collection
};

/** Fetch all books in paginated batches to avoid Supabase's 1000-row limit */
async function fetchAllBooks(): Promise<Book[]> {
  const caps = await detectBookSchemaCapabilities();
  const columns = getPublicBookSelectColumns(caps);
  const BATCH = 500;
  const all: any[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    let query = supabase
      .from('books_library')
      .select(columns);

    query = applyPublicBookFilter(query, caps);

    const { data, error } = await query.range(offset, offset + BATCH - 1);

    if (error) {
      // Fallback: If status columns failed on unmigrated database, retry with base columns
      if (caps.hasStatus || caps.hasCatalogStatus) {
        console.warn('fetchAllBooks probe mismatch, falling back to base columns:', error.message);
        let fallbackQuery = supabase
          .from('books_library')
          .select(BASE_BOOK_SELECT_COLUMNS);
        fallbackQuery = applyPublicBookFilter(fallbackQuery, { hasStatus: false, hasCatalogStatus: false, checked: true });
        const fallbackRes = await fallbackQuery.range(offset, offset + BATCH - 1);
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

  const visible = filterPublicBooks(all);
  return sortBooksByCompleteness(visible.map(mapBook));
}

export interface Genre {
  id: string;
  name: string;
}

export const useAllLibraryBooks = () => {
  return useQuery({
    queryKey: ['all-library-books'],
    queryFn: fetchAllBooks,
    ...CACHE_OPTIONS,
  });
};

export interface LibraryBookQueryOptions {
  /** Return only catalog records that already have a stored cover URL. */
  requireCover?: boolean;
  /** Optional exact genre filter, used by homepage discovery. */
  genre?: string;
}

export const useLibraryBooks = (
  searchQuery?: string,
  limit?: number,
  options: LibraryBookQueryOptions = {}
) => {
  const requireCover = options.requireCover === true;
  const genre = options.genre && options.genre !== 'All' ? options.genre : undefined;
  return useQuery({
    queryKey: ['library-books', searchQuery, limit, requireCover, genre ?? 'All'],
    queryFn: async (): Promise<Book[]> => {
      const caps = await detectBookSchemaCapabilities();
      const columns = getPublicBookSelectColumns(caps);

      let query = supabase.from('books_library').select(columns);
      query = applyPublicBookFilter(query, caps);

      // Filter at the database before applying the limit, so homepage discovery
      // does not miss real covers merely because they occur later in the catalog.
      if (requireCover) {
        query = query.not('cover_image_url', 'is', null).neq('cover_image_url', '');
      }
      if (genre) {
        query = query.ilike('genre', genre.trim());
      }
      if (searchQuery && searchQuery.trim()) {
        query = query.or(
          `title.ilike.%${searchQuery}%,author.ilike.%${searchQuery}%,genre.ilike.%${searchQuery}%`
        );
      }

      if (requireCover) {
        query = query.order('created_at', { ascending: false });
      }
      if (limit) {
        query = query.limit(limit);
      } else if (requireCover) {
        query = query.limit(1000);
      }

      const { data, error } = await query;
      if (error) {
        // Fallback: If full column select fails (e.g. temporary schema or network glitch), try minimal guaranteed columns
        console.warn('Initial books_library query failed, attempting core fallback:', error.message);
        let fallbackQuery = supabase
          .from('books_library')
          .select('id,title,author,genre,cover_image_url,description,pdf_url,created_at');

        fallbackQuery = applyPublicBookFilter(fallbackQuery, { hasStatus: false, hasCatalogStatus: false, checked: true });

        if (requireCover) {
          fallbackQuery = fallbackQuery.not('cover_image_url', 'is', null).neq('cover_image_url', '');
        }
        if (genre) {
          fallbackQuery = fallbackQuery.ilike('genre', genre.trim());
        }
        if (searchQuery && searchQuery.trim()) {
          fallbackQuery = fallbackQuery.or(
            `title.ilike.%${searchQuery}%,author.ilike.%${searchQuery}%,genre.ilike.%${searchQuery}%`
          );
        }
        if (requireCover) {
          fallbackQuery = fallbackQuery.order('created_at', { ascending: false });
        }
        const fallback = limit
          ? await fallbackQuery.limit(limit)
          : await fallbackQuery.limit(requireCover ? 1000 : 24);

        if (!fallback.error && fallback.data) {
          const visibleFallback = filterPublicBooks(fallback.data);
          return sortBooksByCompleteness(visibleFallback.map(mapBook));
        }
        throw error;
      }
      const visible = filterPublicBooks(data || []);
      return sortBooksByCompleteness(visible.map(mapBook));
    },
    retry: 2,
    ...CACHE_OPTIONS,
  });
};

export const useBooksByGenre = (genre: string) => {
  return useQuery({
    queryKey: ['books-by-genre', genre],
    queryFn: async (): Promise<Book[]> => {
      const caps = await detectBookSchemaCapabilities();
      const columns = getPublicBookSelectColumns(caps);

      let query = supabase.from('books_library').select(columns);
      query = applyPublicBookFilter(query, caps);

      if (genre !== 'All') {
        if (genre === 'Hindi') {
          query = query.eq('language', 'Hindi');
        } else {
          query = query.eq('genre', genre);
        }
      }

      const { data, error } = await query;
      if (error) {
        // Fallback query with core columns
        console.warn('Initial books_by_genre query failed, attempting core fallback:', error.message);
        let fallbackQuery = supabase
          .from('books_library')
          .select('id,title,author,genre,cover_image_url,description,pdf_url,created_at');

        fallbackQuery = applyPublicBookFilter(fallbackQuery, { hasStatus: false, hasCatalogStatus: false, checked: true });

        if (genre !== 'All') {
          fallbackQuery = genre === 'Hindi'
            ? fallbackQuery.eq('language', 'Hindi')
            : fallbackQuery.eq('genre', genre);
        }

        const fallback = await fallbackQuery;
        if (!fallback.error && fallback.data) {
          const visibleFallback = filterPublicBooks(fallback.data);
          return sortBooksByCompleteness(visibleFallback.map(mapBook));
        }
        throw error;
      }
      const visible = filterPublicBooks(data || []);
      return sortBooksByCompleteness(visible.map(mapBook));
    },
    retry: 2,
    ...CACHE_OPTIONS,
  });
};

export const useGenres = () => {
  return useQuery({
    queryKey: ['genres'],
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    queryFn: async (): Promise<Genre[]> => {
      const caps = await detectBookSchemaCapabilities();
      const cols = caps.hasCatalogStatus || caps.hasStatus
        ? `genre${caps.hasStatus ? ',status' : ''}${caps.hasCatalogStatus ? ',catalog_status' : ''}`
        : 'genre';

      let query = supabase
        .from('books_library')
        .select(cols)
        .not('genre', 'is', null);

      query = applyPublicBookFilter(query, caps);

      const { data, error } = await query;
      if (error) throw error;

      const visible = filterPublicBooks(data || []);
      const uniqueGenres = [...new Set((visible as Array<{ genre: string }>).map(item => item.genre).filter(Boolean))];
      return uniqueGenres.map((genre, index) => ({
        id: index.toString(),
        name: genre as string,
      }));
    },
  });
};
