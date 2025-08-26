import { supabase } from '@/integrations/supabase/client';

export type ReadingStatus = 'to_read' | 'reading' | 'completed';

export async function getStatus(bookId: string): Promise<ReadingStatus | null> {
  const {
    data,
    error,
  } = await supabase
    .from('user_books')
    .select('status')
    .eq('book_id', bookId)
    .maybeSingle();

  if (error) {
    console.error('getStatus error', error);
    return null;
  }

  return (data?.status as ReadingStatus) ?? null;
}

export async function setStatus(
  bookId: string,
  status: ReadingStatus,
): Promise<void> {
  const {
    data: user,
  } = await supabase.auth.getUser();
  if (!user?.user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('user_books')
    .upsert({ book_id: bookId, status, user_id: user.user.id }, { onConflict: 'user_id,book_id' });

  if (error) {
    console.error('setStatus error', error);
    throw error;
  }
}

export async function toggleWishlist(bookId: string): Promise<boolean> {
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user) throw new Error('Not authenticated');

  const {
    data: existing,
    error: selectError,
  } = await supabase
    .from('user_wishlist')
    .select('id')
    .eq('book_id', bookId)
    .eq('user_id', user.user.id)
    .maybeSingle();

  if (selectError) {
    console.error('toggleWishlist select error', selectError);
    throw selectError;
  }

  if (existing) {
    const { error } = await supabase
      .from('user_wishlist')
      .delete()
      .eq('id', existing.id);
    if (error) {
      console.error('toggleWishlist delete error', error);
      throw error;
    }
    return false;
  } else {
    const { error } = await supabase
      .from('user_wishlist')
      .insert({ book_id: bookId, user_id: user.user.id });
    if (error) {
      console.error('toggleWishlist insert error', error);
      throw error;
    }
    return true;
  }
}

