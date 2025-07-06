
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

export interface PersonalLibraryItem {
  id: string;
  user_id: string;
  book_id: string;
  added_at: string;
  books_library: {
    id: string;
    title: string;
    author: string;
    genre?: string;
    cover_image_url?: string;
    description?: string;
    publication_year?: number;
    language?: string;
    pdf_url?: string;
  };
}

export const usePersonalLibrary = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['personal-library', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_personal_library')
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
      return data as PersonalLibraryItem[];
    },
    enabled: !!user,
  });
};

export const useAddToPersonalLibrary = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (bookId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_personal_library')
        .insert({
          user_id: user.id,
          book_id: bookId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-library'] });
      toast({ title: 'Success', description: 'Book added to your personal library!' });
    },
    onError: (error: any) => {
      if (error.message?.includes('duplicate')) {
        toast({ 
          title: 'Already Added', 
          description: 'This book is already in your library',
          variant: 'default'
        });
      } else {
        toast({ 
          title: 'Error', 
          description: error.message || 'Failed to add book to library',
          variant: 'destructive' 
        });
      }
    },
  });
};

export const useRemoveFromPersonalLibrary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookId: string) => {
      const { error } = await supabase
        .from('user_personal_library')
        .delete()
        .eq('book_id', bookId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-library'] });
      toast({ title: 'Success', description: 'Book removed from your library!' });
    },
  });
};

export const useCleanupUnusedBooks = () => {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('cleanup_unused_books');
      if (error) throw error;
      return data;
    },
    onSuccess: (deletedCount) => {
      toast({ 
        title: 'Cleanup Complete', 
        description: `${deletedCount} unused book versions were removed` 
      });
    },
  });
};
