import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import type { Author } from './useAuthors';

import { slugify } from '@/utils/slugify';

export const useAuthorBySlug = (slug?: string) => {
  return useQuery({
    queryKey: ['author', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_authors_data');
      if (error) throw error;
      const author = (data || []).find((a: any) => slugify(a.name) === slug);
      return author as Author | null;
    },
  });
};
