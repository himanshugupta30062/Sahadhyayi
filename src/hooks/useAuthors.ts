
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Author {
  id: string;
  name: string;
  bio: string | null;
  profile_image_url: string | null;
  location: string;
  website_url: string | null;
  social_links: Record<string, any>;
  genres: string[];
  books_count: number;
  followers_count: number;
  rating: number;
  upcoming_events: number;
  created_at: string;
  updated_at: string;
}

export const useAuthors = () => {
  return useQuery({
    queryKey: ['authors'],
    queryFn: async (): Promise<Author[]> => {
      console.log('Fetching authors from database...');
      
      // Use raw SQL query to bypass TypeScript type checking temporarily
      const { data, error } = await supabase.rpc('get_authors_data');

      if (error) {
        console.error('Error fetching authors:', error);
        // If the function doesn't exist, fall back to direct table access
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('authors' as any)
          .select('*')
          .order('books_count', { ascending: false });

        if (fallbackError) {
          console.error('Fallback error:', fallbackError);
          throw fallbackError;
        }

        console.log('Authors fetched successfully (fallback):', fallbackData?.length || 0);
        return fallbackData || [];
      }

      console.log('Authors fetched successfully:', data?.length || 0);
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
