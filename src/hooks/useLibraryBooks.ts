import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { sampleBooks } from '@/data/sampleBooks';
import { secureFetch } from '@/lib/secureFetch';

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

// Function to calculate book completeness score (higher score = better book)
const getBookCompletenessScore = (book: any): number => {
  let score = 0;

  // PDF availability (highest priority)
  if (book.pdf_url) score += 100;

  // Cover image availability
  if (book.cover_image_url) score += 50;

  // Complete details
  if (book.description) score += 20;
  if (book.author_bio) score += 15;
  if (book.genre) score += 10;
  if (book.publication_year) score += 8;
  if (book.pages) score += 7;
  if (book.isbn) score += 5;
  if (book.language && book.language !== 'English') score += 3; // Bonus for non-English books

  return score;
};

// Default sorting function for books by completeness
const sortBooksByCompleteness = (books: any[]): any[] => {
  return books.sort((a, b) => {
    const scoreA = getBookCompletenessScore(a);
    const scoreB = getBookCompletenessScore(b);

    // Sort by completeness score (descending), then by creation date (newest first)
    if (scoreA !== scoreB) {
      return scoreB - scoreA;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
};

export interface Genre {
  id: string;
  name: string;
}

const normalizeGenre = (genre?: string | null, language?: string): string => {
  if (!genre || genre.trim() === '') {
    return language === 'Hindi' ? 'Hindi' : 'Other';
    }
  const formatted = genre.charAt(0).toUpperCase() + genre.slice(1).toLowerCase();
  return formatted;
};

export const mapBook = (book: any): Book => ({
  id: book.id,
  title: book.title,
  author: book.author || 'Unknown Author',
  genre: normalizeGenre(book.genre, book.language),
  cover_image_url: book.cover_image_url,
  description: book.description,
  publication_year: book.publication_year,
  language: book.language || 'English',
  pdf_url: book.pdf_url,
  created_at: book.created_at,
  price: 0,
  isbn: book.isbn,
  pages: book.pages,
  author_bio: book.author_bio
});

export const useAllLibraryBooks = () => {
  return useQuery({
    queryKey: ['all-library-books'],
    queryFn: async (): Promise<Book[]> => {
      try {
        const { data, error } = await supabase
          .from('books_library')
          .select('*');

        if (error || !data) {
          throw error;
        }

        const mappedBooks = data.map(mapBook);

        // Sort by completeness by default
        return sortBooksByCompleteness(mappedBooks);
      } catch (error) {
        console.error('Falling back to sample books due to error:', error);
        return sortBooksByCompleteness(sampleBooks);
      }
    },
  });
};

export const useLibraryBooks = (searchQuery?: string) => {
  return useQuery({
    queryKey: ['library-books', searchQuery],
    queryFn: async (): Promise<Book[]> => {
      const params = new URLSearchParams();
      if (searchQuery && searchQuery.trim()) {
        params.set('search', searchQuery);
      }
      const res = await secureFetch(`/api/books${params.toString() ? `?${params.toString()}` : ''}`);
      const data = await res.json();
      const mappedBooks = (data || []).map(mapBook);
      return sortBooksByCompleteness(mappedBooks);
    },
  });
};

export const useBooksByGenre = (genre: string) => {
  return useQuery({
    queryKey: ['books-by-genre', genre],
    queryFn: async (): Promise<Book[]> => {
      let query = supabase
        .from('books_library')
        .select('*');

      if (genre !== 'All') {
        if (genre === 'Hindi') {
          query = query.eq('language', 'Hindi');
        } else if (genre === 'Other') {
          query = query.is('genre', null);
        } else {
          query = query.eq('genre', genre);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching books by genre:', error);
        throw error;
      }

      const mappedBooks = (data || []).map(mapBook);

      // Sort by completeness by default
      return sortBooksByCompleteness(mappedBooks);
    },
  });
};

export const useGenres = () => {
  return useQuery({
    queryKey: ['genres'],
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryFn: async (): Promise<Genre[]> => {
      const { data, error } = await supabase
        .from('books_library')
        .select('genre, language');

      if (error) {
        console.error('Error fetching genres:', error);
        throw error;
      }

      const genresSet = new Set<string>();
      let hasOther = false;

      data.forEach(item => {
        if (item.genre) {
          genresSet.add(normalizeGenre(item.genre));
        } else if (item.language === 'Hindi') {
          genresSet.add('Hindi');
        } else {
          hasOther = true;
        }
      });

      if (hasOther) {
        genresSet.add('Other');
      }

      const uniqueGenres = Array.from(genresSet);
      return uniqueGenres.map((genre, index) => ({
        id: index.toString(),
        name: genre
      }));
    },
  });
};
