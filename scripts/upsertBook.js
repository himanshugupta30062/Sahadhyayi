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
    const { data, error } = await supabase
      .from('books')
      .upsert(
        {
          title: 'A Brief History of Time',
          author: 'Stephen Hawking',
          cover_url: `${SUPABASE_URL}/storage/v1/object/public/book-covers/9780857501004-jacket-large.webp`,
        },
        { onConflict: 'title' }
      )
      .select()
      .single();

    if (error) throw error;

    console.log('Upserted book:', data);
  } catch (error) {
    console.error('Error upserting book:', error);
  }
}

upsertBook();
