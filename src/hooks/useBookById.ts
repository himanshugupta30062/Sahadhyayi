
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import type { Book } from './useLibraryBooks';
import {
  detectBookSchemaCapabilities,
  getPublicBookSelectColumns,
  isBookPubliclyVisible,
} from '@/utils/catalog/bookVisibility';

export const useBookById = (id?: string) => {
  return useQuery({
    queryKey: ['book', id],
    enabled: !!id,
    queryFn: async () => {
      const caps = await detectBookSchemaCapabilities();
      const selectCols = getPublicBookSelectColumns(caps);

      const { data, error } = await supabase
        .from('books_library')
        .select(selectCols)
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Failed to fetch book by ID', { errorName: error instanceof Error ? error.name : 'DatabaseError' });
        throw error;
      }

      if (!data || !isBookPubliclyVisible(data)) return null;

      return {
        id: data.id,
        title: data.title,
        author: data.author || 'Unknown Author',
        genre: data.genre,
        description: data.description,
        author_bio: data.author_bio,
        cover_image_url: data.cover_image_url,
        ebook_url: undefined,
        pdf_url: data.pdf_url,
        price: undefined, // Remove price since it doesn't exist
        amazon_url: undefined,
        google_books_url: undefined,
        isbn: data.isbn,
        publication_year: data.publication_year,
        pages: data.pages,
        language: data.language,
        created_at: data.created_at || new Date().toISOString(),
        status: data.status,
        catalog_status: data.catalog_status,
      } as Book;
    },
  });
};
