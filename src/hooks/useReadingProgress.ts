import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';
import {
  getNextRequestSequence,
  isLatestRequestSequence,
  normalizeProgressValues,
  syncReadingProgressToSupabase,
  type ProgressSyncInput,
  type ReadingStatus,
} from '@/services/readingProgressSync';

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

export interface SaveReadingProgressParams {
  bookId: string;
  bookTitle?: string;
  currentPage?: number;
  totalPages?: number;
  percentage?: number;
  status?: ReadingStatus;
  coverImageUrl?: string;
}

export interface UpdateReadingProgressParams {
  id?: number;
  bookId?: string;
  current_page?: number;
  currentPage?: number;
  totalPages?: number;
  percentage?: number;
  status?: ReadingStatus;
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

const notifyProgressChanged = (queryClient: ReturnType<typeof useQueryClient>, userId?: string) => {
  if (userId) {
    void queryClient.invalidateQueries({ queryKey: ['reading-progress', userId] });
    void queryClient.invalidateQueries({ queryKey: ['user-bookshelf', userId] });
    void queryClient.invalidateQueries({ queryKey: ['user-bookshelf-stats', userId] });
    void queryClient.invalidateQueries({ queryKey: ['reading-stats', userId] });
    void queryClient.invalidateQueries({ queryKey: ['reading-activity-days', userId] });
  } else {
    void queryClient.invalidateQueries({ queryKey: ['reading-progress'] });
    void queryClient.invalidateQueries({ queryKey: ['user-bookshelf'] });
  }

  window.dispatchEvent(new Event('shelfUpdated'));
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('sahadhyayi_shelf_sync', Date.now().toString());
    }
  } catch {
    // ignore in restricted environments
  }
};

export const useSaveReadingProgress = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: SaveReadingProgressParams) => {
      // Allow dynamic user resolution if auth changed
      const activeUser = user || (await supabase.auth.getUser()).data.user;
      if (!activeUser?.id) {
        throw new Error('Sign in to save reading progress');
      }

      const normalizedBookId = (params.bookId || '').trim();
      if (!normalizedBookId) {
        throw new Error('Book ID is required');
      }

      const sequence = getNextRequestSequence(normalizedBookId);

      const result = await syncReadingProgressToSupabase(activeUser.id, {
        bookId: normalizedBookId,
        bookTitle: params.bookTitle,
        currentPage: params.currentPage,
        totalPages: params.totalPages,
        percentage: params.percentage,
        status: params.status,
        coverImageUrl: params.coverImageUrl,
      });

      // Ignore older responses if a newer request has already started
      if (!isLatestRequestSequence(normalizedBookId, sequence)) {
        return null;
      }

      return result;
    },
    onMutate: async (params: SaveReadingProgressParams) => {
      const activeUserId = user?.id;
      if (!activeUserId) return undefined;

      const normalizedBookId = (params.bookId || '').trim();
      if (!normalizedBookId) return undefined;

      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['reading-progress', activeUserId] }),
        queryClient.cancelQueries({ queryKey: ['user-bookshelf', activeUserId] }),
      ]);

      const previousProgress = queryClient.getQueryData<ReadingProgressItem[]>(['reading-progress', activeUserId]);
      const previousShelf = queryClient.getQueryData<any[]>(['user-bookshelf', activeUserId]);

      const existingProgress = previousProgress?.find(p => p.book_id === normalizedBookId);
      const existingShelf = previousShelf?.find(s => s.book_id === normalizedBookId);

      try {
        const preview = normalizeProgressValues(
          {
            bookId: normalizedBookId,
            bookTitle: params.bookTitle,
            currentPage: params.currentPage,
            totalPages: params.totalPages,
            percentage: params.percentage,
            status: params.status,
            coverImageUrl: params.coverImageUrl,
          },
          {
            current_page: existingProgress?.current_page,
            total_pages: existingProgress?.total_pages,
            status: existingShelf?.status,
            cover_image_url: existingProgress?.cover_image_url,
            book_title: existingProgress?.book_title,
          },
        );

        // Optimistically update reading_progress cache
        queryClient.setQueryData<ReadingProgressItem[]>(['reading-progress', activeUserId], (items = []) => {
          const index = items.findIndex(p => p.book_id === normalizedBookId);
          const updatedItem: ReadingProgressItem = {
            id: existingProgress?.id || Date.now(),
            book_id: normalizedBookId,
            book_title: preview.bookTitle,
            current_page: preview.currentPage,
            total_pages: preview.totalPages,
            cover_image_url: preview.coverImageUrl || undefined,
            user_id: activeUserId,
            started_at: preview.startedAt,
            completed_at: preview.completedAt,
          };

          if (index >= 0) {
            const next = [...items];
            next[index] = updatedItem;
            return next;
          }
          return [updatedItem, ...items];
        });

        // Optimistically update user_bookshelf cache
        queryClient.setQueryData<any[]>(['user-bookshelf', activeUserId], (items = []) => {
          return items.map(item => {
            if (item.book_id !== normalizedBookId || item.status === 'dnf') return item;
            return {
              ...item,
              progress: preview.percentage,
              status: preview.status,
              completed_at: preview.completedAt,
              started_at: preview.startedAt,
            };
          });
        });
      } catch {
        // If normalization fails, proceed with mutation to handle rejection
      }

      return { previousProgress, previousShelf, bookId: normalizedBookId };
    },
    onError: (_error, _variables, context) => {
      const activeUserId = user?.id;
      if (!activeUserId || !context) return;
      if (context.previousProgress) {
        queryClient.setQueryData(['reading-progress', activeUserId], context.previousProgress);
      }
      if (context.previousShelf) {
        queryClient.setQueryData(['user-bookshelf', activeUserId], context.previousShelf);
      }
    },
    onSettled: () => {
      notifyProgressChanged(queryClient, user?.id);
    },
  });
};

