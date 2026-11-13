import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';

export const REVIEW_DIMENSIONS = ['writing', 'characters', 'plot', 'pacing', 'worldbuilding', 'originality'] as const;
export type ReviewDimension = typeof REVIEW_DIMENSIONS[number];
export type ReaderReaction = 'joyful' | 'thoughtful' | 'inspired' | 'heartbroken' | 'tense' | 'surprised' | 'comforted' | 'challenged';
export type ReviewScore = { dimension: ReviewDimension; score: number };

export interface BookReview {
  id: string;
  book_id: string;
  user_id: string;
  review_text: string;
  contains_spoilers: boolean;
  reader_reaction?: ReaderReaction | null;
  dimensions?: ReviewScore[];
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
      const { data, error } = await supabase.from('book_reviews')
        .select('id, book_id, user_id, review_text, contains_spoilers, reader_reaction, created_at, updated_at')
        .eq('book_id', bookId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      const rows = (data || []) as BookReview[];
      if (!rows.length) return rows;
      const { data: dimensionRows, error: dimensionError } = await supabase.from('book_review_dimensions').select('review_id, dimension, score').in('review_id', rows.map((row) => row.id));
      if (dimensionError) console.warn('Could not load review scores:', dimensionError.message);
      const dimensionsByReview = new Map<string, ReviewScore[]>();
      (dimensionRows || []).forEach((item) => { const current = dimensionsByReview.get(item.review_id) || []; current.push({ dimension: item.dimension as ReviewDimension, score: item.score }); dimensionsByReview.set(item.review_id, current); });
      rows.forEach((row) => { row.dimensions = dimensionsByReview.get(row.id) || []; });

      // Enrich only from the public-profile view; never query private profile fields.
      const ids = [...new Set(rows.map((row) => row.user_id))];
      const { data: profiles, error: profilesError } = await supabase.from('profiles_public')
        .select('id, full_name, username, profile_photo_url')
        .in('id', ids);
      if (profilesError) {
        console.warn('Could not load public reviewer profiles:', profilesError.message);
      }
      const byId = new Map(
        (profiles ?? []).flatMap((profile) =>
          profile.id ? [[profile.id, { ...profile, id: profile.id }] as const] : []
        )
      );
      return rows.map((row) => ({ ...row, reviewer: byId.get(row.user_id) || null }));
    },
  });
}

export function useSaveBookReview(bookId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { reviewText: string; containsSpoilers: boolean; readerReaction?: ReaderReaction | null; dimensions?: ReviewScore[] }) => {
      if (!bookId) throw new Error('Missing book');
      if (!user?.id) throw new Error('Please sign in to write a review.');
      const reviewText = input.reviewText.trim();
      if (!reviewText || reviewText.length > 5000) throw new Error('Review must be between 1 and 5,000 characters.');
      const { data, error } = await supabase.from('book_reviews').upsert({
        book_id: bookId,
        user_id: user.id,
        review_text: reviewText,
        contains_spoilers: input.containsSpoilers,
        reader_reaction: input.readerReaction || null,
      }, { onConflict: 'book_id,user_id' })
        .select('id, book_id, user_id, review_text, contains_spoilers, created_at, updated_at')
        .single();
      if (error) throw error;
      const review = data as BookReview;
      const scores = (input.dimensions || []).filter((item) => REVIEW_DIMENSIONS.includes(item.dimension) && Number.isInteger(item.score) && item.score >= 1 && item.score <= 5);
      const { error: deleteScoresError } = await supabase.from('book_review_dimensions').delete().eq('review_id', review.id);
      if (deleteScoresError) throw deleteScoresError;
      if (scores.length) { const { error: insertScoresError } = await supabase.from('book_review_dimensions').insert(scores.map((item) => ({ review_id: review.id, dimension: item.dimension, score: item.score }))); if (insertScoresError) throw insertScoresError; }
      review.dimensions = scores;
      return review;
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
      const { error } = await supabase.from('book_reviews')
        .delete().eq('id', reviewId).eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['book-reviews', bookId] }),
  });
}
