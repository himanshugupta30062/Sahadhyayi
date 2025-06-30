
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Book {
  id: string;
  title: string;
  author: string;
  genre?: string;
  description?: string;
  author_bio?: string;
  cover_image_url?: string;
  ebook_url?: string;
  pdf_url?: string;
  price?: number;
  amazon_url?: string;
  google_books_url?: string;
  isbn?: string;
  publication_year?: number;
  pages?: number;
  language?: string;
  rating?: number;
  location?: string;
  community?: string;
  created_at: string;
  updated_at?: string;
}

export interface Genre {
  id: string;
  name: string;
}

export const useLibraryBooks = () => {
  return useQuery({
    queryKey: ['library-books'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('books_library')
        .select(`
          id,
          title,
          author,
          genre,
          description,
          author_bio,
          cover_image_url,
          pdf_url,
          isbn,
          publication_year,
          pages,
          language,
          created_at
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching books:', error);
        throw error;
      }
      
      const transformedBooks = (data || []).map(book => ({
        id: book.id,
        title: book.title,
        author: book.author || 'Unknown Author',
        genre: book.genre,
        description: book.description,
        author_bio: book.author_bio,
        cover_image_url: book.cover_image_url,
        ebook_url: undefined,
        pdf_url: book.pdf_url,
        price: undefined, // Remove price since it doesn't exist in database
        amazon_url: undefined,
        google_books_url: undefined,
        isbn: book.isbn,
        publication_year: book.publication_year,
        pages: book.pages,
        language: book.language,
        rating: Math.random() * 2 + 3.5, // Random rating between 3.5-5.5 for demo
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
          description,
          author_bio,
          cover_image_url,
          pdf_url,
          isbn,
          publication_year,
          pages,
          language,
          created_at
        `)
        .order('created_at', { ascending: false });
      
      if (genre && genre !== 'All') {
        // Handle Hindi language filter specifically
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
      
      const transformedBooks = (data || []).map(book => ({
        id: book.id,
        title: book.title,
        author: book.author || 'Unknown Author',
        genre: book.genre,
        description: book.description,
        author_bio: book.author_bio,
        cover_image_url: book.cover_image_url,
        ebook_url: undefined,
        pdf_url: book.pdf_url,
        price: undefined, // Remove price since it doesn't exist in database
        amazon_url: undefined,
        google_books_url: undefined,
        isbn: book.isbn,
        publication_year: book.publication_year,
        pages: book.pages,
        language: book.language,
        rating: Math.random() * 2 + 3.5, // Random rating between 3.5-5.5 for demo
        created_at: book.created_at || new Date().toISOString(),
      }));
      
      return transformedBooks as Book[];
    },
  });
};

export const useGenres = () => {
  return useQuery<Genre[]>({
    queryKey: ['genres'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('books_library')
        .select('genre, language')
        .order('genre');
      
      if (error) {
        console.error('Error fetching genres:', error);
        const genres: Genre[] = [
          { id: '1', name: 'Science' },
          { id: '2', name: 'Fiction' },
          { id: '3', name: 'Non-Fiction' },
          { id: '4', name: 'Biography' },
          { id: '5', name: 'History' },
          { id: '6', name: 'Philosophy' },
          { id: '7', name: 'Technology' },
          { id: '8', name: 'Self-Help' },
          { id: '9', name: 'Hindi' },
        ];
        return genres;
      }
      
      const genreValues = data?.map(item => item.genre) || [];
      const languageValues = data?.map(item => item.language) || [];
      
      // Combine genres and languages, with special handling for Hindi
      const allValues = [...genreValues, ...languageValues];
      const uniqueValues = [...new Set(allValues.filter((value): value is string => typeof value === 'string' && value !== null))];
      
      return uniqueValues.map((value, index) => ({
        id: (index + 1).toString(),
        name: value
      })) as Genre[];
    },
  });
};
