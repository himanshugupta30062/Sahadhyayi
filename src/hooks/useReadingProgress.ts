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
  started_at?: string | null;
  completed_at?: string | null;
}


// Keep the legacy bookshelf percentage in sync with the canonical page progress.
// DNF is intentionally preserved; completion is driven by reaching the final page.
async function syncBookshelfProgress(userId: string, bookId: string, currentPage: number, totalPages: number) {
  const progress = Math.round((currentPage / totalPages) * 100);
  const { data: shelf, error: lookupError } = await supabase
    .from('user_bookshelf')
    .select('id,status')
    .eq('user_id', userId)
    .eq('book_id', bookId)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (!shelf) return;

  const status = shelf.status === 'dnf'
    ? 'dnf'
    : currentPage >= totalPages
      ? 'completed'
      : shelf.status === 'want_to_read' || shelf.status === 'completed'
        ? 'reading'
        : shelf.status;
  const updates: Record<string, unknown> = { progress, status };
  if (status === 'reading') updates.started_at = new Date().toISOString();
  if (status === 'completed') updates.completed_at = new Date().toISOString();
  const { error } = await supabase
    .from('user_bookshelf')
    .update(updates)
    .eq('id', shelf.id)
    .eq('user_id', userId);
  if (error) throw error;
}

const progressRequestSequence = new Map<number, number>();

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
      const requestSequence = (progressRequestSequence.get(id) ?? 0) + 1;
      progressRequestSequence.set(id, requestSequence);
      const isLatestRequest = () => progressRequestSequence.get(id) === requestSequence;
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
        .update({ current_page, completed_at: null })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      // Ignore an older response when a newer save for this record has already started.
      if (!isLatestRequest()) return data as ReadingProgressItem;
      const saved = data as ReadingProgressItem;
      if (saved.book_id && saved.total_pages > 0) await syncBookshelfProgress(user.id, saved.book_id, saved.current_page, saved.total_pages);
      if (isLatestRequest()) await recordReadingActivity(user.id, 'progress_save');
      return saved;
    },
    onMutate: async ({ id, current_page }) => {
      if (!user?.id) return undefined;
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['reading-progress', user.id] }),
        queryClient.cancelQueries({ queryKey: ['user-bookshelf', user.id] }),
      ]);
      const previousProgress = queryClient.getQueryData<ReadingProgressItem[]>(['reading-progress', user.id]);
      const previousShelf = queryClient.getQueryData<any[]>(['user-bookshelf', user.id]);
      queryClient.setQueryData<ReadingProgressItem[]>(['reading-progress', user.id], (items = []) =>
        items.map((item) => item.id === id ? { ...item, current_page, completed_at: null } : item));
      const record = previousProgress?.find((item) => item.id === id);
      if (record?.book_id && record.total_pages > 0) {
        const percentage = Math.round(Math.min(record.total_pages, current_page) / record.total_pages * 100);
        queryClient.setQueryData<any[]>(['user-bookshelf', user.id], (items = []) => items.map((item) =>
          item.book_id !== record.book_id || item.status === 'dnf' ? item : {
            ...item, progress: percentage,
            status: current_page >= record.total_pages ? 'completed' : item.status === 'want_to_read' || item.status === 'completed' ? 'reading' : item.status,
          }));
      }
      return { previousProgress, previousShelf };
    },
    onError: (_error, _variables, context) => {
      if (!user?.id || !context) return;
      queryClient.setQueryData(['reading-progress', user.id], context.previousProgress);
      queryClient.setQueryData(['user-bookshelf', user.id], context.previousShelf);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['reading-progress', user?.id] });
      void queryClient.invalidateQueries({ queryKey: ['user-bookshelf', user?.id] });
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

      // Preserve the original start/completion timestamps when saving the same book again.
      const { data: existingProgress, error: lookupError } = await supabase
        .from('reading_progress')
        .select('started_at, completed_at')
        .eq('user_id', user.id)
        .eq('book_id', normalizedBookId)
        .maybeSingle();
      if (lookupError) throw lookupError;
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
            started_at: existingProgress?.started_at ?? new Date().toISOString(),
            completed_at: safePage >= safeTotal
              ? existingProgress?.completed_at ?? new Date().toISOString()
              : null,
          },
          { onConflict: 'user_id,book_id' },
        )
        .select()
        .single();

      if (error) throw error;
      const saved = data as ReadingProgressItem;
      await syncBookshelfProgress(user.id, normalizedBookId, safePage, safeTotal);
      await recordReadingActivity(user.id, 'progress_save');
      return saved;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['reading-progress', user?.id] });
      void queryClient.invalidateQueries({ queryKey: ['user-bookshelf', user?.id] });
    },
  });
};
