import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Author } from './useAuthors';

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

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
