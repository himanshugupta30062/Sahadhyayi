import { supabase } from '@/integrations/supabase/client'

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
  
  // For now, we'll use a simple approach since the search_books RPC doesn't exist yet
  // This will be replaced with the actual RPC call once the function is created
  const { data, error } = await supabase
    .from('books_library')
    .select('id, title, author, genre, language, cover_image_url, description')
    .ilike('title', `%${query.trim()}%`)
    .limit(limit)
    .abortSignal(options.signal)
    
  if (error) throw error
  
  // Transform the data to match BookSearchRow format
  return (data || []).map((book: any) => ({
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
