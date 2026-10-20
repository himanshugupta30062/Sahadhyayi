import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';

export interface BookReview {
  id: string;
  book_id: string;
  user_id: string;
  review_text: string;
  contains_spoilers: boolean;
  created_at: string;
  updated_at: string;
  reviewer?: { id: string; full_name?: string | null; username?: string | null; profile_photo_url?: string | null } | null;
}

export function useBookReviews(bookId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['book-reviews', bookId, user?.id],
    enabled: !!bookId && !!user?.id,
    queryFn: async (): Promise<BookReview[]> => {
      if (!bookId) return [];
      const client = supabase as any;
      const { data, error } = await client.from('book_reviews' as any)
        .select('id, book_id, user_id, review_text, contains_spoilers, created_at, updated_at')
        .eq('book_id', bookId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      const rows = (data || []) as BookReview[];
      if (!rows.length) return rows;

      // Enrich only from the public-profile view; never query private profile fields.
      const ids = [...new Set(rows.map((row) => row.user_id))];
      const { data: profiles, error: profilesError } = await (client.from('profiles_public') as any)
        .select('id, full_name, username, profile_photo_url')
        .in('id', ids);
      if (profilesError) {
        console.warn('Could not load public reviewer profiles:', profilesError.message);
      }
      const byId = new Map((profiles || []).map((profile: any) => [profile.id, profile]));
      return rows.map((row) => ({ ...row, reviewer: byId.get(row.user_id) || null }));
    },
  });
}

export function useSaveBookReview(bookId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { reviewText: string; containsSpoilers: boolean }) => {
      if (!bookId) throw new Error('Missing book');
      if (!user?.id) throw new Error('Please sign in to write a review.');
      const reviewText = input.reviewText.trim();
      if (!reviewText || reviewText.length > 5000) throw new Error('Review must be between 1 and 5,000 characters.');
      const client = supabase as any;
      const { data, error } = await client.from('book_reviews' as any).upsert({
        book_id: bookId,
        user_id: user.id,
        review_text: reviewText,
        contains_spoilers: input.containsSpoilers,
      }, { onConflict: 'book_id,user_id' })
        .select('id, book_id, user_id, review_text, contains_spoilers, created_at, updated_at')
        .single();
      if (error) throw error;
      return data as BookReview;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['book-reviews', bookId] }),
  });
}

export function useDeleteBookReview(bookId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (reviewId: string) => {
      if (!bookId || !user?.id) throw new Error('Please sign in to manage your review.');
      const { error } = await (supabase).from('book_reviews' as any)
        .delete().eq('id', reviewId).eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['book-reviews', bookId] }),
  });
}
