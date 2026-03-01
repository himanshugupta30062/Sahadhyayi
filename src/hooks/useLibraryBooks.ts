import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';

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
  created_at: string;
  price?: number;
  rating?: number;
  isbn?: string;
  pages?: number;
  author_bio?: string;
}

// Only select columns we actually use — avoids transferring unnecessary data
const BOOK_SELECT_COLUMNS = 'id,title,author,genre,cover_image_url,description,publication_year,language,pdf_url,created_at,isbn,pages,author_bio';

// Function to calculate book completeness score (higher score = better book)
const getBookCompletenessScore = (book: any): number => {
  let score = 0;
  if (book.pdf_url) score += 100;
  if (book.cover_image_url) score += 50;
  if (book.description) score += 20;
  if (book.author_bio) score += 15;
  if (book.genre) score += 10;
  if (book.publication_year) score += 8;
  if (book.pages) score += 7;
  if (book.isbn) score += 5;
  if (book.language && book.language !== 'English') score += 3;
  return score;
};

const sortBooksByCompleteness = (books: any[]): any[] => {
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

export const useLibraryBooks = (searchQuery?: string) => {
  return useQuery({
    queryKey: ['library-books', searchQuery],
    queryFn: async (): Promise<Book[]> => {
      let query = supabase.from('books_library').select(BOOK_SELECT_COLUMNS);

      if (searchQuery && searchQuery.trim()) {
        query = query.or(
          `title.ilike.%${searchQuery}%,author.ilike.%${searchQuery}%,genre.ilike.%${searchQuery}%`
        );
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

      const uniqueGenres = [...new Set(data.map(item => item.genre))];
      return uniqueGenres.map((genre, index) => ({
        id: index.toString(),
        name: genre,
      }));
    },
  });
};
