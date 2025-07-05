
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

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
    cover_image_url?: string;
    description?: string;
  };
}

export const useUserBookshelf = () => {
  const { user } = useAuth();
  
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
            cover_image_url,
            description
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

export const useAddToBookshelf = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ bookId, status = 'want_to_read' }: { bookId: string; status?: 'want_to_read' | 'reading' | 'completed' }) => {
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
      queryClient.invalidateQueries({ queryKey: ['user-bookshelf'] });
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
      queryClient.invalidateQueries({ queryKey: ['user-bookshelf'] });
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
      queryClient.invalidateQueries({ queryKey: ['user-bookshelf'] });
      toast({ title: 'Success', description: 'Book removed from shelf!' });
    },
  });
};
