import { supabase } from '@/integrations/supabase/client'
import {
  detectBookSchemaCapabilities,
  applyPublicBookFilter,
  filterPublicBooks,
} from '@/utils/catalog/bookVisibility'

export type BookSearchRow = {
  id: string
  title: string
  author: string
  genre: string
  language: string
  cover_url: string
  popularity: number
  snippet: string
  rank: number
}

export type SearchParams = {
  limit?: number
  lang?: string | null
  minPopularity?: number | null
  genres?: string[] | null
}

export async function searchLibrary(
  query: string,
  params: SearchParams = {},
  options: { signal?: AbortSignal } = {},
) {
  const { limit = 50, lang = null, minPopularity = null, genres = null } = params
  
  const caps = await detectBookSchemaCapabilities();
  const selectCols = ['id', 'title', 'author', 'genre', 'language', 'cover_image_url', 'description'];
  if (caps.hasStatus) selectCols.push('status');
  if (caps.hasCatalogStatus) selectCols.push('catalog_status');

  let dbQuery = supabase
    .from('books_library')
    .select(selectCols.join(', '));

  dbQuery = applyPublicBookFilter(dbQuery, caps);

  const { data, error } = await dbQuery
    .ilike('title', `%${query.trim()}%`)
    .limit(limit)
    .abortSignal(options.signal);
    
  if (error) throw error
  
  const activeBooks = filterPublicBooks(data || []);

  // Transform the data to match BookSearchRow format
  return activeBooks.map((book: any) => ({
    id: book.id,
    title: book.title,
    author: book.author || '',
    genre: book.genre || '',
    language: book.language || '',
    cover_url: book.cover_image_url || '',
    popularity: 0,
    snippet: book.description
      ? `${book.description.substring(0, 100)}...`
      : '',
    rank: 1
  }))
}
