import { useQuery } from '@tanstack/react-query';
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
      const res = await fetch(`/api/authors?slug=${slug}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const err: any = new Error('Failed to fetch author');
        err.status = res.status;
        throw err;
      }
      const author = (await res.json()) as Author | null;
      return author;
    },
  });
};
