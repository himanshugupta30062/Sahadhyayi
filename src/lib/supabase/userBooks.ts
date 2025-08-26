import { supabase } from '@/integrations/supabase/client-universal';
import type { Book } from '@/hooks/useLibraryBooks';

export interface CurrentRead {
  id: string;
  book_id: string;
  status: string;
  progress?: number | null;
  last_opened_at?: string | null;
  books_library: Book;
}

export const fetchCurrentReads = async (): Promise<CurrentRead[]> => {
  const { data, error } = await supabase
    .from('user_books')
    .select(
      `id, book_id, status, progress, last_opened_at,
       books_library:book_id (
         id, title, author, genre, cover_image_url, description, publication_year,
         language, pdf_url, created_at, price, rating, isbn, pages, author_bio
       )`
    )
    .eq('status', 'reading')
    .order('last_opened_at', { ascending: false })
    .limit(6);

  if (error) throw error;
  return (data || []) as unknown as CurrentRead[];
};

export const updateLastOpenedAt = async (id: string) => {
  const { error } = await supabase
    .from('user_books')
    .update({ last_opened_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
};
