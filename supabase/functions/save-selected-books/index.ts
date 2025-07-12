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
    const { selectedBooks } = await req.json()
    
    if (!selectedBooks || !Array.isArray(selectedBooks) || selectedBooks.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Selected books array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log(`💾 Saving ${selectedBooks.length} selected books to database`)

    // Save selected books to database
    const savedBooks = []
    const duplicateBooks = []
    
    for (const book of selectedBooks) {
      try {
        const result = await saveOrUpdateBook(supabaseClient, book)
        if (result) {
          if (result.isDuplicate) {
            duplicateBooks.push(result)
          } else {
            savedBooks.push(result)
          }
        }
      } catch (error) {
        console.error('❌ Error processing book:', book.title, error)
      }
    }

    console.log(`✅ Successfully saved ${savedBooks.length} books, found ${duplicateBooks.length} duplicates`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        booksSaved: savedBooks.length,
        duplicatesFound: duplicateBooks.length,
        books: savedBooks,
        duplicates: duplicateBooks
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💥 Error saving selected books:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

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
      console.log(`📖 Found existing book: ${book.title} - marking as duplicate`)
      
      // Return existing book with duplicate flag
      return { ...existingBook, isDuplicate: true }
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