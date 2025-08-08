import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useBookRatings(bookId: string) {
  return useQuery({
    queryKey: ['ratings', bookId],
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('book_ratings')
        .select('rating', { count: 'exact' })
        .eq('book_id', bookId);

      if (error) {
        throw error;
      }

      const avg = data && data.length
        ? data.reduce((sum, r) => sum + r.rating, 0) / data.length
        : 0;
      return { average: avg, count: count ?? 0 };
    },
  });
}

export function useRateBook(bookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rating: number) => {
      const { error } = await supabase
        .from('book_ratings')
        .upsert({ book_id: bookId, rating })
        .select();
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries(['ratings', bookId]);
    },
  });
}
