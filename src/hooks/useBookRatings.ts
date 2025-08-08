import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface RatingResult {
  average: number;
  count: number;
  userRating: number | null;
}

export function useBookRatings(bookId: string | undefined) {
  return useQuery<RatingResult>({
    queryKey: ['book-ratings-agg', bookId],
    enabled: !!bookId,
    queryFn: async () => {
      if (!bookId) {
        return { average: 0, count: 0, userRating: null };
      }

      const { data: agg, error: aggErr } = await supabase
        .from('book_ratings_agg')
        .select('avg_rating, rating_count, book_id')
        .eq('book_id', bookId)
        .maybeSingle();

      if (aggErr) throw aggErr;

      const { data: { user } = { user: null } } = await supabase.auth.getUser();
      let userRating: number | null = null;
      if (user?.id) {
        const { data: my, error: myErr } = await supabase
          .from('book_ratings')
          .select('rating')
          .eq('book_id', bookId)
          .eq('user_id', user.id)
          .maybeSingle();
        if (myErr) {
          console.warn('user rating fetch failed', myErr);
        } else {
          userRating = my?.rating ?? null;
        }
      }

      return {
        average: Number(agg?.avg_rating ?? 0),
        count: Number(agg?.rating_count ?? 0),
        userRating,
      };
    },
  });
}

export function useRateBook(bookId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rating: number) => {
      if (!bookId) throw new Error('Missing bookId');
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('book_ratings')
        .upsert({
          book_id: bookId,
          user_id: user.id,
          rating,
        }, { onConflict: 'book_id,user_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['book-ratings-agg', bookId] });
    },
  });
}
