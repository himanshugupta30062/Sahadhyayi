
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { toast } from '@/hooks/use-toast';

interface LibraryBook {
  id: string;
  title: string;
  author: string | null;
  genre: string | null;
  cover_image_url: string | null;
  created_at: string;
}

export const useLibraryBooks = () => {
  return useQuery({
    queryKey: ['library-books'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('books_library')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as LibraryBook[];
    },
  });
};

export const useAddLibraryBook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (book: Omit<LibraryBook, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('books_library')
        .insert(book)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-books'] });
      toast({ title: 'Book Added', description: 'Book has been added to the library!' });
    },
  });
};
