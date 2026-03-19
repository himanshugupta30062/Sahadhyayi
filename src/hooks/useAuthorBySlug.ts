import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import type { Author } from './useAuthors';
import { mockAuthors } from '@/mockAuthors';
import { slugify } from '@/utils/slugify';

export const useAuthorBySlug = (slug?: string) => {
  return useQuery({
    queryKey: ['author', slug],
    enabled: !!slug,
    queryFn: async () => {
      const findMatchingAuthor = (authors: Array<Record<string, any>>) => {
        if (!slug) return null;

        const normalizedSlug = slug.toLowerCase().trim();
        let author = authors.find((a: any) => {
          const authorSlug = slugify(a.name?.trim() || '');
          return authorSlug === normalizedSlug;
        });

        if (!author) {
          author = authors.find((a: any) => {
            const authorName = a.name?.toLowerCase().trim() || '';
            const nameWords = authorName.split(/\s+/);
            const slugWords = normalizedSlug.split('-');

            return slugWords.every(slugWord =>
              nameWords.some(nameWord => nameWord.includes(slugWord))
            );
          });
        }

        return author as Author | null;
      };

      try {
        const { data, error } = await supabase.rpc('get_authors_data');
        if (error) throw error;

        const matchedAuthor = findMatchingAuthor(data || []);
        if (matchedAuthor) return matchedAuthor;
      } catch {
        // Fall back to local mock author data so author profile links still work offline
      }

      const matchedMockAuthor = findMatchingAuthor(mockAuthors as Array<Record<string, any>>);
      if (matchedMockAuthor) {
        return matchedMockAuthor;
      }

      return null;
    },
  });
};
