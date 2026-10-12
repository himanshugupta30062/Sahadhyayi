import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import {
  detectBookSchemaCapabilities,
  applyPublicBookFilter,
  filterPublicBooks,
} from '@/utils/catalog/bookVisibility';

export const useLibraryBookCount = () =>
  useQuery({
    queryKey: ['library-book-count'],
    queryFn: async () => {
      const caps = await detectBookSchemaCapabilities();
      // Fetch titles to calculate unique deduplicated books (matching the library catalog)
      try {
        const selectCols = ['id', 'title'];
        if (caps.hasStatus) selectCols.push('status');
        if (caps.hasCatalogStatus) selectCols.push('catalog_status');

        let titleQuery = supabase
          .from('books_library')
          .select(selectCols.join(','));

        titleQuery = applyPublicBookFilter(titleQuery, caps);

        const { data, error } = await titleQuery;

        if (!error && Array.isArray(data) && data.length > 0) {
          const visibleBooks = filterPublicBooks(data);
          const uniqueTitles = new Set<string>();
          visibleBooks.forEach((b: { title?: string | null }) => {
            const key = (b.title || '').trim().toLowerCase();
            if (key) uniqueTitles.add(key);
          });
          if (uniqueTitles.size > 0) {
            return uniqueTitles.size;
          }
        }
      } catch {
        // Fallback to exact count below
      }

      // Fallback to exact count if title query fails or returns empty
      let countQuery = supabase
        .from('books_library')
        .select('id', { count: 'exact', head: true });

      countQuery = applyPublicBookFilter(countQuery, caps);

      const { count, error: countError } = await countQuery;

      if (countError) throw countError;

      return count ?? 0;
    },
    staleTime: 5 * 60 * 1000,
  });
