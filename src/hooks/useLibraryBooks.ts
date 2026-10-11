import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { normalizeCoverUrl } from '@/utils/normalizeCoverUrl';
import { getCoverQualityScore } from '@/utils/getCoverQualityScore';

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
}

// Only select columns we actually use — avoids transferring unnecessary data
const BOOK_SELECT_COLUMNS = 'id,title,author,genre,cover_image_url,description,publication_year,language,pdf_url,created_at,isbn,pages,author_bio';

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
});

// Shared cache settings — books don't change often
const CACHE_OPTIONS = {
  staleTime: 5 * 60 * 1000,   // 5 min before refetch
  gcTime: 30 * 60 * 1000,     // 30 min garbage collection
};

/** Fetch all books in paginated batches to avoid Supabase's 1000-row limit */
async function fetchAllBooks(): Promise<Book[]> {
  const BATCH = 500;
  const all: any[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('books_library')
      .select(BOOK_SELECT_COLUMNS)
      .range(offset, offset + BATCH - 1);

    if (error) throw error;
    if (data && data.length > 0) {
      all.push(...data);
      offset += BATCH;
      hasMore = data.length === BATCH;
    } else {
      hasMore = false;
    }
  }

  return sortBooksByCompleteness(all.map(mapBook));
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

export const useLibraryBooks = (searchQuery?: string, limit?: number) => {
  return useQuery({
    queryKey: ['library-books', searchQuery, limit],
    queryFn: async (): Promise<Book[]> => {
      let query = supabase.from('books_library').select(BOOK_SELECT_COLUMNS);

      if (searchQuery && searchQuery.trim()) {
        query = query.or(
          `title.ilike.%${searchQuery}%,author.ilike.%${searchQuery}%,genre.ilike.%${searchQuery}%`
        );
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return sortBooksByCompleteness((data || []).map(mapBook));
    },
    ...CACHE_OPTIONS,
  });
};

export const useBooksByGenre = (genre: string) => {
  return useQuery({
    queryKey: ['books-by-genre', genre],
    queryFn: async (): Promise<Book[]> => {
      let query = supabase.from('books_library').select(BOOK_SELECT_COLUMNS);

      if (genre !== 'All') {
        if (genre === 'Hindi') {
          query = query.eq('language', 'Hindi');
        } else {
          query = query.eq('genre', genre);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return sortBooksByCompleteness((data || []).map(mapBook));
    },
    ...CACHE_OPTIONS,
  });
};

export const useGenres = () => {
  return useQuery({
    queryKey: ['genres'],
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    queryFn: async (): Promise<Genre[]> => {
      const { data, error } = await supabase
        .from('books_library')
        .select('genre')
        .not('genre', 'is', null);

      if (error) throw error;

      const uniqueGenres = [...new Set((data as Array<{ genre: string }>).map(item => item.genre))];
      return uniqueGenres.map((genre, index) => ({
        id: index.toString(),
        name: genre as string,
      }));
    },
  });
};
