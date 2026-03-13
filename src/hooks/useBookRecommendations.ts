import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';

export interface RecommendedBook {
  id: string;
  title: string;
  author?: string;
  genre?: string;
  cover_image_url?: string;
  description?: string;
}

export const useBookRecommendations = (userId?: string) => {
  return useQuery({
    queryKey: ['book-recommendations', userId],
    queryFn: async (): Promise<RecommendedBook[]> => {
      if (!userId) return [];
      const { data, error } = await supabase.functions.invoke('recommendations', {
        method: 'POST',
      });
      if (error) throw new Error('Failed to fetch recommendations');
      return data?.recommendations || [];
    },
    enabled: !!userId,
  });
};
