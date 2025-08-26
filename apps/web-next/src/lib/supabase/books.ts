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
    .from('books_library')
    .select('*')
    .limit(limit + 1);

  if (signal) {
    query = query.abortSignal(signal);
  }

  if (params.cursor) {
    query = query.gt('id', params.cursor);
  }

  if (params.genres && params.genres.length > 0) {
    query = query.in('genre', params.genres);
  }

  if (params.language) {
    query = query.eq('language', params.language);
  }

  if (params.yearRange) {
    const [from, to] = params.yearRange;
    if (from) query = query.gte('publication_year', from);
    if (to) query = query.lte('publication_year', to);
  }

  switch (params.sort) {
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
    query = query.or(`title.ilike.${like},author.ilike.${like},description.ilike.${like}`);
  }

  const { data, error } = await query;
  if (error) {
    console.error('getBooks error', error);
    throw error;
  }

  const items = (data as Book[]).slice(0, limit);
  const nextCursor = data && data.length > limit ? (data as Book[])[limit - 1].id : undefined;

  return { items, nextCursor };
}

export async function getBookById(id: string): Promise<Book | null> {
  const { data, error } = await supabaseClient
    .from('books_library')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as Book) ?? null;
}
