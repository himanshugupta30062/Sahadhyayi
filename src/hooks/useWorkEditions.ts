import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { normalizeTitle } from '@/utils/catalog/metadataNormalization';
import { mapRawToEdition } from '@/utils/catalog/deduplicationEngine';
import type { Edition } from '@/types/bookCatalog';
import {
  detectBookSchemaCapabilities,
  getPublicBookSelectColumns,
  applyPublicBookFilter,
  filterPublicBooks,
} from '@/utils/catalog/bookVisibility';

export const useWorkEditions = (title?: string, currentBookId?: string) => {
  return useQuery({
    queryKey: ['work-editions', title, currentBookId],
    queryFn: async (): Promise<Edition[]> => {
      if (!title || !currentBookId) return [];
      const { cleanTitle } = normalizeTitle(title);

      const caps = await detectBookSchemaCapabilities();
      const selectCols = getPublicBookSelectColumns(caps);

      let query = supabase
        .from('books_library')
        .select(selectCols)
        .ilike('title', `%${cleanTitle}%`)
        .neq('id', currentBookId);

      query = applyPublicBookFilter(query, caps);

      const { data, error } = await query.limit(10);

      if (error || !Array.isArray(data)) return [];

      const activeEditions = filterPublicBooks(data).slice(0, 6);

      return activeEditions.map(row => mapRawToEdition(row));
    },
    enabled: Boolean(title && currentBookId),
    staleTime: 5 * 60 * 1000,
  });
};

