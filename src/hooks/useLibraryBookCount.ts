import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import {
  detectBookSchemaCapabilities,
  applyPublicBookFilter,
  filterPublicBooks,
} from '@/utils/catalog/bookVisibility';

export const useLibraryBookCount = () => {
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['library-book-count'] });
    };

    window.addEventListener('shelfUpdated', handleUpdate);
    window.addEventListener('libraryUpdated', handleUpdate);
    return () => {
      window.removeEventListener('shelfUpdated', handleUpdate);
      window.removeEventListener('libraryUpdated', handleUpdate);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['library-book-count'],
    queryFn: async () => {
      const caps = await detectBookSchemaCapabilities();
      let countQuery = supabase
        .from('books_library')
        .select('id', { count: 'exact', head: true });

      countQuery = applyPublicBookFilter(countQuery, caps);

      const { count, error } = await countQuery;
      if (!error && typeof count === 'number') {
        return count;
      }

      // Resilient fallback: simple exact count
      const { count: fallbackCount, error: fallbackError } = await supabase
        .from('books_library')
        .select('id', { count: 'exact', head: true });

      if (fallbackError) throw fallbackError;
      return fallbackCount ?? 0;
    },
    staleTime: 5 * 60 * 1000,
  });
};

