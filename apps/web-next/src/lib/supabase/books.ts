/*
-- Suggested indexes for books
CREATE INDEX ON books USING GIN (tags);
CREATE INDEX ON books (language);
CREATE INDEX ON books (created_at DESC);
CREATE INDEX ON books (popularity DESC);
CREATE INDEX ON books (lower(title) text_pattern_ops);
*/

import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { bookSchema, type Book, type GetBooksParams } from '@/lib/types';

export async function getBooks(
  params: GetBooksParams,
  signal?: AbortSignal,
): Promise<{ items: Book[]; nextCursor?: string }> {
  const limit = 24;
  let query = supabase
    .from('books')
    .select('*, authors:authors(id,name,photo_url)')
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
      `title.ilike.${like},title_hi.ilike.${like},tags.ilike.${like},authors!inner(name.ilike.${like})`,
    );
  }

  const { data, error } = await query;
  if (error) throw error;

  const parsed = z.array(bookSchema).parse(data) as Book[];
  const items = parsed.slice(0, limit);
  const nextCursor = parsed.length > limit ? parsed[limit - 1].id : undefined;

  return { items, nextCursor };
}
