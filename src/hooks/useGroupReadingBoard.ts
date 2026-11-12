import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';

export type GroupReadingBookStatus = 'current' | 'up_next' | 'completed' | 'archived';

export interface GroupReadingBook {
  id: string;
  group_id: string;
  book_id: string;
  status: GroupReadingBookStatus;
  target_date: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  title: string;
  author: string | null;
  cover_image_url: string | null;
  pages: number | null;
  my_current_page: number;
  my_is_shared: boolean;
  shared_reader_count: number;
  average_progress: number | null;
}

const groupReadingBooksKey = (groupId: string, userId: string | null) => ['group-reading-books', groupId, userId] as const;

export const useGroupReadingBooks = (groupId: string, enabled = false) => {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  return useQuery({
    queryKey: groupReadingBooksKey(groupId, userId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('list_reading_group_books', {
        p_group_id: groupId,
      });
      if (error) throw new Error(error.message || 'Could not load the group reading list.');
      return (data ?? []) as GroupReadingBook[];
    },
    enabled: Boolean(groupId && userId && enabled),
    staleTime: 30_000,
  });
};

export const useAddGroupReadingBook = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  return useMutation({
    mutationFn: async ({ groupId, bookId, targetDate }: {
      groupId: string;
      bookId: string;
      targetDate?: string | null;
    }) => {
      const { data, error } = await supabase.rpc('add_reading_group_book', {
        p_group_id: groupId,
        p_book_id: bookId,
        p_target_date: targetDate ?? null,
      });
      if (error) throw new Error(error.message || 'Could not add this book to the group.');
      return data as string;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: groupReadingBooksKey(variables.groupId, userId) });
    },
  });
};

export const useSetGroupReadingBookStatus = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  return useMutation({
    mutationFn: async ({ groupId, readingBookId, status }: {
      groupId: string;
      readingBookId: string;
      status: GroupReadingBookStatus;
    }) => {
      const { data, error } = await supabase.rpc('set_reading_group_book_status', {
        p_group_reading_book_id: readingBookId,
        p_status: status,
      });
      if (error) throw new Error(error.message || 'Could not update the shared reading status.');
      return data as string;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: groupReadingBooksKey(variables.groupId, userId) });
    },
  });
};

export const useRemoveGroupReadingBook = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  return useMutation({
    mutationFn: async ({ groupId, readingBookId }: { groupId: string; readingBookId: string }) => {
      const { error } = await supabase.rpc('remove_reading_group_book', {
        p_group_reading_book_id: readingBookId,
      });
      if (error) throw new Error(error.message || 'Could not remove this book from the group.');
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: groupReadingBooksKey(variables.groupId) });
    },
  });
};

export const useSaveGroupReadingProgress = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  return useMutation({
    mutationFn: async ({ groupId, readingBookId, currentPage, isShared }: {
      groupId: string;
      readingBookId: string;
      currentPage: number;
      isShared: boolean;
    }) => {
      if (!Number.isInteger(currentPage) || currentPage < 0) {
        throw new Error('Enter a valid page number.');
      }
      const { data, error } = await supabase.rpc('save_reading_group_progress', {
        p_group_reading_book_id: readingBookId,
        p_current_page: currentPage,
        p_is_shared: isShared,
      });
      if (error) throw new Error(error.message || 'Could not save your reading progress.');
      return data as string;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: groupReadingBooksKey(variables.groupId) });
    },
  });
};
