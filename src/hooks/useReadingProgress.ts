import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';
import { recordReadingActivity } from '@/lib/readingActivity';

export interface ReadingProgressItem {
  id: number;
  book_id?: string | null;
  book_title: string;
  current_page: number;
  total_pages: number;
  cover_image_url?: string;
  user_id?: string;
}

export const useReadingProgress = (options: { enabled?: boolean } = {}) => {
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
    enabled: !!user && (options.enabled ?? true),
  });
};

export const useUpdateReadingProgress = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, current_page }: { id: number; current_page: number }) => {
      if (!user?.id) throw new Error('Sign in to update reading progress');
      if (!Number.isSafeInteger(id) || id <= 0) {
        throw new Error('Invalid reading progress record');
      }
      if (!Number.isSafeInteger(current_page) || current_page < 1) {
        throw new Error('Page number must be a positive integer');
      }

      // Scope writes to the authenticated owner as well as relying on database RLS.
      const { data, error } = await supabase
        .from('reading_progress')
        .update({ current_page })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      await recordReadingActivity(user.id, 'progress_save');
      return data as ReadingProgressItem;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['reading-progress'] });
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
      const normalizedBookId = bookId.trim();
      if (!normalizedBookId) throw new Error('Book ID is required');
      const normalizedBookTitle = bookTitle.trim();
      if (!normalizedBookTitle) throw new Error('Book title is required');
      if (!Number.isFinite(totalPages) || totalPages < 1) {
        throw new Error('Total pages must be a positive number');
      }
      if (!Number.isFinite(currentPage) || currentPage < 1) {
        throw new Error('Current page must be a positive number');
      }

      const safeTotal = Math.max(1, Math.floor(totalPages));
      const safePage = Math.min(safeTotal, Math.max(1, Math.floor(currentPage)));
      const { data, error } = await supabase
        .from('reading_progress')
        .upsert(
          {
            user_id: user.id,
            book_id: normalizedBookId,
            book_title: normalizedBookTitle,
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
      void queryClient.invalidateQueries({ queryKey: ['reading-progress', user?.id] });
    },
  });
};
