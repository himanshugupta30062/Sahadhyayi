import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';
import { toast } from '@/components/ui/use-toast';
import { uniqueChannelName } from '@/lib/realtime';

export type DnfReason = 
  | 'pacing_too_slow' 
  | 'writing_style' 
  | 'not_what_expected' 
  | 'content_trigger' 
  | 'lost_interest' 
  | 'other';

export const DNF_REASON_LABELS: Record<DnfReason, string> = {
  pacing_too_slow: 'Pacing too slow',
  writing_style: 'Writing style / prose',
  not_what_expected: 'Not what I expected',
  content_trigger: 'Content / Trigger warnings',
  lost_interest: 'Lost interest',
  other: 'Other / No specific reason',
};

export interface BookshelfItem {
  id: string;
  user_id: string;
  book_id: string;
  status: 'want_to_read' | 'reading' | 'completed' | 'dnf';
  added_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  notes?: string;
  rating?: number;
  progress?: number;
  book?: {
    id?: string;
    title: string;
    author?: string;
  };
  is_favorite?: boolean;
  is_owned?: boolean;
  dnf_page?: number | null;
  dnf_date?: string | null;
  dnf_reason?: DnfReason | null;
  dnf_notes?: string | null;
  up_next_position?: number | null;
  books_library?: {
    id: string;
    title: string;
    author?: string;
    genre?: string;
    cover_image_url?: string;
    description?: string;
    publication_year?: number;
    language?: string;
    pdf_url?: string;
    pages?: number;
  };
}

export const useUserBookshelf = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    // Realtime channel for instant cross-device updates
    const channel = supabase
      .channel(uniqueChannelName(`user-bookshelf-realtime-${user.id}`))
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_bookshelf',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['user-bookshelf', user.id] });
        }
      )
      .subscribe();

    // Multi-tab sync via storage events
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'sahadhyayi_shelf_sync') {
        void queryClient.invalidateQueries({ queryKey: ['user-bookshelf', user.id] });
      }
    };
    window.addEventListener('storage', handleStorage);

    const handleShelfUpdated = () => {
      void queryClient.invalidateQueries({ queryKey: ['user-bookshelf', user.id] });
    };
    window.addEventListener('shelfUpdated', handleShelfUpdated);

    return () => {
      void supabase.removeChannel(channel).catch((error: unknown) => {
        console.error('Failed to remove user bookshelf realtime channel:', error);
      });
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('shelfUpdated', handleShelfUpdated);
    };
  }, [user?.id, queryClient]);
  
  return useQuery({
    queryKey: ['user-bookshelf', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_bookshelf')
        .select(`
          *,
          books_library:book_id (
            id,
            title,
            author,
            genre,
            cover_image_url,
            description,
            publication_year,
            language,
            pdf_url,
            pages
          )
        `)
        .eq('user_id', user.id)
        .order('added_at', { ascending: false });

      if (error) throw error;
      return data as BookshelfItem[];
    },
    enabled: !!user,
  });
};

const notifyShelfChanged = (queryClient: ReturnType<typeof useQueryClient>) => {
  void queryClient.invalidateQueries({ queryKey: ['user-bookshelf'] });
  // The database trigger updates challenge progress and awards badges on shelf changes.
  void queryClient.invalidateQueries({ queryKey: ['user-challenges'] });
  void queryClient.invalidateQueries({ queryKey: ['user-badges'] });
  window.dispatchEvent(new Event('shelfUpdated'));
  try {
    localStorage.setItem('sahadhyayi_shelf_sync', Date.now().toString());
  } catch {
    // ignore in private browsing/restricted environments
  }
};

export const useAddToBookshelf = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ bookId, status = 'reading' }: { bookId: string; status?: 'want_to_read' | 'reading' | 'completed' | 'dnf' }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_bookshelf')
        .insert({
          user_id: user.id,
          book_id: bookId,
          status,
          started_at: status === 'reading' ? new Date().toISOString() : null,
          completed_at: status === 'completed' ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      notifyShelfChanged(queryClient);
      toast({ title: 'Success', description: 'Book added to your shelf!' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to add book to shelf',
        variant: 'destructive' 
      });
    },
  });
};

export const useUpdateBookshelfItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<BookshelfItem> }) => {
      const payload: Partial<BookshelfItem> = { ...updates };
      if (updates.status === 'reading' && !updates.started_at) {
        payload.started_at = new Date().toISOString();
        payload.up_next_position = null;
      } else if (updates.status === 'completed') {
        payload.completed_at = new Date().toISOString();
        payload.up_next_position = null;
      } else if (updates.status === 'dnf') {
        payload.up_next_position = null;
      }

      const { data, error } = await supabase
        .from('user_bookshelf')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      notifyShelfChanged(queryClient);
      toast({ title: 'Success', description: 'Book updated!' });
    },
  });
};

export const useMarkAsDnf = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      dnf_page,
      dnf_date,
      dnf_reason,
      dnf_notes,
    }: {
      id: string;
      dnf_page?: number;
      dnf_date?: string;
      dnf_reason?: DnfReason;
      dnf_notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('user_bookshelf')
        .update({
          status: 'dnf',
          dnf_page: dnf_page ?? null,
          dnf_date: dnf_date || new Date().toISOString(),
          dnf_reason: dnf_reason ?? null,
          dnf_notes: dnf_notes ?? null,
          up_next_position: null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      notifyShelfChanged(queryClient);
      toast({ title: 'Moved to DNF', description: 'Book marked as Did Not Finish with your reflections.' });
    },
    onError: (err: any) => {
      toast({
        title: 'Error',
        description: err.message || 'Failed to mark book as DNF',
        variant: 'destructive',
      });
    },
  });
};

