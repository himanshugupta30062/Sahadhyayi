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
  format?: 'pdf' | 'epub' | 'html' | 'reader'
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

    const books = data?.books || []
    const results: ExternalBook[] = []

    for (const book of books) {
      // Add PDF URL if available
      if (book.pdf_url) {
        results.push({
          id: `${book.isbn || book.title}-pdf`,
          title: book.title || 'Unknown Title',
          author: book.author,
          year: book.publication_year ? String(book.publication_year) : undefined,
          language: book.language,
          extension: 'pdf',
          size: book.pages ? `${book.pages} pages` : undefined,
          md5: book.isbn || book.title,
          downloadUrl: book.pdf_url,
          source: 'open_access',
          format: 'pdf'
        })
      }

      // Add EPUB URL if available
      if (book.epub_url) {
        results.push({
          id: `${book.isbn || book.title}-epub`,
          title: book.title || 'Unknown Title',
          author: book.author,
          year: book.publication_year ? String(book.publication_year) : undefined,
          language: book.language,
          extension: 'epub',
          size: book.pages ? `${book.pages} pages` : undefined,
          md5: book.isbn || book.title,
          downloadUrl: book.epub_url,
          source: 'open_access',
          format: 'epub'
        })
      }

      // Add reader URL if available (HTML/online reader)
      if (book.reader_url && !book.pdf_url && !book.epub_url) {
        results.push({
          id: `${book.isbn || book.title}-reader`,
          title: book.title || 'Unknown Title',
          author: book.author,
          year: book.publication_year ? String(book.publication_year) : undefined,
          language: book.language,
          extension: 'html',
          size: book.pages ? `${book.pages} pages` : undefined,
          md5: book.isbn || book.title,
          downloadUrl: book.reader_url,
          source: 'open_access',
          format: 'reader'
        })
      }
    }

    return results
  } catch (err) {
    console.error('searchExternalSources error:', err)
    return []
  }
}
