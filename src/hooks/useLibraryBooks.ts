
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Book {
  id: string;
  title: string;
  author: string;
  genre?: string;
  description?: string;
  cover_image_url?: string;
  ebook_url?: string;
  rating?: number;
  location?: string;
  community?: string;
  publication_year?: number;
  isbn?: string;
  pages?: number;
  language?: string;
  created_at: string;
  updated_at?: string;
}

export const useLibraryBooks = () => {
  return useQuery({
    queryKey: ['library-books'],
    queryFn: async () => {
      // Query the books_library table which has more fields
      const { data, error } = await supabase
        .from('books_library')
        .select(`
          id,
          title,
          author,
          genre,
          cover_image_url,
          pdf_url,
          created_at
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching books:', error);
        throw error;
      }
      
      // Transform the data to match our Book interface
      const transformedBooks = (data || []).map(book => ({
        id: book.id,
        title: book.title,
        author: book.author || 'Unknown Author',
        genre: book.genre || 'Fiction',
        description: `A great book by ${book.author || 'Unknown Author'}`,
        cover_image_url: book.cover_image_url,
        ebook_url: book.pdf_url,
        rating: Math.random() * 2 + 3, // Random rating between 3-5 for demo
        created_at: book.created_at || new Date().toISOString(),
      }));
      
      return transformedBooks as Book[];
    },
  });
};

export const useBooksByGenre = (genre?: string) => {
  return useQuery({
    queryKey: ['books-by-genre', genre],
    queryFn: async () => {
      let query = supabase
        .from('books_library')
        .select(`
          id,
          title,
          author,
          genre,
          cover_image_url,
          pdf_url,
          created_at
        `)
        .order('created_at', { ascending: false });
      
      if (genre && genre !== 'All') {
        query = query.eq('genre', genre);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching books by genre:', error);
        throw error;
      }
      
      // Transform the data to match our Book interface
      const transformedBooks = (data || []).map(book => ({
        id: book.id,
        title: book.title,
        author: book.author || 'Unknown Author',
        genre: book.genre || 'Fiction',
        description: `A great book by ${book.author || 'Unknown Author'}`,
        cover_image_url: book.cover_image_url,
        ebook_url: book.pdf_url,
        rating: Math.random() * 2 + 3, // Random rating between 3-5 for demo
        created_at: book.created_at || new Date().toISOString(),
      }));
      
      return transformedBooks as Book[];
    },
  });
};

export const useGenres = () => {
  return useQuery({
    queryKey: ['genres'],
    queryFn: async () => {
      // Get unique genres from books_library table
      const { data, error } = await supabase
        .from('books_library')
        .select('genre')
        .order('genre');
      
      if (error) {
        console.error('Error fetching genres:', error);
        // Return hardcoded genres as fallback
        const genres = [
          { id: '1', name: 'Fiction' },
          { id: '2', name: 'Science Fiction' },
          { id: '3', name: 'Mystery' },
          { id: '4', name: 'Romance' },
          { id: '5', name: 'Fantasy' },
          { id: '6', name: 'Non-Fiction' },
          { id: '7', name: 'Biography' },
          { id: '8', name: 'History' },
          { id: '9', name: 'Self-Help' },
          { id: '10', name: 'Thriller' },
        ];
        return genres;
      }
      
      // Extract unique genres and create the expected format
      const uniqueGenres = [...new Set(data?.map(item => item.genre).filter(genre => genre != null))] || [];
      return uniqueGenres.map((genre, index) => ({
        id: (index + 1).toString(),
        name: genre
      }));
    },
  });
};
