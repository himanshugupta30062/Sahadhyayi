/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '../../integrations/supabase/client';
import type { Book, ReadingStatus, UserBook } from '../types';
const supabaseClient: any = supabase;

export interface CurrentRead extends UserBook {
  book: Book;
}

export async function getCurrentReads(userId: string): Promise<CurrentRead[]> {
  const { data, error } = await supabaseClient
    .from('user_books' as any)
    .select('book_id, status, progress, last_opened_at, books_library:book_id (*)')
    .eq('user_id', userId)
    .eq('status', 'reading')
    .order('last_opened_at', { ascending: false })
    .limit(6);

  if (error) {
    console.error('getCurrentReads error', error);
    return [];
  }

  return (
    (data || []) as any
  ).map((item: any) => ({
    user_id: userId,
    book_id: item.book_id,
    status: item.status as ReadingStatus,
    progress: item.progress,
    last_opened_at: item.last_opened_at,
    book: item.books_library as Book,
  }));
}

export async function getStatus(bookId: string): Promise<ReadingStatus | null> {
  const { data: user } = await supabaseClient.auth.getUser();
  if (!user?.user) return null;

  const { data, error } = await supabaseClient
    .from('user_books' as any)
    .select('status')
    .eq('book_id', bookId)
    .eq('user_id', user.user.id)
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
  const { data: user } = await supabaseClient.auth.getUser();
  if (!user?.user) throw new Error('Not authenticated');

  const { error } = await supabaseClient
    .from('user_books' as any)
    .upsert(
      { book_id: bookId, status, user_id: user.user.id },
      { onConflict: 'user_id,book_id' },
    );

  if (error) {
    console.error('setStatus error', error);
    throw error;
  }
}

export async function toggleWishlist(bookId: string): Promise<boolean> {
  const { data: user } = await supabaseClient.auth.getUser();
  if (!user?.user) throw new Error('Not authenticated');

  const { data: existing, error: selectError } = await supabaseClient
    .from('user_wishlist' as any)
    .select('id')
    .eq('book_id', bookId)
    .eq('user_id', user.user.id)
    .maybeSingle();

  if (selectError) {
    console.error('toggleWishlist select error', selectError);
    throw selectError;
  }

  if (existing) {
    const { error } = await supabaseClient
      .from('user_wishlist' as any)
      .delete()
      .eq('id', existing.id);
    if (error) {
      console.error('toggleWishlist delete error', error);
      throw error;
    }
    return false;
  } else {
    const { error } = await supabaseClient
      .from('user_wishlist' as any)
      .insert({ book_id: bookId, user_id: user.user.id });
    if (error) {
      console.error('toggleWishlist insert error', error);
      throw error;
    }
    return true;
  }
}

export async function touchLastOpened(bookId: string): Promise<void> {
  const { data: user } = await supabaseClient.auth.getUser();
  if (!user?.user) return;

  const { error } = await supabaseClient
    .from('user_books' as any)
    .update({ last_opened_at: new Date().toISOString() } as any)
    .eq('user_id', user.user.id)
    .eq('book_id', bookId);

  if (error) {
    console.error('touchLastOpened error', error);
  }
}
