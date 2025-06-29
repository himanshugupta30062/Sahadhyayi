import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Book {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  cover_url: string | null;
  created_at: string;
}

export interface UserBook {
  id: string;
  book_id: string;
  status: string;
  added_at: string;
  books: {
    id: string;
    title: string;
    author: string | null;
    description: string | null;
    cover_url: string | null;
  } | null;
}

export const useBooks = () => {
  return useQuery({
    queryKey: ['books'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Book[];
    },
  });
};

export const useCreateBook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (book: Omit<Book, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('books')
        .insert(book)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast({ title: 'Book Added', description: 'Book has been added successfully!' });
    },
  });
};

export const useUserBooks = () => {
  return useQuery({
    queryKey: ['user-books'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_books')
        .select(`
          *,
          books (
            id,
            title,
            author,
            description,
            cover_url
          )
        `)
        .order('added_at', { ascending: false });

      if (error) throw error;
      return data as UserBook[];
    },
  });
};

export const useAddBookToShelf = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookId, status = 'unread' }: { bookId: string; status?: string }) => {
      const { data, error } = await supabase
        .from('user_books')
        .insert({
          book_id: bookId,
          status,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-books'] });
      toast({ title: 'Book Added', description: 'Book added to your shelf!' });
    },
  });
};

export const useUpdateBookStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from('user_books')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-books'] });
      toast({ title: 'Status Updated', description: 'Book status updated successfully!' });
    },
  });
};