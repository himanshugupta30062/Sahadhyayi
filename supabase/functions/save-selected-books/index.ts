import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface IncomingBookPayload {
  title: unknown;
  author?: unknown;
  genre?: unknown;
  cover_image_url?: unknown;
  description?: unknown;
  author_bio?: unknown;
  isbn?: unknown;
  publication_year?: unknown;
  pages?: unknown;
  language?: unknown;
  pdf_url?: unknown;
}

interface ValidatedBook {
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

export interface BookSaveResult {
  title: string;
  status: 'inserted' | 'already_exists' | 'enriched' | 'failed';
  id?: string;
  enrichedFields?: string[];
  error?: string;
}

serve(async (req) => {
  // 1. Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Open Access / Guest Support: Authentication is optional so guests and readers can expand the catalog.
    const authHeader = req.headers.get('Authorization')
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    let authenticatedUser: any = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '').trim()
      if (token && token !== supabaseAnonKey) {
        try {
          const authClient = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { persistSession: false },
          });

          const { data: userData } = await authClient.auth.getUser(token);
          if (userData?.user) {
            authenticatedUser = userData.user;
          }
        } catch (authErr) {
          console.warn('Optional auth verification notice:', authErr);
        }
      }
    }

    if (authenticatedUser) {
      console.log(`🔐 Authenticated user ${authenticatedUser.id} triggered catalog save.`);
    } else {
      console.log('📖 Guest reader triggered catalog save without requiring sign-in.');
    }

    // 3. Parse and Validate Request Payload
    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Malformed JSON payload in request body.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { selectedBooks } = body || {};

    if (!selectedBooks || !Array.isArray(selectedBooks) || selectedBooks.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Selected books array is required and must contain at least one book.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Limit batch size to prevent payload exhaustion
    const MAX_BATCH = 50;
    if (selectedBooks.length > MAX_BATCH) {
      return new Response(
        JSON.stringify({ error: `Batch limit exceeded. Maximum ${MAX_BATCH} books allowed per request.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate and sanitize each incoming book
    const validatedBooks: ValidatedBook[] = [];
    for (const raw of selectedBooks as IncomingBookPayload[]) {
      const sanitized = validateAndSanitizeBook(raw);
      if (sanitized) {
        validatedBooks.push(sanitized);
      }
    }

    if (validatedBooks.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid books found in payload. Each book requires a non-empty title.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Initialize privileged server-side database client (strictly server-side only)
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // 5. Probe schema capabilities for books_library once for this batch
    const hasStatusColumn = await probeHasStatusColumn(supabaseClient);

    console.log(`💾 Processing ${validatedBooks.length} books. (hasStatusColumn: ${hasStatusColumn})`);

    const results: BookSaveResult[] = [];
    const savedBooks: any[] = [];
    const duplicateBooks: any[] = [];

    // 6. Process each validated book with atomic duplicate lookup and enrichment
    for (const book of validatedBooks) {
      try {
        const outcome = await saveOrEnrichSingleBook(supabaseClient, book, hasStatusColumn);
        results.push(outcome);

        if (outcome.status === 'inserted') {
          savedBooks.push({ id: outcome.id, title: book.title, author: book.author });
        } else if (outcome.status === 'already_exists' || outcome.status === 'enriched') {
          duplicateBooks.push({ id: outcome.id, title: book.title, author: book.author, enriched: outcome.status === 'enriched' });
        }
      } catch (err: any) {
        console.error(`❌ Unexpected error saving "${book.title}":`, err?.message);
        results.push({
          title: book.title,
          status: 'failed',
          error: err?.message || 'Database operation failed',
        });
      }
    }

    const insertedCount = results.filter(r => r.status === 'inserted').length;
    const enrichedCount = results.filter(r => r.status === 'enriched').length;
    const existingCount = results.filter(r => r.status === 'already_exists').length;
    const failedCount = results.filter(r => r.status === 'failed').length;

    console.log(`✅ Results: Inserted(${insertedCount}), Enriched(${enrichedCount}), Existed(${existingCount}), Failed(${failedCount})`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        booksSaved: insertedCount + enrichedCount,
        newlyInserted: insertedCount,
        enrichedCount,
        duplicatesFound: existingCount + enrichedCount,
        failedCount,
        results,
        books: savedBooks,
        duplicates: duplicateBooks,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('💥 Fatal error in save-selected-books:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unknown server error occurred' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * Validate and sanitize an incoming book object.
 * Enforces field lengths, types, and valid string shapes.
 */
function validateAndSanitizeBook(raw: IncomingBookPayload): ValidatedBook | null {
  if (!raw || typeof raw !== 'object') return null;

  const rawTitle = typeof raw.title === 'string' ? raw.title.trim() : '';
  if (!rawTitle || rawTitle.length < 1) return null;

  const title = rawTitle.slice(0, 300);

  const author = typeof raw.author === 'string' && raw.author.trim()
    ? raw.author.trim().slice(0, 200)
    : undefined;

  const genre = typeof raw.genre === 'string' && raw.genre.trim()
    ? raw.genre.trim().slice(0, 100)
    : undefined;

  let cover_image_url: string | undefined = undefined;
  if (typeof raw.cover_image_url === 'string') {
    const trimmed = raw.cover_image_url.trim();
    if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
      cover_image_url = trimmed.slice(0, 1000);
    }
  }

  const description = typeof raw.description === 'string' && raw.description.trim()
    ? raw.description.trim().slice(0, 10000)
    : undefined;

  const author_bio = typeof raw.author_bio === 'string' && raw.author_bio.trim()
    ? raw.author_bio.trim().slice(0, 2000)
    : undefined;

  let isbn: string | undefined = undefined;
  if (typeof raw.isbn === 'string') {
    const clean = raw.isbn.replace(/[-\s]/g, '').trim().toUpperCase();
    if (/^\d{9}[\dX]$/.test(clean) || /^\d{13}$/.test(clean)) {
      isbn = clean;
    }
  }

  let publication_year: number | undefined = undefined;
  if (typeof raw.publication_year === 'number' && Number.isInteger(raw.publication_year)) {
    if (raw.publication_year >= 1000 && raw.publication_year <= 2100) {
      publication_year = raw.publication_year;
    }
  } else if (typeof raw.publication_year === 'string') {
    const parsed = Number.Number.parseInt(raw.publication_year, 10);
    if (!Number.Number.isNaN(parsed) && parsed >= 1000 && parsed <= 2100) {
      publication_year = parsed;
    }
  }

  let pages: number | undefined = undefined;
  if (typeof raw.pages === 'number' && Number.isInteger(raw.pages) && raw.pages > 0 && raw.pages < 50000) {
    pages = raw.pages;
  } else if (typeof raw.pages === 'string') {
    const parsed = Number.Number.parseInt(raw.pages, 10);
    if (!Number.Number.isNaN(parsed) && parsed > 0 && parsed < 50000) {
      pages = parsed;
    }
  }

  const language = typeof raw.language === 'string' && raw.language.trim()
    ? raw.language.trim().slice(0, 50)
    : 'English';

  let pdf_url: string | undefined = undefined;
  if (typeof raw.pdf_url === 'string') {
    const trimmed = raw.pdf_url.trim();
    if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
      pdf_url = trimmed.slice(0, 1000);
    }
  }

  return {
    title,
    author,
    genre,
    cover_image_url,
    description,
    author_bio,
    isbn,
    publication_year,
    pages,
    language,
    pdf_url,
  };
}

/**
 * Check whether `status` column exists in the live database.
 */
async function probeHasStatusColumn(supabaseClient: any): Promise<boolean> {
  try {
    const { error } = await supabaseClient.from('books_library').select('status').limit(1);
    return !error;
  } catch {
    return false;
  }
}

function normalizeTitleKey(raw: string): string {
  if (!raw) return '';
  return raw
    .normalize('NFC')
    .replace(/[([][^()[\]]*[)\]]/g, '') // remove bracketed tags
    .split(/[:—–-]/)[0] // primary title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function normalizeAuthorKey(raw?: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (trimmed.includes(',')) {
    const parts = trimmed.split(',').map((p) => p.trim());
    if (parts.length === 2) {
      return `${parts[1]} ${parts[0]}`.toLowerCase().replace(/[^a-z0-9]/g, '');
    }
  }
  return trimmed.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Look up, enrich existing, or insert a single book safely.
 */
async function saveOrEnrichSingleBook(
  supabaseClient: any,
  book: ValidatedBook,
  hasStatusColumn: boolean
): Promise<BookSaveResult> {
  let existingBook: any = null;

  // 1. Match by verified ISBN
  if (book.isbn) {
    const { data: isbnMatches } = await supabaseClient
      .from('books_library')
      .select('*')
      .eq('isbn', book.isbn)
      .limit(1);

    if (isbnMatches && isbnMatches.length > 0) {
      existingBook = isbnMatches[0];
    }
  }

  // 2. Fallback: match by title and author
  if (!existingBook) {
    const normTitle = normalizeTitleKey(book.title);
    const normAuthor = normalizeAuthorKey(book.author);

    if (normTitle) {
      const { data: titleMatches } = await supabaseClient
        .from('books_library')
        .select('*')
        .ilike('title', book.title.trim())
        .limit(5);

      if (titleMatches && titleMatches.length > 0) {
        existingBook = titleMatches.find((candidate: any) => {
          const cAuthor = normalizeAuthorKey(candidate.author);
          if (!cAuthor || !normAuthor) return true;
          return cAuthor === normAuthor || cAuthor.includes(normAuthor) || normAuthor.includes(cAuthor);
        }) || titleMatches[0];
      }
    }
  }

  // 3. If existing book found, enrich missing fields
  if (existingBook) {
    const updates: Record<string, any> = {};
    const enrichedFields: string[] = [];

    if (!existingBook.cover_image_url && book.cover_image_url) {
      updates.cover_image_url = book.cover_image_url;
      enrichedFields.push('cover_image_url');
    }
    if (!existingBook.description && book.description) {
      updates.description = book.description;
      enrichedFields.push('description');
    }
    if (!existingBook.isbn && book.isbn) {
      updates.isbn = book.isbn;
      enrichedFields.push('isbn');
    }
    if (!existingBook.publication_year && book.publication_year) {
      updates.publication_year = book.publication_year;
      enrichedFields.push('publication_year');
    }
    if (!existingBook.pages && book.pages) {
      updates.pages = book.pages;
      enrichedFields.push('pages');
    }
    if (!existingBook.pdf_url && book.pdf_url) {
      updates.pdf_url = book.pdf_url;
      enrichedFields.push('pdf_url');
    }
    if (!existingBook.author_bio && book.author_bio) {
      updates.author_bio = book.author_bio;
      enrichedFields.push('author_bio');
    }
    if (!existingBook.genre && book.genre) {
      updates.genre = book.genre;
      enrichedFields.push('genre');
    }

    if (enrichedFields.length > 0) {
      const { error: updateError } = await supabaseClient
        .from('books_library')
        .update(updates)
        .eq('id', existingBook.id);

      if (updateError) {
        console.warn(`Enrichment failed for book ${existingBook.id}:`, updateError.message);
        return {
          title: book.title,
          status: 'already_exists',
          id: existingBook.id,
        };
      }

      console.log(`🔄 Enriched book "${book.title}" (${existingBook.id}) with [${enrichedFields.join(', ')}]`);
      return {
        title: book.title,
        status: 'enriched',
        id: existingBook.id,
        enrichedFields,
      };
    }

    return {
      title: book.title,
      status: 'already_exists',
      id: existingBook.id,
    };
  }

  // 4. Insert new record with verified existing schema columns
  const insertPayload: Record<string, any> = {
    title: book.title,
    author: book.author || null,
    genre: book.genre || null,
    cover_image_url: book.cover_image_url || null,
    description: book.description || null,
    author_bio: book.author_bio || null,
    isbn: book.isbn || null,
    publication_year: book.publication_year || null,
    pages: book.pages || null,
    language: book.language || 'English',
    pdf_url: book.pdf_url || null,
  };

  // Only include status column if it physically exists in the database
  if (hasStatusColumn) {
    insertPayload.status = 'active';
  }

  const { data: newRecord, error: insertError } = await supabaseClient
    .from('books_library')
    .insert(insertPayload)
    .select('id, title, author')
    .single();

  if (insertError) {
    console.error(`Error inserting "${book.title}":`, insertError);
    return {
      title: book.title,
      status: 'failed',
      error: insertError.message,
    };
  }

  console.log(`➕ Successfully inserted new catalog book: "${newRecord.title}" (ID: ${newRecord.id})`);
  return {
    title: book.title,
    status: 'inserted',
    id: newRecord.id,
  };
}