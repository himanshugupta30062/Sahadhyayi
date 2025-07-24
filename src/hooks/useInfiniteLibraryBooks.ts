import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Book } from './useLibraryBooks';

const PAGE_SIZE = 20;

export const useInfiniteLibraryBooks = (
  genre?: string,
  searchQuery?: string
) => {
  return useInfiniteQuery({
    queryKey: ['infinite-library-books', genre, searchQuery],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const from = pageParam;
      const to = from + PAGE_SIZE - 1;
      let query = supabase
        .from('books_library')
        .select('*')
        .order('created_at', { ascending: true })
        .range(from, to);

      if (genre && genre !== 'All') {
        if (genre === 'Hindi') {
          query = query.eq('language', 'Hindi');
        } else {
          query = query.eq('genre', genre);
        }
      }

      if (searchQuery && searchQuery.trim()) {
        query = query.or(
          `title.ilike.%${searchQuery}%,author.ilike.%${searchQuery}%`
        );
      }

      const { data, error } = await query;
      if (error) {
        throw error;
      }

      return (data || []) as Book[];
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.length === PAGE_SIZE ? pages.length * PAGE_SIZE : undefined,
  });
};
