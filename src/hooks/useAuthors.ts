
import { useQuery } from "@tanstack/react-query";

export interface Author {
  id: string;
  name: string;
  bio: string | null;
  profile_image_url: string | null;
  location: string;
  website_url: string | null;
  social_links: any;
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
}


export const useAuthors = () => {
  return useQuery({
    queryKey: ['authors'],
    queryFn: async (): Promise<Author[]> => {
      try {
        const res = await fetch('/api/authors?page=1&pageSize=1000', {
          credentials: 'include',
        });
        if (!res.ok) {
          const err: any = new Error('Failed to fetch authors');
          err.status = res.status;
          throw err;
        }
        const json = await res.json();
        return (json.authors || []) as Author[];
      } catch (err) {
        console.error('Exception while fetching authors:', err);
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      console.error(`Author fetch attempt ${failureCount + 1} failed:`, error);
      return failureCount < 2;
    },
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
      try {
        const res = await fetch(`/api/authors?page=${page}&pageSize=${pageSize}`, {
          credentials: 'include',
        });
        if (!res.ok) {
          const err: any = new Error('Failed to fetch authors');
          err.status = res.status;
          throw err;
        }
        const json = await res.json();
        return json as PaginatedAuthors;
      } catch (err) {
        console.error('Exception while fetching paginated authors:', err);
        throw err;
      }
    },
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
