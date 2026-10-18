
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';

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

// Mock fallback data for when API fails
export const useAuthors = () => {
  return useQuery({
    queryKey: ['authors'],
    queryFn: async (): Promise<Author[]> => {
      const { data, error } = await supabase.rpc('get_authors_with_books');

      // Never display fictional fallback authors when the real query fails.
      if (error) throw error;
      if (!data || data.length === 0) return [];

      return data.map((author: any) => ({
        id: author.id,
        name: author.name,
        bio: author.bio || null,
        profile_image_url: author.profile_image_url,
        location: author.location || '',
        website_url: author.website_url,
        social_links: author.social_links || {},
        genres: author.genres || [],
        books_count: Number.parseInt(author.actual_books_count, 10) || 0,
        followers_count: Number(author.followers_count) || 0,
        rating: Number.parseFloat(author.rating) || 0,
        upcoming_events: Number(author.upcoming_events) || 0,
        created_at: author.created_at,
        updated_at: author.updated_at,
        verified: author.verified || false,
        verification_type: author.verification_type,
        availableSlots: [],
      })) as Author[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount) => failureCount < 2,
    retryDelay: 1000,
  });
};

export interface PaginatedAuthors {
  authors: Author[];
  total: number;
}

export const usePaginatedAuthors = (page = 1, pageSize = 10) => {
  return useQuery({
    queryKey: ['paginated-authors', page, pageSize],
    queryFn: async (): Promise<PaginatedAuthors> => {
      const startIndex = (page - 1) * pageSize;
      const endIndex = page * pageSize - 1;

      const { data, error, count } = await supabase
        .rpc('get_authors_with_books', {}, { count: 'exact' })
        .range(startIndex, endIndex)
        .order('name', { ascending: true });

      if (error) throw error;

      const authors = (data || []).map((author: any) => ({
        id: author.id,
        name: author.name,
        bio: author.bio || null,
        profile_image_url: author.profile_image_url,
        location: author.location || '',
        website_url: author.website_url,
        social_links: author.social_links || {},
        genres: author.genres || [],
        books_count: Number.parseInt(author.actual_books_count, 10) || 0,
        followers_count: Number(author.followers_count) || 0,
        rating: Number.parseFloat(author.rating) || 0,
        upcoming_events: Number(author.upcoming_events) || 0,
        created_at: author.created_at,
        updated_at: author.updated_at,
        verified: author.verified || false,
        verification_type: author.verification_type,
        availableSlots: [],
      })) as Author[];

      return { authors, total: count ?? authors.length };
    },
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

