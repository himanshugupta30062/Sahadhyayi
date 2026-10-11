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

    if (selectedBooks.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Batch limit exceeded. Maximum 100 books per request.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const authHeader = req.headers.get('Authorization')
    if (authHeader) {
      const authClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      )
      const { error: authError } = await authClient.auth.getUser()
      if (authError) {
        return new Response(
          JSON.stringify({ error: 'Invalid authentication credentials' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
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
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function normalizeTitleKey(raw: string): string {
  if (!raw) return '';
  return raw
    .normalize('NFC')
    .replace(/[([][^()[\]]*[)\]]/g, '') // remove bracketed tags
    .split(/[:—–-]/)[0] // take primary title before colon/dash
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function normalizeAuthorName(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (trimmed.includes(',')) {
    const parts = trimmed.split(',').map((p) => p.trim());
    if (parts.length === 2 && !parts[1].toLowerCase().includes('inc') && !parts[1].toLowerCase().includes('ltd')) {
      return `${parts[1]} ${parts[0]}`.toLowerCase().replace(/[^a-z0-9]/g, '');
    }
  }
  return trimmed.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function saveOrUpdateBook(supabaseClient: any, book: BookData): Promise<any> {
  try {
    const normTitleKey = normalizeTitleKey(book.title);
    const normAuthorKey = normalizeAuthorName(book.author || '');

    // 1. Check for duplicate using clean ISBN
    let existingBook: any = null;
    const cleanIsbn = book.isbn ? book.isbn.replace(/[^0-9X]/gi, '').toUpperCase() : null;

    if (cleanIsbn && (cleanIsbn.length === 10 || cleanIsbn.length === 13)) {
      const { data: isbnMatch } = await supabaseClient
        .from('books_library')
        .select('*')
        .eq('isbn', cleanIsbn)
        .limit(1);

      if (isbnMatch && isbnMatch.length > 0) {
        existingBook = isbnMatch[0];
      }
    }

    // 2. If not found by ISBN, query candidates by title
    if (!existingBook && normTitleKey) {
      // First exact title match
      const { data: exactMatch } = await supabaseClient
        .from('books_library')
        .select('*')
        .ilike('title', book.title.trim())
        .limit(5);

      if (exactMatch && exactMatch.length > 0) {
        existingBook = exactMatch.find((candidate: any) => {
          const cAuthor = normalizeAuthorName(candidate.author || '');
          return !cAuthor || !normAuthorKey || cAuthor === normAuthorKey || cAuthor.includes(normAuthorKey) || normAuthorKey.includes(cAuthor);
        }) || exactMatch[0];
      }
    }

    // 3. If an existing record was found, enrich missing fields and return without creating duplicate
    if (existingBook) {
      console.log(`📖 Matched existing edition: "${existingBook.title}" (ID: ${existingBook.id})`);

      const updates: any = {};
      if (!existingBook.description && book.description) updates.description = book.description;
      if (!existingBook.cover_image_url && book.cover_image_url) updates.cover_image_url = book.cover_image_url;
      if (!existingBook.isbn && cleanIsbn) updates.isbn = cleanIsbn;
      if (!existingBook.publication_year && book.publication_year) updates.publication_year = book.publication_year;
      if (!existingBook.pages && book.pages) updates.pages = book.pages;
      if (!existingBook.pdf_url && book.pdf_url) updates.pdf_url = book.pdf_url;
      if (!existingBook.author_bio && book.author_bio) updates.author_bio = book.author_bio;
      if (!existingBook.genre && book.genre) updates.genre = book.genre;

      if (Object.keys(updates).length > 0) {
        const { data: updatedRecord } = await supabaseClient
          .from('books_library')
          .update(updates)
          .eq('id', existingBook.id)
          .select()
          .single();

        console.log(`🔄 Enriched existing book ${existingBook.id} with ${Object.keys(updates).length} fields`);
        return { ...(updatedRecord || existingBook), isDuplicate: true, wasEnriched: true };
      }

      return { ...existingBook, isDuplicate: true, wasEnriched: false };
    }

    // 4. Insert new book record
    const { data, error } = await supabaseClient
      .from('books_library')
      .insert({
        title: book.title.trim(),
        author: book.author?.trim(),
        genre: book.genre?.trim(),
        cover_image_url: book.cover_image_url?.trim(),
        description: book.description?.trim(),
        author_bio: book.author_bio?.trim(),
        isbn: cleanIsbn || book.isbn?.trim(),
        publication_year: book.publication_year,
        pages: book.pages,
        language: book.language || 'English',
        pdf_url: book.pdf_url?.trim(),
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting book:', error);
      return null;
    }

    console.log(`➕ Added new unique book: ${book.title}`);
    return data;

  } catch (error) {
    console.error('Error in saveOrUpdateBook:', error);
    return null;
  }
}