import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { mapAuthorRecord } from '@/utils/authorMappers';

export interface SocialLinks {
  [key: string]: string;
}

export interface Author {
  id: string;
  name: string;
  bio: string | null;
  profile_image_url: string | null;
  location: string;
  website_url: string | null;
  social_links: SocialLinks;
  genres: string[];
  books_count: number;
  followers_count: number;
  rating: number;
  upcoming_events: number;
  created_at: string;
  updated_at: string;
  availableSlots: string[];
  verified?: boolean;
  verification_type?: string;
  is_authentic?: boolean;
}

export const useAuthors = () =>
  useQuery({
    queryKey: ['authors'],
    queryFn: async (): Promise<Author[]> => {
      const { data, error } = await supabase.rpc('get_authors_with_books');
      // Never display fictional fallback authors when the real query fails.
      if (error) throw error;
      return (data || []).map((author) => mapAuthorRecord(author as Parameters<typeof mapAuthorRecord>[0]));
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount) => failureCount < 2,
    retryDelay: 1000,
  });

export interface PaginatedAuthors {
  authors: Author[];
  total: number;
}

export const usePaginatedAuthors = (page = 1, pageSize = 10) =>
  useQuery({
    queryKey: ['paginated-authors', page, pageSize],
    queryFn: async (): Promise<PaginatedAuthors> => {
      const startIndex = (page - 1) * pageSize;
      const endIndex = page * pageSize - 1;
      const { data, error, count } = await supabase
        .rpc('get_authors_with_books', {}, { count: 'exact' })
        .range(startIndex, endIndex)
        .order('name', { ascending: true });
      if (error) throw error;

      const authors = (data || []).map((author) =>
        mapAuthorRecord(author as Parameters<typeof mapAuthorRecord>[0]),
      );
      return { authors, total: count ?? authors.length };
    },
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
