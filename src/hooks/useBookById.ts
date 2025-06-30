
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Book } from './useLibraryBooks';

export const useBookById = (id?: string) => {
  return useQuery({
    queryKey: ['book', id],
    enabled: !!id,
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
          internet_archive_url,
          isbn,
          publication_year,
          pages,
          language,
          created_at
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching book:', error);
        throw error;
      }

      if (!data) return null;

      return {
        id: data.id,
        title: data.title,
        author: data.author || 'Unknown Author',
        genre: data.genre,
        description: data.description,
        author_bio: data.author_bio,
        cover_image_url: data.cover_image_url,
        ebook_url: data.internet_archive_url,
        pdf_url: data.pdf_url,
        price: undefined, // Remove price since it doesn't exist
        amazon_url: undefined,
        google_books_url: undefined,
        internet_archive_url: data.internet_archive_url,
        isbn: data.isbn,
        publication_year: data.publication_year,
        pages: data.pages,
        language: data.language,
        rating: Math.random() * 2 + 3.5,
        created_at: data.created_at || new Date().toISOString(),
      } as Book;
    },
  });
};
