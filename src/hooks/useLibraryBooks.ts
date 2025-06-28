
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  description?: string;
  cover_image_url?: string;
  ebook_url?: string;
  rating: number;
  location?: string;
  community?: string;
  publication_year?: number;
  isbn?: string;
  pages?: number;
  language?: string;
  created_at: string;
  updated_at: string;
}

export const useLibraryBooks = () => {
  return useQuery({
    queryKey: ['library-books'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('rating', { ascending: false });
      
      if (error) {
        console.error('Error fetching books:', error);
        throw error;
      }
      
      return data as Book[];
    },
  });
};

export const useBooksByGenre = (genre?: string) => {
  return useQuery({
    queryKey: ['books-by-genre', genre],
    queryFn: async () => {
      let query = supabase
        .from('books')
        .select('*')
        .order('rating', { ascending: false });
      
      if (genre && genre !== 'All') {
        query = query.eq('genre', genre);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching books by genre:', error);
        throw error;
      }
      
      return data as Book[];
    },
  });
};

export const useGenres = () => {
  return useQuery({
    queryKey: ['genres'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('genres')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching genres:', error);
        throw error;
      }
      
      return data;
    },
  });
};
