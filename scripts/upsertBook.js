import { createClient } from '@supabase/supabase-js';

// Load environment variables for Supabase credentials
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function upsertBook() {
  try {
    const { error } = await supabase
      .from('books')
      .upsert(
        {
          title: 'A Brief History of Time',
          author: 'Stephen Hawking',
          cover_url:
            'https://rknxtatvlzunatpyqxro.supabase.co/storage/v1/object/public/book-covers/9780857501004-jacket-large.webp',
        },
        { onConflict: 'title' }
      );

    if (error) throw error;

    // Avoid printing the returned database row, which may include fields
    // that should not be copied into CI logs.
    console.log('Book upsert completed successfully.');
  } catch (error) {
    // Keep database details and request metadata out of logs.
    const errorName =
      error instanceof Error && error.name ? error.name : 'UnknownError';
    console.error('Book upsert failed:', errorName);
    process.exitCode = 1;
  }
}

upsertBook();
