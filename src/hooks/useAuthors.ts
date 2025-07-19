
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
      console.log('Fetching authors from database...');

      try {
        const { data, error } = await supabase.rpc('get_authors_data');

        if (error) {
          console.error('Failed to fetch authors:', error.message || error);
          console.info('Using fallback author data due to API error');
          return fallbackAuthors;
        }

        if (!data || data.length === 0) {
          console.warn('No authors returned from database, using fallback data');
          return fallbackAuthors;
        }

        console.log('Authors fetched successfully:', data.length);
        // Add availableSlots to each author from the database
        return data.map(author => ({
          ...author,
          availableSlots: [] // Default empty array for available slots
        })) as Author[];
      } catch (err) {
        console.error('Exception while fetching authors:', err);
        console.info('Using fallback author data due to exception');
        return fallbackAuthors;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    // Show loading for maximum 2 seconds
    retry: (failureCount, error) => {
      console.error(`Author fetch attempt ${failureCount + 1} failed:`, error);
      return failureCount < 2;
    },
    retryDelay: 1000,
  });
};
