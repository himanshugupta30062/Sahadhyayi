
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
  availableSlots?: string[]; // Add this optional property
}

export const useAuthors = () => {
  return useQuery({
    queryKey: ['authors'],
    queryFn: async (): Promise<Author[]> => {
      console.log('Fetching authors from database...');

      const { data, error } = await supabase.rpc('get_authors_data');

      if (error) {
        console.error('Error fetching authors:', error);
        console.info('Falling back to mock author data');
        return mockAuthors as Author[];
      }

      if (!data || data.length === 0) {
        console.warn('No authors returned from database, using mock data');
        return mockAuthors as Author[];
      }

      console.log('Authors fetched successfully:', data.length);
      // Add availableSlots to each author from the database
      return data.map(author => ({
        ...author,
        availableSlots: [] // Default empty array for available slots
      })) as Author[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
