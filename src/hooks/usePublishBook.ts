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
  status?: 'draft' | 'pending_review';
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
        .insert({ ...input, user_id: user.id, status: input.status ?? 'draft' })
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

  const createQuarantineSubmission = useMutation({
    mutationFn: async (input: {
      id: string;
      authorPublicationId: string;
      file: File;
      storagePath: string;
      title: string;
      authorName: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('book_pdf_submissions' as any).insert({
        id: input.id,
        user_id: user.id,
        author_publication_id: input.authorPublicationId,
        submission_source: 'user_upload',
        original_filename: input.file.name.slice(0, 255),
        storage_path: input.storagePath,
        file_size_bytes: input.file.size,
        submitted_title: input.title,
        submitted_author: input.authorName,
        rights_attested: true,
        rights_statement: 'Contributor attests they are authorized to submit this file for review.',
        status: 'uploaded',
      });
      if (error) throw error;

      // Start verification opportunistically; the admin queue can retry if the
      // worker is temporarily unavailable. The manuscript remains private.
      const { error: verificationError } = await supabase.functions.invoke('verify-book-pdf', {
        body: { submissionId: input.id },
      });
      if (verificationError) {
        console.warn('Author manuscript was quarantined but automatic verification did not start.', verificationError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-publications'] });
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

  return { createBook, submitForReview, createQuarantineSubmission, deleteBook };
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
  const ext = type === 'cover'
    ? (file.name.split('.').pop()?.toLowerCase() || 'jpg')
    : 'pdf';
  const path = type === 'cover'
    ? `covers/${userId}/${bookId}/cover.${ext}`
    : `${userId}/${bookId}/source.pdf`;
  const bucket = type === 'cover' ? 'books' : 'book-pdf-quarantine';

  onProgress?.(10);
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: type === 'pdf' ? 'application/pdf' : file.type,
    cacheControl: type === 'pdf' ? '0' : '3600',
    upsert: false,
  });
  onProgress?.(90);
  if (error) throw error;

  onProgress?.(100);
  if (type === 'pdf') return path;
  return supabase.storage.from('books').getPublicUrl(path).data.publicUrl;
}
