/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '../../integrations/supabase/client';
const supabaseClient: any = supabase;

export async function getNote(bookId: string): Promise<string> {
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user) return '';

  const { data, error } = await supabaseClient
    .from('user_book_notes' as any)
    .select('text')
    .eq('book_id', bookId)
    .eq('user_id', user.user.id)
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

  const { error } = await supabaseClient
    .from('user_book_notes' as any)
    .upsert(
      { book_id: bookId, user_id: user.user.id, text } as any,
      { onConflict: 'user_id,book_id' },
    );

  if (error) {
    console.error('upsertNote error', error);
    throw error;
  }
}

