import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BookData {
  title: string;
  author?: string;
  genre?: string;
  cover_image_url?: string;
  description?: string;
  author_bio?: string;
  isbn?: string;
  publication_year?: number;
  pages?: number;
  language?: string;
  pdf_url?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { searchTerm } = await req.json()
    
    if (!searchTerm) {
      return new Response(
        JSON.stringify({ error: 'Search term is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🔍 Ultimate Book Search for:', searchTerm)

    // Search all APIs in parallel for better performance
    const [openLibraryBooks, googleBooksData, gutenbergBooks, archiveBooks] = await Promise.all([
      searchOpenLibrary(searchTerm),
      searchGoogleBooks(searchTerm),
      searchProjectGutenberg(searchTerm),
      searchInternetArchive(searchTerm)
    ])

    console.log(`📚 Results: OpenLibrary(${openLibraryBooks.length}), Google(${googleBooksData.length}), Gutenberg(${gutenbergBooks.length}), Archive(${archiveBooks.length})`)

    // Merge and enhance book data
    const mergedBooks = await mergeBookData(openLibraryBooks, googleBooksData, gutenbergBooks, archiveBooks, searchTerm)
    console.log(`🔄 Merged into ${mergedBooks.length} unique books`)

    // Save books to database with enhanced duplicate handling
    const savedBooks = []
    for (const book of mergedBooks) {
      try {
        const savedBook = await saveOrUpdateBook(supabaseClient, book)
        if (savedBook) {
          savedBooks.push(savedBook)
        }
      } catch (error) {
        console.error('❌ Error processing book:', book.title, error)
      }
    }

    console.log(`✅ Successfully saved ${savedBooks.length} books`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        booksFound: mergedBooks.length,
        booksSaved: savedBooks.length,
        books: savedBooks,
        sources: {
          openLibrary: openLibraryBooks.length,
          googleBooks: googleBooksData.length,
          gutenberg: gutenbergBooks.length,
          archive: archiveBooks.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💥 Error in ultimate book search:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function searchOpenLibrary(searchTerm: string): Promise<BookData[]> {
  try {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(searchTerm)}&limit=10`
    const response = await fetch(url)
    const data = await response.json()

    if (!data.docs || data.docs.length === 0) {
      return []
    }

    return data.docs.map((book: any) => ({
      title: book.title || 'Unknown Title',
      author: book.author_name?.[0],
      genre: book.subject?.[0],
      cover_image_url: book.cover_i 
        ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
        : undefined,
      description: undefined, // Open Library rarely has descriptions
      publication_year: book.first_publish_year,
      pages: book.number_of_pages_median,
      language: book.language?.[0] || 'English',
      isbn: book.isbn?.[0],
    })).filter((book: BookData) => book.title && book.title !== 'Unknown Title')

  } catch (error) {
    console.error('Error searching Open Library:', error)
    return []
  }
}

async function searchGoogleBooks(searchTerm: string): Promise<BookData[]> {
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchTerm)}&maxResults=5`
    const response = await fetch(url)
    const data = await response.json()

    if (!data.items || data.items.length === 0) {
      return []
    }

    return data.items.map((item: any) => {
      const book = item.volumeInfo
      return {
        title: book.title || 'Unknown Title',
        author: book.authors?.[0],
        genre: book.categories?.[0],
        cover_image_url: book.imageLinks?.thumbnail?.replace('http:', 'https:'),
        description: book.description,
        isbn: book.industryIdentifiers?.find((id: any) => 
          id.type === 'ISBN_13' || id.type === 'ISBN_10'
        )?.identifier,
        publication_year: book.publishedDate ? 
          parseInt(book.publishedDate.split('-')[0]) : undefined,
        pages: book.pageCount,
        language: book.language || 'English',
        pdf_url: item.accessInfo?.pdf?.isAvailable ? book.previewLink : undefined,
      }
    }).filter((book: BookData) => book.title && book.title !== 'Unknown Title')

  } catch (error) {
    console.error('Error searching Google Books:', error)
    return []
  }
}

async function searchProjectGutenberg(searchTerm: string): Promise<BookData[]> {
  try {
    const url = `https://gutendex.com/books?search=${encodeURIComponent(searchTerm)}`
    const response = await fetch(url)
    const data = await response.json()

    if (!data.results || data.results.length === 0) {
      return []
    }

    return data.results.slice(0, 5).map((book: any) => ({
      title: book.title || 'Unknown Title',
      author: book.authors?.[0]?.name,
      genre: book.subjects?.[0],
      cover_image_url: undefined,
      description: undefined,
      isbn: undefined,
      publication_year: book.authors?.[0]?.death_year ? parseInt(book.authors[0].death_year) - 50 : undefined,
      pages: undefined,
      language: book.languages?.[0] === 'en' ? 'English' : book.languages?.[0],
      pdf_url: book.formats?.['application/pdf'] || book.formats?.['text/pdf'],
    })).filter((book: BookData) => book.title && book.title !== 'Unknown Title' && book.pdf_url)

  } catch (error) {
    console.error('Error searching Project Gutenberg:', error)
    return []
  }
}

async function searchInternetArchive(searchTerm: string): Promise<BookData[]> {
  try {
    const url = `https://archive.org/advancedsearch.php?q=title:(${encodeURIComponent(searchTerm)}) AND mediatype:texts&fl=identifier,title,creator,date,description&rows=3&output=json`
    const response = await fetch(url)
    const data = await response.json()

    if (!data.response?.docs || data.response.docs.length === 0) {
      return []
    }

    return data.response.docs.map((item: any) => ({
      title: item.title || 'Unknown Title',
      author: Array.isArray(item.creator) ? item.creator[0] : item.creator,
      genre: undefined,
      cover_image_url: undefined,
      description: Array.isArray(item.description) ? item.description[0] : item.description,
      isbn: undefined,
      publication_year: item.date ? parseInt(item.date.split('-')[0]) : undefined,
      pages: undefined,
      language: 'English',
      pdf_url: item.identifier ? `https://archive.org/download/${item.identifier}/${item.identifier}.pdf` : undefined,
    })).filter((book: BookData) => book.title && book.title !== 'Unknown Title')

  } catch (error) {
    console.error('Error searching Internet Archive:', error)
    return []
  }
}

async function mergeBookData(
  openLibraryBooks: BookData[], 
  googleBooksData: BookData[], 
  gutenbergBooks: BookData[], 
  archiveBooks: BookData[],
  searchTerm: string
): Promise<BookData[]> {
  const allBooks = [...openLibraryBooks, ...googleBooksData, ...gutenbergBooks, ...archiveBooks]
  const mergedMap = new Map<string, BookData>()

  for (const book of allBooks) {
    const key = book.isbn || `${book.title.toLowerCase().replace(/[^a-z0-9]/g, '')}-${book.author?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'unknown'}`
    
    if (mergedMap.has(key)) {
      const existing = mergedMap.get(key)!
      // Merge data, preferring non-empty values
      mergedMap.set(key, {
        title: existing.title || book.title,
        author: existing.author || book.author,
        genre: existing.genre || book.genre,
        cover_image_url: existing.cover_image_url || book.cover_image_url,
        description: existing.description || book.description,
        author_bio: existing.author_bio || book.author_bio,
        isbn: existing.isbn || book.isbn,
        publication_year: existing.publication_year || book.publication_year,
        pages: existing.pages || book.pages,
        language: existing.language || book.language,
        // Prefer actual PDF downloads over preview links
        pdf_url: (existing.pdf_url && existing.pdf_url.includes('gutenberg')) ? existing.pdf_url :
                 (book.pdf_url && book.pdf_url.includes('gutenberg')) ? book.pdf_url :
                 (existing.pdf_url && existing.pdf_url.includes('archive.org')) ? existing.pdf_url :
                 (book.pdf_url && book.pdf_url.includes('archive.org')) ? book.pdf_url :
                 existing.pdf_url || book.pdf_url,
      })
    } else {
      mergedMap.set(key, { ...book })
    }
  }

  return Array.from(mergedMap.values()).slice(0, 10) // Limit results
}

async function saveOrUpdateBook(supabaseClient: any, book: BookData): Promise<any> {
  try {
    // Check for duplicates using ISBN or title+author
    let duplicateQuery = supabaseClient
      .from('books_library')
      .select('*')
    
    if (book.isbn) {
      duplicateQuery = duplicateQuery.eq('isbn', book.isbn)
    } else {
      duplicateQuery = duplicateQuery
        .eq('title', book.title)
        .eq('author', book.author || '')
    }
    
    const { data: existing } = await duplicateQuery.limit(1)

    if (existing && existing.length > 0) {
      const existingBook = existing[0]
      console.log(`📖 Found existing book: ${book.title}`)
      
      // Update missing fields
      const updateData: any = {}
      
      if (!existingBook.description && book.description) updateData.description = book.description
      if (!existingBook.cover_image_url && book.cover_image_url) updateData.cover_image_url = book.cover_image_url
      if (!existingBook.genre && book.genre) updateData.genre = book.genre
      if (!existingBook.author_bio && book.author_bio) updateData.author_bio = book.author_bio
      if (!existingBook.pages && book.pages) updateData.pages = book.pages
      if (!existingBook.publication_year && book.publication_year) updateData.publication_year = book.publication_year
      if (!existingBook.pdf_url && book.pdf_url) updateData.pdf_url = book.pdf_url
      
      if (Object.keys(updateData).length > 0) {
        const { data: updated } = await supabaseClient
          .from('books_library')
          .update(updateData)
          .eq('id', existingBook.id)
          .select()
          .single()
        
        console.log(`🔄 Updated book with ${Object.keys(updateData).length} new fields`)
        return updated
      }
      
      return existingBook
    }

    // Insert new book
    const { data, error } = await supabaseClient
      .from('books_library')
      .insert({
        title: book.title,
        author: book.author,
        genre: book.genre,
        cover_image_url: book.cover_image_url,
        description: book.description,
        author_bio: book.author_bio,
        isbn: book.isbn,
        publication_year: book.publication_year,
        pages: book.pages,
        language: book.language || 'English',
        pdf_url: book.pdf_url,
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting book:', error)
      return null
    }

    console.log(`➕ Added new book: ${book.title}`)
    return data

  } catch (error) {
    console.error('Error in saveOrUpdateBook:', error)
    return null
  }
}