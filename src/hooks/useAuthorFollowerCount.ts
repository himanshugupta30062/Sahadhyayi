import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';

export const useAuthorFollowerCount = (authorId?: string) => {
  return useQuery({
    queryKey: ['author-follower-count', authorId],
    queryFn: async () => {
      if (!authorId) return 0;
      
      // Use the secure function to get follower count
      const { data, error } = await supabase.rpc('get_author_follower_count', {
        author_uuid: authorId
      });
      
      if (error) {
        console.error('Error fetching follower count:', error);
        return 0;
      }
      
      return data || 0;
    },
    enabled: !!authorId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};