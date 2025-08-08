import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import type { Book } from './useLibraryBooks';

export const useAuthorBooks = (authorId: string) => {
  return useQuery({
    queryKey: ['author-books', authorId],
    queryFn: async (): Promise<Book[]> => {
      if (!authorId) return [];
      
      const { data, error } = await supabase
        .from('books_library')
        .select('*')
        .eq('author_id', authorId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching author books:', error);
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
        isbn: book.isbn,
        pages: book.pages,
        author_bio: book.author_bio
      }));
    },
    enabled: !!authorId,
  });
};

export const useBooksByAuthorName = (authorName: string) => {
  return useQuery({
    queryKey: ['books-by-author-name', authorName],
    queryFn: async (): Promise<Book[]> => {
      if (!authorName) return [];
      
      const { data, error } = await supabase
        .from('books_library')
        .select('*')
        .ilike('author', `%${authorName}%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching books by author name:', error);
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
        isbn: book.isbn,
        pages: book.pages,
        author_bio: book.author_bio
      }));
    },
    enabled: !!authorName,
  });
};