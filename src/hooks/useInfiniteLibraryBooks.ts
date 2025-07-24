import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Book } from './useLibraryBooks';

const PAGE_SIZE = 20;

const fetchBooksPage = async (from: number): Promise<Book[]> => {
  const to = from + PAGE_SIZE - 1;
  const { data, error } = await supabase
    .from('books_library')
    .select('*')
    .order('created_at', { ascending: true })
    .range(from, to);
  if (error) {
    throw error;
  }
  return (data || []) as Book[];
};

export const useInfiniteLibraryBooks = () => {
  return useInfiniteQuery({
    queryKey: ['infinite-library-books'],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fetchBooksPage(pageParam),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length * PAGE_SIZE : undefined,
  });
};
