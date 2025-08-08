
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/AuthContext';

export type ReadingSummary = {
  id: string;
  user_id: string;
  book_id: string | null;
  chapter_number: number;
  summary_text: string;
  created_at: string;
  updated_at: string;
};

export const useReadingSummaries = (bookId?: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['reading_summaries', user?.id, bookId],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('reading_summaries')
        .select('*')
        .eq('user_id', user.id)
        .order('chapter_number', { ascending: true });
      
      if (bookId) {
        query = query.eq('book_id', bookId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};

export const useCreateReadingSummary = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: { bookId: string; chapterNumber: number; content: string }) => {
      if (!user) throw new Error('User not authenticated');
      
      // Generate AI summary
      const summaryResponse = await supabase.functions.invoke('generate-summary', {
        body: { content: params.content, type: 'chapter' }
      });
      
      if (summaryResponse.error) {
        throw new Error(summaryResponse.error.message);
      }
      
      const { summary } = summaryResponse.data;
      
      // Save to database
      const { data, error } = await supabase
        .from('reading_summaries')
        .upsert({
          user_id: user.id,
          book_id: params.bookId,
          chapter_number: params.chapterNumber,
          summary_text: summary,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reading_summaries'] });
    },
  });
};
