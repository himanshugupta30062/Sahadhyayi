
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

export interface Genre {
  id: string;
  name: string;
}

export const useAllLibraryBooks = () => {
  return useQuery({
    queryKey: ['all-library-books'],
    queryFn: async (): Promise<Book[]> => {
      const { data, error } = await supabase
        .from('books_library')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching library books:', error);
        throw error;
      }

      return (data || []).map(book => ({
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
        price: 0, // Not applicable for library books
        rating: 0, // Could be added later
        isbn: book.isbn,
        pages: book.pages,
        author_bio: book.author_bio
      }));
    },
  });
};

export const useBooksByGenre = (genre: string) => {
  return useQuery({
    queryKey: ['books-by-genre', genre],
    queryFn: async (): Promise<Book[]> => {
      let query = supabase
        .from('books_library')
        .select('*')
        .order('created_at', { ascending: true });

      if (genre !== 'All') {
        if (genre === 'Hindi') {
          query = query.eq('language', 'Hindi');
        } else {
          query = query.eq('genre', genre);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching books by genre:', error);
        throw error;
      }

      return (data || []).map(book => ({
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
        rating: 0,
        isbn: book.isbn,
        pages: book.pages,
        author_bio: book.author_bio
      }));
    },
  });
};

export const useGenres = () => {
  return useQuery({
    queryKey: ['genres'],
    queryFn: async (): Promise<Genre[]> => {
      const { data, error } = await supabase
        .from('books_library')
        .select('genre')
        .not('genre', 'is', null);

      if (error) {
        console.error('Error fetching genres:', error);
        throw error;
      }

      // Get unique genres and map to Genre interface
      const uniqueGenres = [...new Set(data.map(item => item.genre))];
      return uniqueGenres.map((genre, index) => ({
        id: index.toString(),
        name: genre
      }));
    },
  });
};