export const useUpdateReadingProgress = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const saveProgress = useSaveReadingProgress();

  return useMutation({
    mutationFn: async (params: UpdateReadingProgressParams) => {
      const activeUser = user || (await supabase.auth.getUser()).data.user;
      if (!activeUser?.id) {
        throw new Error('Sign in to update reading progress');
      }

      // If bookId is directly supplied
      if (params.bookId) {
        const page = params.currentPage !== undefined ? params.currentPage : params.current_page;
        return saveProgress.mutateAsync({
          bookId: params.bookId,
          currentPage: page,
          totalPages: params.totalPages,
          percentage: params.percentage,
          status: params.status,
        });
      }

      // If id is supplied (record ID in reading_progress)
      if (params.id) {
        if (!Number.isSafeInteger(params.id) || params.id <= 0) {
          throw new Error('Invalid reading progress record');
        }

        const page = params.currentPage !== undefined ? params.currentPage : params.current_page;
        if (page === undefined || !Number.isFinite(page) || page < 1) {
          throw new Error('Page number must be a positive integer');
        }

        const cachedProgress = queryClient.getQueryData<ReadingProgressItem[]>(['reading-progress', activeUser.id]);
        const record = cachedProgress?.find(p => p.id === params.id);

        if (record?.book_id) {
          return saveProgress.mutateAsync({
            bookId: record.book_id,
            bookTitle: record.book_title,
            currentPage: Math.round(page),
            totalPages: record.total_pages,
            coverImageUrl: record.cover_image_url,
          });
        }

        // Direct database lookup if not in cache
        const { data: dbRecord, error: lookupError } = await supabase
          .from('reading_progress')
          .select('*')
          .eq('id', params.id)
          .eq('user_id', activeUser.id)
          .single();

        if (lookupError || !dbRecord) {
          throw lookupError || new Error('Reading progress record not found');
        }

        return saveProgress.mutateAsync({
          bookId: dbRecord.book_id || `book-${dbRecord.id}`,
          bookTitle: dbRecord.book_title,
          currentPage: Math.round(page),
          totalPages: dbRecord.total_pages,
          coverImageUrl: dbRecord.cover_image_url,
        });
      }

      throw new Error('Either bookId or progress id is required');
    },
    onSettled: () => {
      notifyProgressChanged(queryClient, user?.id);
    },
  });
};
