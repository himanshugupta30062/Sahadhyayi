
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';

export interface ReadingProgressItem {
  id: number;
  book_id?: string | null;
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
        return [];
      }
      
      const { data, error } = await supabase
        .from('reading_progress')
        .select('*')
        .eq('user_id', user.id)
        .order('id', { ascending: false });

      if (error) {
        throw error;
      }
      return data as ReadingProgressItem[];
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

export const useSaveReadingProgress = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookId,
      bookTitle,
      currentPage,
      totalPages,
      coverImageUrl,
    }: {
      bookId: string;
      bookTitle: string;
      currentPage: number;
      totalPages: number;
      coverImageUrl?: string;
    }) => {
      if (!user?.id) throw new Error('Sign in to save reading progress');

      const safeTotal = Math.max(1, totalPages);
      const safePage = Math.min(safeTotal, Math.max(1, currentPage));
      const { data, error } = await supabase
        .from('reading_progress')
        .upsert(
          {
            user_id: user.id,
            book_id: bookId,
            book_title: bookTitle,
            current_page: safePage,
            total_pages: safeTotal,
            cover_image_url: coverImageUrl ?? null,
          },
          { onConflict: 'user_id,book_id' },
        )
        .select()
        .single();

      if (error) throw error;
      return data as ReadingProgressItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reading-progress', user?.id] });
    },
  });
};
