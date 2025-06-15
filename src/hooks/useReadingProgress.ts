
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ReadingProgress {
  id: number;
  book_title: string;
  current_page: number;
  total_pages: number;
  cover_image_url: string | null;
  user_id: string;
}

export const useReadingProgress = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['reading-progress', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('reading_progress')
        .select('*')
        .eq('user_id', user.id)
        .order('id', { ascending: false });

      if (error) throw error;
      return data as ReadingProgress[];
    },
    enabled: !!user,
  });
};

export const useUpdateReadingProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, current_page }: { id: number; current_page: number }) => {
      const { data, error } = await supabase
        .from('reading_progress')
        .update({ current_page })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reading-progress'] });
    },
  });
};
