import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import type { Book } from './useLibraryBooks';
import { mapAuthorBook } from '@/utils/authorMappers';
import {
  detectBookSchemaCapabilities,
  applyPublicBookFilter,
  filterPublicBooks,
} from '@/utils/catalog/bookVisibility';

async function fetchAuthorBooks(
  filterColumn: 'author_id' | 'author',
  filterValue: string,
  matchByName = false,
): Promise<Book[]> {
  if (!filterValue) return [];

  const caps = await detectBookSchemaCapabilities();
  let query = supabase.from('books_library').select('*');
  query = matchByName
    ? query.ilike('author', `%${filterValue}%`)
    : query.eq('author_id', filterValue);
  query = applyPublicBookFilter(query, caps);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) {
    console.error(`Error fetching books by ${filterColumn}:`, error);
    throw error;
  }

  return filterPublicBooks(data || []).map(mapAuthorBook);
}

export const useAuthorBooks = (authorId: string) =>
  useQuery({
    queryKey: ['author-books', authorId],
    queryFn: () => fetchAuthorBooks('author_id', authorId),
    enabled: !!authorId,
  });

export const useBooksByAuthorName = (authorName: string) =>
  useQuery({
    queryKey: ['books-by-author-name', authorName],
    queryFn: () => fetchAuthorBooks('author', authorName, true),
    enabled: !!authorName,
  });
