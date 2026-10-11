import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { normalizeTitle } from '@/utils/catalog/metadataNormalization';
import { mapRawToEdition } from '@/utils/catalog/deduplicationEngine';
import type { Edition } from '@/types/bookCatalog';

export const useWorkEditions = (title?: string, currentBookId?: string) => {
  return useQuery({
    queryKey: ['work-editions', title, currentBookId],
    queryFn: async (): Promise<Edition[]> => {
      if (!title || !currentBookId) return [];
      const { cleanTitle } = normalizeTitle(title);

      const { data, error } = await supabase
        .from('books_library')
        .select('id, title, author, publication_year, cover_image_url, pdf_url, language, pages, genre, description')
        .ilike('title', `%${cleanTitle}%`)
        .neq('id', currentBookId)
        .limit(6);

      if (error || !Array.isArray(data)) return [];

      return data.map(row => mapRawToEdition(row));
    },
    enabled: Boolean(title && currentBookId),
    staleTime: 5 * 60 * 1000,
  });
};
