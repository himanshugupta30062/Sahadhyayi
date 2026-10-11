import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';

export const useLibraryBookCount = () =>
  useQuery({
    queryKey: ['library-book-count'],
    queryFn: async () => {
      // Fetch titles to calculate unique deduplicated books (matching the library catalog)
      try {
        const { data, error } = await supabase
          .from('books_library')
          .select('title');

        if (!error && Array.isArray(data) && data.length > 0) {
          const uniqueTitles = new Set<string>();
          data.forEach((b: { title?: string | null }) => {
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
      const { count, error: countError } = await supabase
        .from('books_library')
        .select('id', { count: 'exact', head: true });

      if (countError) throw countError;

      return count ?? 0;
    },
    staleTime: 5 * 60 * 1000,
  });
