import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

async function main() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(url, key);

  const books = [
    { title: 'India After Gandhi', author: 'Ramachandra Guha', genre: 'History' },
    { title: 'The White Tiger', author: 'Aravind Adiga', genre: 'Fiction' },
  ];

  for (const b of books) {
    await supabase.from('books_library').upsert(b, { onConflict: 'title' });
  }
  console.log('Seed complete');
}

main().catch(e => { console.error(e); process.exit(1); });
