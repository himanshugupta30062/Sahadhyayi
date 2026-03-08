import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface PublishedBook {
  id: string;
  user_id: string;
  title: string;
  subtitle: string | null;
  author_name: string;
  description: string | null;
  genre: string | null;
  language: string | null;
  pages: number | null;
  isbn: string | null;
  cover_image_url: string | null;
  pdf_url: string | null;
  file_size: number | null;
  reading_time_minutes: number | null;
  tags: string[] | null;
  status: string;
  rejection_reason: string | null;
  views_count: number;
  downloads_count: number;
  created_at: string;
  updated_at: string;
}

export interface PublishBookInput {
  title: string;
  subtitle?: string;
  author_name: string;
  description?: string;
  genre?: string;
  language?: string;
  pages?: number;
  isbn?: string;
  tags?: string[];
  cover_image_url?: string;
  pdf_url?: string;
  file_size?: number;
  reading_time_minutes?: number;
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

const MAX_COVER_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_PDF_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function validateCoverFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return 'Cover must be JPG, PNG, or WebP';
  if (file.size > MAX_COVER_SIZE) return 'Cover image must be under 5MB';
  return null;
}

export function validatePdfFile(file: File): string | null {
  if (file.type !== 'application/pdf') return 'File must be a PDF';
  if (file.size > MAX_PDF_SIZE) return 'PDF must be under 50MB';
  return null;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function estimateReadingTime(pages: number): number {
  // Average 2 minutes per page
  return Math.max(1, Math.round(pages * 2));
}

export async function uploadPublishFile(
  file: File,
  userId: string,
  bookId: string,
  type: 'cover' | 'pdf',
  onProgress?: (percent: number) => void,
): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `user-uploads/${userId}/${bookId}/${type === 'cover' ? 'cover' : 'book'}.${ext}`;

  // Simulate progress since Supabase JS doesn't expose upload progress natively
  onProgress?.(10);

  const { error } = await supabase.storage
    .from('books')
    .upload(path, file, { upsert: true });

  onProgress?.(90);

  if (error) throw error;

  const { data } = supabase.storage.from('books').getPublicUrl(path);
  onProgress?.(100);
  return data.publicUrl;
}
