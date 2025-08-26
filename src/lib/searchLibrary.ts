import { supabase } from '@/integrations/supabase/client'

export type BookSearchRow = {
  id: string
  title: string
  author: string
  genres: string[]
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
  const { data, error } = await supabase.rpc<BookSearchRow>(
    'search_books',
    {
      q: query.trim(),
      max_results: limit,
      lang,
      min_popularity: minPopularity,
      genres_filter: genres,
    },
    options
  )
  if (error) throw error
  return data
}
