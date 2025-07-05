
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ReadingProgressItem {
  id: number;
  book_title: string;
  current_page: number;
  total_pages: number;
  cover_image_url?: string;
  user_id?: string;
}

export const useReadingProgress = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['reading-progress', user?.id],
    queryFn: async () => {
      if (!user) {
        console.log('No user found, returning empty array');
        return [];
      }

      console.log('Fetching reading progress for user:', user.id);
      
      const { data, error } = await supabase
        .from('reading_progress')
        .select('*')
        .eq('user_id', user.id)
        .order('id', { ascending: false });

      if (error) {
        console.error('Error fetching reading progress:', error);
        throw error;
      }

      console.log('Reading progress data:', data);
      return data as ReadingProgressItem[];
    },
    enabled: !!user,
  });
};
