
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
        // Use the new function that only returns authors with books
        const { data, error } = await supabase.rpc('get_authors_with_books');

        if (error) {
          console.error('Failed to fetch authors with books:', error.message || error);
          console.info('Using fallback author data due to API error');
          return fallbackAuthors;
        }

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
      const startIndex = (page - 1) * pageSize;
      const endIndex = page * pageSize - 1;

      try {
        const { data, error, count } = await supabase
          .rpc('get_authors_with_books', {}, { count: 'exact' })
          .range(startIndex, endIndex)
          .order('name', { ascending: true });

        if (error || !data) {
          console.error('Failed to fetch paginated authors:', error?.message || error);
          return {
            authors: fallbackAuthors.slice(startIndex, endIndex + 1),
            total: fallbackAuthors.length,
          };
        }

        const authors = data.map((author: any) => ({
          id: author.id,
          name: author.name,
          bio: author.bio || 'Bio will be updated by the author.',
          profile_image_url: author.profile_image_url,
          location: author.location || 'Unknown',
          website_url: author.website_url,
          social_links: author.social_links || {},
          genres: author.genres || [],
          books_count: parseInt(author.actual_books_count) || 0,
          followers_count: author.followers_count || 0,
          rating: parseFloat(author.rating) || 4.0,
          upcoming_events: author.upcoming_events || 0,
          created_at: author.created_at,
          updated_at: author.updated_at,
          verified: author.verified || false,
          verification_type: author.verification_type,
          availableSlots:
            author.actual_books_count > 0
              ? [`Meet the author of ${author.actual_books_count} book${author.actual_books_count > 1 ? 's' : ''}`]
              : ['Available for consultation'],
        })) as Author[];

        return { authors, total: count ?? authors.length };
      } catch (err) {
        console.error('Exception while fetching paginated authors:', err);
        return {
          authors: fallbackAuthors.slice(startIndex, endIndex + 1),
          total: fallbackAuthors.length,
        };
      }
    },
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