export const useResumeFromDnf = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, resetProgress }: { id: string; resetProgress?: boolean }) => {
      const { data, error } = await supabase
        .from('user_bookshelf')
        .update({
          status: 'reading',
          started_at: new Date().toISOString(),
          up_next_position: null,
          ...(resetProgress ? { dnf_page: null } : {}),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      notifyShelfChanged(queryClient);
      toast({ title: 'Resumed Reading', description: 'Book moved back to currently reading.' });
    },
    onError: (err: any) => {
      toast({
        title: 'Error',
        description: err.message || 'Failed to resume reading',
        variant: 'destructive',
      });
    },
  });
};

export const useRemoveFromBookshelf = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_bookshelf')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      notifyShelfChanged(queryClient);
      toast({ title: 'Success', description: 'Book removed from shelf!' });
    },
  });
};

export const useUpNextQueue = () => {
  const queryClient = useQueryClient();

  const addToUpNext = useMutation({
    mutationFn: async ({ bookshelfItemId, currentQueueLength }: { bookshelfItemId: string; currentQueueLength: number }) => {
      if (currentQueueLength >= 5) {
        throw new Error('Your Up Next queue is full (max 5 books). Remove or complete one to add another.');
      }
      const newPosition = currentQueueLength + 1;
      const { data, error } = await supabase
        .from('user_bookshelf')
        .update({
          status: 'want_to_read',
          up_next_position: newPosition,
        })
        .eq('id', bookshelfItemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      notifyShelfChanged(queryClient);
      toast({ title: 'Added to Up Next', description: 'Book added to your personal reading queue!' });
    },
    onError: (err: any) => {
      toast({ title: 'Queue Limit Reached', description: err.message, variant: 'destructive' });
    },
  });

  const removeFromUpNext = useMutation({
    mutationFn: async ({ bookshelfItemId, currentQueue }: { bookshelfItemId: string; currentQueue: BookshelfItem[] }) => {
      const targetItem = currentQueue.find(b => b.id === bookshelfItemId);
      const targetPos = targetItem?.up_next_position || 1;

      // 1. Remove position from target
      const { error: removeError } = await supabase
        .from('user_bookshelf')
        .update({ up_next_position: null })
        .eq('id', bookshelfItemId);

      if (removeError) throw removeError;

      // 2. Compact remaining higher positions
      const remainingToCompact = currentQueue
        .filter(b => b.id !== bookshelfItemId && b.up_next_position && b.up_next_position > targetPos)
        .sort((a, b) => (a.up_next_position || 0) - (b.up_next_position || 0));

      for (const item of remainingToCompact) {
        if (item.up_next_position) {
          await supabase
            .from('user_bookshelf')
            .update({ up_next_position: item.up_next_position - 1 })
            .eq('id', item.id);
        }
      }
    },
    onSuccess: () => {
      notifyShelfChanged(queryClient);
      toast({ title: 'Removed from Up Next', description: 'Book returned to Want to Read.' });
    },
  });

  const reorderUpNext = useMutation({
    mutationFn: async ({ itemId, direction, currentQueue }: { itemId: string; direction: 'up' | 'down'; currentQueue: BookshelfItem[] }) => {
      const sorted = [...currentQueue]
        .filter(i => i.up_next_position != null)
        .sort((a, b) => (a.up_next_position || 0) - (b.up_next_position || 0));

      const idx = sorted.findIndex(i => i.id === itemId);
      if (idx === -1) return;
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= sorted.length) return;

      const itemA = sorted[idx];
      const itemB = sorted[swapIdx];

      // Temporary null to avoid unique constraint collision during swap
      await supabase
        .from('user_bookshelf')
        .update({ up_next_position: null })
        .eq('id', itemA.id);

      await supabase
        .from('user_bookshelf')
        .update({ up_next_position: itemA.up_next_position })
        .eq('id', itemB.id);

      await supabase
        .from('user_bookshelf')
        .update({ up_next_position: itemB.up_next_position })
        .eq('id', itemA.id);
    },
    onSuccess: () => {
      notifyShelfChanged(queryClient);
    },
  });

  const startReadingFromQueue = useMutation({
    mutationFn: async ({ bookshelfItemId, currentQueue }: { bookshelfItemId: string; currentQueue: BookshelfItem[] }) => {
      const targetItem = currentQueue.find(b => b.id === bookshelfItemId);
      const targetPos = targetItem?.up_next_position || 1;

      // 1. Mark as reading and clear queue position
      const { data, error } = await supabase
        .from('user_bookshelf')
        .update({
          status: 'reading',
          started_at: new Date().toISOString(),
          up_next_position: null,
        })
        .eq('id', bookshelfItemId)
        .select()
        .single();

      if (error) throw error;

      // 2. Compact remaining higher positions
      const remainingToCompact = currentQueue
        .filter(b => b.id !== bookshelfItemId && b.up_next_position && b.up_next_position > targetPos)
        .sort((a, b) => (a.up_next_position || 0) - (b.up_next_position || 0));

      for (const item of remainingToCompact) {
        if (item.up_next_position) {
          await supabase
            .from('user_bookshelf')
            .update({ up_next_position: item.up_next_position - 1 })
            .eq('id', item.id);
        }
      }

      return data;
    },
    onSuccess: () => {
      notifyShelfChanged(queryClient);
      toast({ title: 'Happy Reading!', description: 'Book started and moved to Currently Reading.' });
    },
  });

  return {
    addToUpNext,
    removeFromUpNext,
    reorderUpNext,
    startReadingFromQueue,
  };
};
