
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';
import { toast } from '@/components/ui/use-toast';
import { uniqueChannelName } from '@/lib/realtime';

export interface BookshelfItem {
  id: string;
  user_id: string;
  book_id: string;
  status: 'want_to_read' | 'reading' | 'completed';
  added_at: string;
  notes?: string;
  rating?: number;
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
          queryClient.invalidateQueries({ queryKey: ['user-bookshelf', user.id] });
        }
      )
      .subscribe();

    // Multi-tab sync via storage events
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'sahadhyayi_shelf_sync') {
        queryClient.invalidateQueries({ queryKey: ['user-bookshelf', user.id] });
      }
    };
    window.addEventListener('storage', handleStorage);

    const handleShelfUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ['user-bookshelf', user.id] });
    };
    window.addEventListener('shelfUpdated', handleShelfUpdated);

    return () => {
      void supabase.removeChannel(channel);
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
            pdf_url
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
  queryClient.invalidateQueries({ queryKey: ['user-bookshelf'] });
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
    mutationFn: async ({ bookId, status = 'reading' }: { bookId: string; status?: 'want_to_read' | 'reading' | 'completed' }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_bookshelf')
        .insert({
          user_id: user.id,
          book_id: bookId,
          status,
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
      const { data, error } = await supabase
        .from('user_bookshelf')
        .update(updates)
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
