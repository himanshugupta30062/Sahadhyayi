import { supabase } from '@/integrations/supabase/client';

export async function getNote(bookId: string): Promise<string> {
  const { data, error } = await supabase
    .from('user_book_notes')
    .select('text')
    .eq('book_id', bookId)
    .maybeSingle();

  if (error) {
    console.error('getNote error', error);
    return '';
  }

  return data?.text ?? '';
}

export async function upsertNote(bookId: string, text: string): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('user_book_notes')
    .upsert({ book_id: bookId, user_id: user.user.id, text }, { onConflict: 'user_id,book_id' });

  if (error) {
    console.error('upsertNote error', error);
    throw error;
  }
}

