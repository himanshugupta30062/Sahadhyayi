import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface PublishedBook {
  id: string;
  user_id: string;
  title: string;
  author_name: string;
  description: string | null;
  genre: string | null;
  language: string | null;
  pages: number | null;
  isbn: string | null;
  cover_image_url: string | null;
  pdf_url: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublishBookInput {
  title: string;
  author_name: string;
  description?: string;
  genre?: string;
  language?: string;
  pages?: number;
  isbn?: string;
  cover_image_url?: string;
  pdf_url?: string;
}

export function useMyPublications() {
  return useQuery({
    queryKey: ['my-publications'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_published_books')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PublishedBook[];
    },
  });
}

export function usePublishBook() {
  const queryClient = useQueryClient();

  const createBook = useMutation({
    mutationFn: async (input: PublishBookInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_published_books')
        .insert({ ...input, user_id: user.id, status: 'draft' })
        .select()
        .single();

      if (error) throw error;
      return data as PublishedBook;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-publications'] });
      toast({ title: 'Book created as draft' });
    },
    onError: (err: any) => {
      toast({ title: 'Failed to create book', description: err.message, variant: 'destructive' });
    },
  });

  const submitForReview = useMutation({
    mutationFn: async (bookId: string) => {
      const { error } = await supabase
        .from('user_published_books')
        .update({ status: 'pending_review' })
        .eq('id', bookId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-publications'] });
      toast({ title: 'Book submitted for review!' });
    },
    onError: (err: any) => {
      toast({ title: 'Submission failed', description: err.message, variant: 'destructive' });
    },
  });

  const deleteBook = useMutation({
    mutationFn: async (bookId: string) => {
      const { error } = await supabase
        .from('user_published_books')
        .delete()
        .eq('id', bookId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-publications'] });
      toast({ title: 'Book deleted' });
    },
    onError: (err: any) => {
      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' });
    },
  });

  return { createBook, submitForReview, deleteBook };
}

export async function uploadPublishFile(file: File, userId: string, type: 'cover' | 'pdf'): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `user-uploads/${userId}/${type}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('books')
    .upload(path, file, { upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from('books').getPublicUrl(path);
  return data.publicUrl;
}
