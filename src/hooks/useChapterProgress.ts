import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ChapterProgress {
  id: string;
  book_id: string | null;
  chapter_number: number;
  completion_percentage: number;
  completed_at: string | null;
}

export const useChapterProgress = (bookId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['chapter-progress', user?.id, bookId],
    queryFn: async () => {
      if (!user || !bookId) return [] as ChapterProgress[];

      const { data, error } = await supabase
        .from('detailed_reading_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('book_id', bookId);

      if (error) throw error;
      return (data as ChapterProgress[]) || [];
    },
    enabled: !!user && !!bookId,
  });
};

export const useMarkChapterAsRead = (bookId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chapterNumber: number) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('detailed_reading_progress')
        .upsert({
          user_id: user.id,
          book_id: bookId,
          chapter_number: chapterNumber,
          completion_percentage: 100,
          total_pages: 1,
          pages_read: 1,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data as ChapterProgress;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['chapter-progress', user?.id, bookId],
      });
    },
  });
};
