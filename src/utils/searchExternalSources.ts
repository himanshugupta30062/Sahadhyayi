import { supabase } from '@/integrations/supabase/client'

export interface ExternalBook {
  id: string
  title: string
  author?: string
  year?: string
  language?: string
  extension?: string
  size?: string
  md5: string
  downloadUrl: string
  source?: 'libgen' | 'open_access'
}

/**
 * Search external sources for books matching the query.
 * Uses the Supabase edge function `search-books-preview` which aggregates
 * results from multiple open data providers. Returns an array of
 * `ExternalBook` objects ready for display.
 */
export async function searchExternalSources(query: string): Promise<ExternalBook[]> {
  try {
    const { data, error } = await supabase.functions.invoke('search-books-preview', {
      body: { searchTerm: query }
    })

    if (error) throw error

    return (data?.books || [])
      .filter((book: any) => book.pdf_url)
      .map((book: any) => ({
        id: book.isbn || book.title,
        title: book.title || 'Unknown Title',
        author: book.author,
        year: book.publication_year ? String(book.publication_year) : undefined,
        language: book.language,
        extension: book.pdf_url ? 'pdf' : undefined,
        size: book.pages ? `${book.pages} pages` : undefined,
        md5: book.isbn || book.title,
        downloadUrl: book.pdf_url,
        source: 'open_access'
      }))
  } catch (err) {
    console.error('searchExternalSources error:', err)
    return []
  }
}
