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

    console.log('Searching for books with term:', searchTerm)

    // First try Open Library API
    let books: BookData[] = await searchOpenLibrary(searchTerm)
    
    // If no results from Open Library, try Google Books
    if (books.length === 0) {
      console.log('No results from Open Library, trying Google Books')
      books = await searchGoogleBooks(searchTerm)
    }

    console.log(`Found ${books.length} books`)

    // Save books to database
    const savedBooks = []
    for (const book of books) {
      try {
        // Check for duplicates
        const { data: existing } = await supabaseClient
          .from('books_test')
          .select('id')
          .or(`isbn.eq.${book.isbn || 'null'},and(title.eq.${book.title},author.eq.${book.author || 'null'})`)
          .limit(1)

        if (existing && existing.length > 0) {
          console.log(`Book already exists: ${book.title}`)
          continue
        }

        const { data, error } = await supabaseClient
          .from('books_test')
          .insert(book)
          .select()
          .single()

        if (error) {
          console.error('Error saving book:', error)
          continue
        }

        savedBooks.push(data)
      } catch (error) {
        console.error('Error processing book:', book.title, error)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        booksFound: books.length,
        booksSaved: savedBooks.length,
        books: savedBooks 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in search-books function:', error)
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
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchTerm)}&maxResults=10`
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
        pdf_url: item.accessInfo?.pdf?.downloadLink,
      }
    }).filter((book: BookData) => book.title && book.title !== 'Unknown Title')

  } catch (error) {
    console.error('Error searching Google Books:', error)
    return []
  }
}