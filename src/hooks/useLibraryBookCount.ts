import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';

export const useLibraryBookCount = () =>
  useQuery({
    queryKey: ['library-book-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('books_library')
        .select('id', { count: 'exact', head: true });

      if (error) throw error;

      return count;
    },
  });
