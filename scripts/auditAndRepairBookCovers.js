/**
 * Audit & Repair Book Covers in Sahadhyayi Catalog
 * Reads books from books_library, measures actual cover coverage, and optionally repairs missing covers.
 *
 * Usage:
 *   node scripts/auditAndRepairBookCovers.js audit
 *   node scripts/auditAndRepairBookCovers.js repair
 */

const SUPABASE_URL = 'https://rknxtatvlzunatpyqxro.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrbnh0YXR2bHp1bmF0cHlxeHJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MzI0MjUsImV4cCI6MjA2NTUwODQyNX0.NXIWEwm8NlvzHnxf55cgdsy1ljX2IbFKQL7OS8xlb-U';

async function fetchAllBooks() {
  const books = [];
  let offset = 0;
  const limit = 500;
  let hasMore = true;

  while (hasMore) {
    const url = `${SUPABASE_URL}/rest/v1/books_library?select=id,title,author,isbn,cover_image_url,pdf_url&offset=${offset}&limit=${limit}`;
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

function cleanTitleForMatch(title) {
  if (!title) return '';
  return title
    .replace(/\[.*?\]|\(.*?\)/g, '')
    .replace(/[^\w\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function isTitleMatch(targetTitle, candidateTitle) {
  if (!candidateTitle) return false;
  const target = cleanTitleForMatch(targetTitle);
  const candidate = cleanTitleForMatch(candidateTitle);
  if (!target || !candidate) return false;
  if (target === candidate || candidate.includes(target) || target.includes(candidate)) return true;

  const targetWords = target.split(/\s+/).filter((w) => w.length > 3);
  if (targetWords.length > 0) {
    const matchCount = targetWords.filter((w) => candidate.includes(w)).length;
    if (matchCount / targetWords.length >= 0.7) return true;
  }
  return false;
}

async function searchOpenLibraryCover(title, author, isbnRaw) {
  // 1. Try ISBN if valid
  if (isValidIsbn(isbnRaw)) {
    const isbn = isbnRaw.replace(/[^0-9X]/gi, '');
    const directUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;
    try {
      const res = await fetch(directUrl, { method: 'HEAD' });
      if (res.ok) return directUrl;
    } catch {}
  }

  // 2. Try Title + Author search
  const cleanTitle = cleanTitleForMatch(title);
  if (!cleanTitle || cleanTitle === 'untitled') return null;

  const cleanAuthor = author ? author.replace(/[^\w\s]/gi, ' ').trim() : '';
  const authorParam = cleanAuthor && !cleanAuthor.toLowerCase().includes('unknown')
    ? `&author=${encodeURIComponent(cleanAuthor)}`
    : '';

  try {
    const url = `https://openlibrary.org/search.json?title=${encodeURIComponent(cleanTitle)}${authorParam}&limit=5&fields=title,author_name,cover_i`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      let doc = data.docs?.find((d) => d.cover_i && isTitleMatch(title, d.title));

      if (!doc && authorParam) {
        // Fallback: search title only
        const fbRes = await fetch(`https://openlibrary.org/search.json?title=${encodeURIComponent(cleanTitle)}&limit=5&fields=title,author_name,cover_i`);
        if (fbRes.ok) {
          const fbData = await fbRes.json();
          doc = fbData.docs?.find((d) => d.cover_i && isTitleMatch(title, d.title));
        }
      }

      if (doc?.cover_i) {
        return `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
      }
    }
  } catch {}

  return null;
}

async function persistCoverRpc(bookId, coverUrl) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/repair_verified_book_cover`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        p_book_id: bookId,
        p_cover_image_url: coverUrl,
      }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data);
  } catch {
    return false;
  }
}

async function audit() {
  console.log('Fetching catalog records from Supabase...');
  const books = await fetchAllBooks();
  const total = books.length;

  let storedCovers = 0;
  let missingCovers = 0;
  let missingWithValidIsbn = 0;
  let missingWithTitleAuthorOnly = 0;

  for (const b of books) {
    if (hasUsableCover(b.cover_image_url)) {
      storedCovers++;
    } else {
      missingCovers++;
      if (isValidIsbn(b.isbn)) {
        missingWithValidIsbn++;
      } else {
        missingWithTitleAuthorOnly++;
      }
    }
  }

  console.log('\n================ BOOK COVER AUDIT RESULTS ================');
  console.log(`Total catalog books:                  ${total}`);
  console.log(`Books with stored genuine covers:     ${storedCovers} (${((storedCovers / total) * 100).toFixed(1)}%)`);
  console.log(`Books missing covers:                 ${missingCovers} (${((missingCovers / total) * 100).toFixed(1)}%)`);
  console.log(`  - Candidates with valid ISBN:       ${missingWithValidIsbn}`);
  console.log(`  - Candidates with Title+Author:     ${missingWithTitleAuthorOnly}`);
  console.log('==========================================================\n');
}

async function repair() {
  console.log('Fetching catalog records for cover repair...');
  const books = await fetchAllBooks();
  const missing = books.filter((b) => !hasUsableCover(b.cover_image_url));

  console.log(`Found ${missing.length} books lacking covers. Beginning discovery...`);

  let resolvedCount = 0;
  let persistedCount = 0;

  for (let i = 0; i < missing.length; i++) {
    const b = missing[i];
    const coverUrl = await searchOpenLibraryCover(b.title, b.author, b.isbn);

    if (coverUrl) {
      resolvedCount++;
      const persisted = await persistCoverRpc(b.id, coverUrl);
      if (persisted) persistedCount++;

      console.log(`[${i + 1}/${missing.length}] Resolved: "${b.title}" -> ${coverUrl} (DB Persisted: ${persisted})`);
    }

    // Rate-limiting delay to respect Open Library API guidelines (approx. 500ms)
    await new Promise((r) => setTimeout(r, 400));
  }

  console.log(`\n================ REPAIR SUMMARY ================`);
  console.log(`Total missing evaluated: ${missing.length}`);
  console.log(`Covers resolved online:  ${resolvedCount}`);
  console.log(`Covers saved to DB:      ${persistedCount}`);
  console.log(`================================================\n`);
}

const mode = process.argv[2] || 'audit';
if (mode === 'repair') {
  repair().catch(console.error);
} else {
  audit().catch(console.error);
}
