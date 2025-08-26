/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '../../integrations/supabase/client';
import type { Book, GetBooksParams } from '@/lib/types';
const supabaseClient: any = supabase;

export async function getBooks(
  params: GetBooksParams,
  signal?: AbortSignal,
): Promise<{ items: Book[]; nextCursor?: string }> {
  const limit = params.limit ?? 24;
  let query = supabaseClient
    .from('books')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit + 1);

  if (signal) {
    query = query.abortSignal(signal);
  }

  if (params.cursor) {
    query = query.gt('id', params.cursor);
  }

  if (params.genres && params.genres.length > 0) {
    query = query.contains('genres', params.genres);
  }

  if (params.language) {
    query = query.eq('language', params.language);
  }

  if (params.price === 'free') {
    query = query.or('cost.is.null,cost.eq.0');
  } else if (params.price === 'paid') {
    query = query.gt('cost', 0);
  }

  if (params.yearRange) {
    const [from, to] = params.yearRange;
    if (from) query = query.gte('year', from);
    if (to) query = query.lte('year', to);
  }

  switch (params.sort) {
    case 'popularity':
      query = query.order('popularity', { ascending: false });
      break;
    case 'az':
      query = query.order('title', { ascending: true });
      break;
    case 'za':
      query = query.order('title', { ascending: false });
      break;
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false });
      break;
  }

  if (params.q) {
    const like = `%${params.q}%`;
    query = query.or(
      `title.ilike.${like},title_hi.ilike.${like},tags.ilike.${like}`,
    );
  }

  const { data, error } = await query;
  if (error) throw error;

  const items = (data as Book[]).slice(0, limit);
  const nextCursor = data && data.length > limit ? (data as Book[])[limit - 1].id : undefined;

  return { items, nextCursor };
}

export async function getBookById(id: string): Promise<Book | null> {
  const { data, error } = await supabaseClient
    .from('books')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as Book) ?? null;
}
