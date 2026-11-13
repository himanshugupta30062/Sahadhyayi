import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';

export const READER_MOODS = ['dark','hopeful','funny','sad','inspiring','reflective','adventurous','romantic','tense','comforting','mysterious','challenging'] as const;
export const CONTENT_WARNINGS = ['violence','sexual violence','abuse','grief','death','suicide','self-harm','substance use','discrimination','war','illness','animal harm'] as const;
export type ReaderMood = typeof READER_MOODS[number];
export type ContentWarning = typeof CONTENT_WARNINGS[number];
export interface BookExperience {
  id: string; user_id: string; book_id: string; moods: ReaderMood[];
  pacing: 'fast'|'medium'|'slow'|null; content_warnings: ContentWarning[];
  custom_warning: string|null; created_at: string; updated_at: string;
}
export type BookExperienceInput = Pick<BookExperience,'moods'|'pacing'|'content_warnings'|'custom_warning'>;

export function useBookExperience(bookId: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const queryKey = ['book-experience', user?.id, bookId];
  const query = useQuery({
    queryKey,
    enabled: Boolean(user?.id && bookId),
    queryFn: async () => {
      const { data, error } = await supabase.from('book_experience_tags').select('*').eq('user_id',user!.id).eq('book_id',bookId).maybeSingle();
      if(error) throw error;
      return data as BookExperience|null;
    },
  });
  const save = useMutation({
    mutationFn: async (input: BookExperienceInput) => {
      if(!user) throw new Error('Sign in to save reading tags');
      const {data,error}=await supabase.from('book_experience_tags').upsert({user_id:user.id,book_id:bookId,...input,updated_at:new Date().toISOString()},{onConflict:'user_id,book_id'}).select('*').single();
      if(error) throw error;
      return data as BookExperience;
    },
    onSuccess: data => qc.setQueryData(queryKey,data),
  });
  return {...query, save};
}
