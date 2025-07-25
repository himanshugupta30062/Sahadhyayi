
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mockAuthors } from "@/mockAuthors";

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

// Mock fallback data for when API fails
const fallbackAuthors: Author[] = [
  {
    id: '1',
    name: 'Jane Smith',
    bio: 'Award-winning fiction writer with over 10 published novels.',
    profile_image_url: null,
    location: 'New York, USA',
    website_url: 'https://janesmith.com',
    social_links: {},
    genres: ['Fiction', 'Romance', 'Drama'],
    books_count: 12,
    followers_count: 2500,
    rating: 4.5,
    upcoming_events: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availableSlots: ['Monday 10:00 AM', 'Wednesday 2:00 PM']
  },
  {
    id: '2',
    name: 'Michael Johnson',
    bio: 'Science fiction author and technology enthusiast.',
    profile_image_url: null,
    location: 'San Francisco, USA',
    website_url: 'https://mjohnson.com',
    social_links: {},
    genres: ['Science Fiction', 'Technology', 'Thriller'],
    books_count: 8,
    followers_count: 1800,
    rating: 4.2,
    upcoming_events: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availableSlots: ['Tuesday 3:00 PM', 'Friday 11:00 AM']
  }
];

export const useAuthors = () => {
  return useQuery({
    queryKey: ['authors'],
    queryFn: async (): Promise<Author[]> => {
      console.log('Fetching authors with books from database...');

      try {
        const res = await fetch('/api/authors?page=1&pageSize=100', {
          credentials: 'include',
        });

        if (!res.ok) {
          const err: any = new Error('Failed to fetch authors');
          err.status = res.status;
          throw err;
        }

        const result = await res.json();
        const data = result.authors as any[];

        if (!data || data.length === 0) {
          console.warn('No authors with books found, using fallback data');
          return fallbackAuthors;
        }

        console.log('Authors with books fetched successfully:', data.length);
        return data.map((author: any) => ({
          id: author.id,
          name: author.name,
          bio: author.bio || 'Bio will be updated by the author.',
          profile_image_url: author.profile_image_url,
          location: author.location || 'Unknown',
          website_url: author.website_url,
          social_links: author.social_links || {},
          genres: author.genres || [],
          books_count: parseInt(author.actual_books_count) || 0, // Use actual count from database
          followers_count: author.followers_count || 0,
          rating: parseFloat(author.rating) || 4.0,
          upcoming_events: author.upcoming_events || 0,
          created_at: author.created_at,
          updated_at: author.updated_at,
          verified: author.verified || false,
          verification_type: author.verification_type,
          availableSlots: author.actual_books_count > 0 ? 
            [`Meet the author of ${author.actual_books_count} book${author.actual_books_count > 1 ? 's' : ''}`] : 
            ['Available for consultation']
        })) as Author[];
      } catch (err) {
        console.error('Exception while fetching authors:', err);
        console.info('Using fallback author data due to exception');
        return fallbackAuthors;
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

        const result = await res.json();
        const authors = (result.authors || []).map((author: any) => ({
          id: author.id,
          name: author.name,
          bio: author.bio || 'Bio will be updated by the author.',
          profile_image_url: author.profile_image_url,
          location: author.location || 'Unknown',
          website_url: author.website_url,
          social_links: author.social_links || {},
          genres: author.genres || [],
          books_count: parseInt(author.books_count) || 0,
          followers_count: author.followers_count || 0,
          rating: parseFloat(author.rating) || 4.0,
          upcoming_events: author.upcoming_events || 0,
          created_at: author.created_at,
          updated_at: author.updated_at,
          verified: author.verified || false,
          verification_type: author.verification_type,
          availableSlots:
            author.books_count > 0
              ? [`Meet the author of ${author.books_count} book${author.books_count > 1 ? 's' : ''}`]
              : ['Available for consultation'],
        })) as Author[];

        return { authors, total: result.total ?? authors.length };
      } catch (err) {
        console.error('Exception while fetching paginated authors:', err);
        return {
          authors: fallbackAuthors.slice(0, pageSize),
          total: fallbackAuthors.length,
        };
      }
    },
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
