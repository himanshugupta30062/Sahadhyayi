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
      
      // More robust matching with fallback strategies
      const normalizedSlug = slug?.toLowerCase().trim();
      let author = (data || []).find((a: any) => {
        const authorSlug = slugify(a.name?.trim() || '');
        return authorSlug === normalizedSlug;
      });
      
      // Fallback: try partial name matching if exact slug match fails
      if (!author && normalizedSlug) {
        author = (data || []).find((a: any) => {
          const authorName = a.name?.toLowerCase().trim() || '';
          const nameWords = authorName.split(/\s+/);
          const slugWords = normalizedSlug.split('-');
          
          // Check if all slug words are found in author name
          return slugWords.every(slugWord => 
            nameWords.some(nameWord => nameWord.includes(slugWord))
          );
        });
      }
      
      return author as Author | null;
    },
  });
};
