/**
 * Audit Book Covers in Sahadhyayi Catalog
 * Reads books from books_library and measures actual counts of stored, missing, and repairable covers.
 */

const SUPABASE_URL = 'https://rknxtatvlzunatpyqxro.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrbnh0YXR2bHp1bmF0cHlxeHJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MzI0MjUsImV4cCI6MjA2NTUwODQyNX0.NXIWEwm8NlvzHnxf55cgdsy1ljX2IbFKQL7OS8xlb-U';

async function fetchAllBooks() {
  const books = [];
  let offset = 0;
  const limit = 500;
  let hasMore = true;

  while (hasMore) {
    const url = `${SUPABASE_URL}/rest/v1/books_library?select=id,title,author,isbn,cover_image_url&offset=${offset}&limit=${limit}`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch books: ${res.statusText}`);
    }

    const data = await res.json();
    books.push(...data);
    offset += limit;
    hasMore = data.length === limit;
  }

  return books;
}

function isValidIsbn(raw) {
  if (!raw || typeof raw !== 'string') return false;
  const cleaned = raw.replace(/[^0-9X]/gi, '');
  return cleaned.length === 10 || cleaned.length === 13;
}

function hasUsableCover(raw) {
  if (!raw || typeof raw !== 'string') return false;
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return false;
  return trimmed.startsWith('http://') || trimmed.startsWith('https://');
}

async function audit() {
  console.log('Fetching catalog records from Supabase...');
  const books = await fetchAllBooks();
  const total = books.length;

  let storedCovers = 0;
  let missingCovers = 0;
  let missingWithValidIsbn = 0;
  let missingWithTitleAuthorOnly = 0;

  const repairCandidatesWithIsbn = [];

  for (const b of books) {
    if (hasUsableCover(b.cover_image_url)) {
      storedCovers++;
    } else {
      missingCovers++;
      if (isValidIsbn(b.isbn)) {
        missingWithValidIsbn++;
        repairCandidatesWithIsbn.push({
          id: b.id,
          title: b.title,
          author: b.author,
          isbn: b.isbn.replace(/[^0-9X]/gi, ''),
        });
      } else {
        missingWithTitleAuthorOnly++;
      }
    }
  }

  console.log('\n================ BOOK COVER AUDIT RESULTS ================');
  console.log(`Total catalog books:                  ${total}`);
  console.log(`Books with stored genuine covers:     ${storedCovers} (${((storedCovers / total) * 100).toFixed(1)}%)`);
  console.log(`Books missing covers:                 ${missingCovers} (${((missingCovers / total) * 100).toFixed(1)}%)`);
  console.log(`  - Repair candidates with valid ISBN: ${missingWithValidIsbn}`);
  console.log(`  - Candidates with Title+Author only: ${missingWithTitleAuthorOnly}`);
  console.log('==========================================================\n');

  if (repairCandidatesWithIsbn.length > 0) {
    console.log('Sample ISBN repair candidates:');
    repairCandidatesWithIsbn.slice(0, 5).forEach((c, idx) => {
      console.log(`  ${idx + 1}. "${c.title}" by ${c.author || 'Unknown'} (ISBN: ${c.isbn})`);
    });
  }
}

audit().catch(console.error);

