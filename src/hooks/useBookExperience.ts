import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/authHelpers';

export const BOOK_MOODS = ['dark','hopeful','funny','sad','inspiring','reflective','adventurous','romantic','tense','comforting','mysterious','challenging'] as const;
export const BOOK_CONTENT_WARNINGS = ['violence','sexual violence','abuse','grief','death','suicide','self-harm','substance use','discrimination','war','illness','animal harm'] as const;
export type BookMood = typeof BOOK_MOODS[number];
export type BookContentWarning = typeof BOOK_CONTENT_WARNINGS[number];
export type BookExperience = { moods: BookMood[]; pacing: 'fast'|'medium'|'slow'|null; content_warnings: BookContentWarning[]; custom_warning: string|null };

export function useBookExperience(bookId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['book-experience', user?.id, bookId];\n  const db = supabase as any;
  const query = useQuery({
    queryKey,
    enabled: Boolean(user?.id && bookId),
    queryFn: async (): Promise<BookExperience> => {
      const { data, error } = await db.from('book_experience_tags').select('moods,pacing,content_warnings,custom_warning').eq('user_id', user!.id).eq('book_id', bookId).maybeSingle();
      if (error) throw error;
      return { moods: (data?.moods ?? []) as BookMood[], pacing: (data?.pacing ?? null) as BookExperience['pacing'], content_warnings: (data?.content_warnings ?? []) as BookContentWarning[], custom_warning: data?.custom_warning ?? null };
    },
  });
  const save = useMutation({
    mutationFn: async (value: BookExperience) => {
      const { error } = await supabase.from('book_experience_tags').upsert({ user_id: user!.id, book_id: bookId, ...value, updated_at: new Date().toISOString() }, { onConflict: 'user_id,book_id' });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });
  return { ...query, save };
}
