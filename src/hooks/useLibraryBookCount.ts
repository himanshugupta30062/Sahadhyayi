import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';

export const useLibraryBookCount = () =>
  useQuery({
    queryKey: ['library-book-count'],
    queryFn: async () => {
      // Fetch titles to calculate unique deduplicated books (matching the library catalog, excluding archived records)
      const { data, error } = await supabase
        .from('books_library')
        .select('title, status, catalog_status');

      if (!error && Array.isArray(data) && data.length > 0) {
        const uniqueTitles = new Set<string>();
        data.forEach((b: { title?: string | null; status?: string | null; catalog_status?: string | null }) => {
          const isActive = (!b.catalog_status || b.catalog_status === 'active') && (!b.status || b.status === 'active');
          if (!isActive) return;
          const key = (b.title || '').trim().toLowerCase();
          if (key) uniqueTitles.add(key);
        });
        return uniqueTitles.size;
      }

      // Fallback to exact count if title query fails or returns empty
      const { count, error: countError } = await supabase
        .from('books_library')
        .select('id', { count: 'exact', head: true })
        .or('catalog_status.eq.active,status.eq.active');

      if (countError) throw countError;

      return count;
    },
    staleTime: 5 * 60 * 1000,
  });
