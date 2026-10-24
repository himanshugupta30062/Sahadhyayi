import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export type AccessType = 'full_download' | 'official_reader' | 'preview' | 'borrow' | 'metadata_only';

export interface BookData {
  id?: string;
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
  epub_url?: string;
  reader_url?: string;
  preview_url?: string;
  source?: string;
  access_type?: AccessType;
  formats?: string[];
  provider_id?: string;
}

interface ProviderMetric {
  count: number;
  latencyMs: number;
  status: 'ok' | 'failed' | 'timeout' | 'empty';
  error?: string;
}

// In-memory query cache with 5-minute TTL
const searchCache = new Map<string, { data: any; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 200;

function getCached(key: string) {
  const entry = searchCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    searchCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: any) {
  if (searchCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = searchCache.keys().next().value;
    if (oldestKey) searchCache.delete(oldestKey);
  }
  searchCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { searchTerm } = await req.json()
    
    if (!searchTerm || typeof searchTerm !== 'string' || !searchTerm.trim()) {
      return new Response(
        JSON.stringify({ error: 'Search term is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const cleanQuery = searchTerm.trim();
    const cacheKey = cleanQuery.toLowerCase();

    // Check cache
    const cachedResponse = getCached(cacheKey);
    if (cachedResponse) {
      return new Response(
        JSON.stringify({ ...cachedResponse, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔍 Book Search Preview for:', cleanQuery)

    // Execute provider requests concurrently with individual 4000ms timeouts using Promise.allSettled
    const providers = [
      { name: 'openLibrary', fn: () => searchOpenLibrary(cleanQuery) },
      { name: 'googleBooks', fn: () => searchGoogleBooks(cleanQuery) },
      { name: 'gutenberg', fn: () => searchProjectGutenberg(cleanQuery) },
      { name: 'internetArchive', fn: () => searchInternetArchive(cleanQuery) },
      { name: 'standardEbooks', fn: () => searchStandardEbooks(cleanQuery) },
      { name: 'openAlex', fn: () => searchOpenAlex(cleanQuery) },
      { name: 'wikisource', fn: () => searchWikisource(cleanQuery) },
    ];

    const metrics: Record<string, ProviderMetric> = {};

    const settledResults = await Promise.allSettled(
      providers.map(async (p) => {
        const start = Date.now();
        try {
          const books = await p.fn();
          const latencyMs = Date.now() - start;
          metrics[p.name] = {
            count: books.length,
            latencyMs,
            status: books.length > 0 ? 'ok' : 'empty',
          };
          return books;
        } catch (err: any) {
          const latencyMs = Date.now() - start;
          const isTimeout = err?.name === 'TimeoutError' || err?.name === 'AbortError' || latencyMs >= 3900;
          metrics[p.name] = {
            count: 0,
            latencyMs,
            status: isTimeout ? 'timeout' : 'failed',
            error: err?.message || 'Provider request failed',
          };
          console.warn(`Provider ${p.name} failed (${latencyMs}ms):`, err?.message);
          return [] as BookData[];
        }
      })
    );

    const openLibraryBooks = settledResults[0].status === 'fulfilled' ? settledResults[0].value : [];
    const googleBooksData = settledResults[1].status === 'fulfilled' ? settledResults[1].value : [];
    const gutenbergBooks = settledResults[2].status === 'fulfilled' ? settledResults[2].value : [];
    const archiveBooks = settledResults[3].status === 'fulfilled' ? settledResults[3].value : [];
    const standardEbooks = settledResults[4].status === 'fulfilled' ? settledResults[4].value : [];
    const openAlexBooks = settledResults[5].status === 'fulfilled' ? settledResults[5].value : [];
    const wikisourceBooks = settledResults[6].status === 'fulfilled' ? settledResults[6].value : [];

    // Merge book data across providers without saving
    const mergedBooks = mergeBookData(
      openLibraryBooks,
      googleBooksData,
      gutenbergBooks,
      archiveBooks,
      standardEbooks,
      openAlexBooks,
      wikisourceBooks
    );

    const responsePayload = {
      success: true,
      booksFound: mergedBooks.length,
      books: mergedBooks,
      sources: {
        openLibrary: metrics.openLibrary?.count || 0,
        googleBooks: metrics.googleBooks?.count || 0,
        gutenberg: metrics.gutenberg?.count || 0,
        archive: metrics.internetArchive?.count || 0,
        standardEbooks: metrics.standardEbooks?.count || 0,
        openAlex: metrics.openAlex?.count || 0,
        wikisource: metrics.wikisource?.count || 0,
      },
      metrics,
    };

    setCache(cacheKey, responsePayload);

    return new Response(
      JSON.stringify(responsePayload),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💥 Error in book search preview:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Safe fetch with AbortSignal timeout
async function fetchWithTimeout(url: string, timeoutMs = 4000, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function searchOpenLibrary(searchTerm: string): Promise<BookData[]> {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(searchTerm)}&limit=30`
  const response = await fetchWithTimeout(url, 4000);
  if (!response.ok) return [];
  const data = await response.json();

  if (!data.docs || !Array.isArray(data.docs)) return [];

  return data.docs
    .map((book: any) => {
      const isbn = Array.isArray(book.isbn) ? book.isbn[0] : book.isbn;
      const coverUrl = book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg` : undefined;
      const author = Array.isArray(book.author_name) ? book.author_name[0] : book.author_name;
      const genre = Array.isArray(book.subject) ? book.subject[0] : book.subject;
      const year = book.first_publish_year || (book.publish_year ? book.publish_year[0] : undefined);

      return {
        title: (book.title || '').trim(),
        author: author ? String(author).trim() : undefined,
        genre: genre ? String(genre).trim() : undefined,
        cover_image_url: coverUrl,
        publication_year: typeof year === 'number' ? year : undefined,
        pages: book.number_of_pages_median || undefined,
        language: Array.isArray(book.language) ? (book.language[0] === 'eng' ? 'English' : book.language[0]) : 'English',
        isbn: isbn ? String(isbn).trim() : undefined,
        source: 'open_library',
        access_type: 'metadata_only' as AccessType,
        formats: [],
        provider_id: book.key ? `openlibrary:${book.key}` : undefined,
      };
    })
    .filter((b: BookData) => b.title && b.title !== 'Unknown Title');
}

async function searchGoogleBooks(searchTerm: string): Promise<BookData[]> {
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchTerm)}&maxResults=30`;
  const response = await fetchWithTimeout(url, 4000);
  if (!response.ok) return [];
  const data = await response.json();

  if (!data.items || !Array.isArray(data.items)) return [];

  return data.items
    .map((item: any) => {
      const info = item.volumeInfo || {};
      const access = item.accessInfo || {};
      const isbnObj = info.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13' || id.type === 'ISBN_10');
      const isPdfDownload = Boolean(access.pdf?.isAvailable && access.pdf?.downloadLink);
      const isEpubDownload = Boolean(access.epub?.isAvailable && access.epub?.downloadLink);
      const coverUrl = info.imageLinks?.thumbnail?.replace('http:', 'https:') || info.imageLinks?.smallThumbnail?.replace('http:', 'https:');

      const formats: string[] = [];
      if (isPdfDownload) formats.push('pdf');
      if (isEpubDownload) formats.push('epub');
      if (info.previewLink) formats.push('web_preview');

      return {
        title: (info.title || '').trim(),
        author: Array.isArray(info.authors) ? info.authors[0] : info.authors,
        genre: Array.isArray(info.categories) ? info.categories[0] : info.categories,
        cover_image_url: coverUrl,
        description: info.description,
        isbn: isbnObj?.identifier,
        publication_year: info.publishedDate ? Number.parseInt(info.publishedDate.split('-')[0]) : undefined,
        pages: info.pageCount,
        language: info.language === 'en' ? 'English' : info.language,
        // Crucial fix: DO NOT represent preview URLs as direct downloadable PDFs
        pdf_url: isPdfDownload ? access.pdf.downloadLink : undefined,
        epub_url: isEpubDownload ? access.epub.downloadLink : undefined,
        preview_url: info.previewLink,
        source: 'google_books',
        access_type: (isPdfDownload || isEpubDownload ? 'full_download' : info.previewLink ? 'preview' : 'metadata_only') as AccessType,
        formats,
        provider_id: item.id ? `googlebooks:${item.id}` : undefined,
      };
    })
    .filter((b: BookData) => b.title && b.title !== 'Unknown Title');
}

async function searchProjectGutenberg(searchTerm: string): Promise<BookData[]> {
  const url = `https://gutendex.com/books?search=${encodeURIComponent(searchTerm)}`;
  const response = await fetchWithTimeout(url, 4000);
  if (!response.ok) return [];
  const data = await response.json();

  if (!data.results || !Array.isArray(data.results)) return [];

  return data.results
    .slice(0, 25)
    .map((book: any) => {
      const formatsObj = book.formats || {};
      const pdf = formatsObj['application/pdf'] || formatsObj['text/pdf'];
      const epub = formatsObj['application/epub+zip'];
      const html = formatsObj['text/html'] || formatsObj['text/html; charset=utf-8'];
      const cover = formatsObj['image/jpeg'] || formatsObj['image/png'];

      const availableFormats: string[] = [];
      if (pdf) availableFormats.push('pdf');
      if (epub) availableFormats.push('epub');
      if (html) availableFormats.push('html');

      return {
        title: (book.title || '').trim(),
        author: book.authors?.[0]?.name ? normalizeGutenbergAuthor(book.authors[0].name) : undefined,
        genre: book.subjects?.[0],
        cover_image_url: cover,
        description: undefined,
        publication_year: book.authors?.[0]?.death_year ? Number.parseInt(book.authors[0].death_year) - 40 : undefined,
        language: book.languages?.[0] === 'en' ? 'English' : book.languages?.[0],
        pdf_url: pdf,
        epub_url: epub,
        reader_url: html,
        source: 'gutenberg',
        access_type: 'full_download' as AccessType,
        formats: availableFormats,
        provider_id: book.id ? `gutenberg:${book.id}` : undefined,
      };
    })
    // Crucial fix: DO NOT filter out Gutenberg records merely because they lack a PDF link
    // Gutenberg works with EPUB or HTML reader formats are valid open texts!
    .filter((b: BookData) => b.title && b.title !== 'Unknown Title' && (b.pdf_url || b.epub_url || b.reader_url));
}

function normalizeGutenbergAuthor(raw: string): string {
  if (!raw) return '';
  if (raw.includes(',')) {
    const parts = raw.split(',').map((p) => p.trim());
    if (parts.length === 2) return `${parts[1]} ${parts[0]}`;
  }
  return raw.trim();
}

async function searchInternetArchive(searchTerm: string): Promise<BookData[]> {
  const url = `https://archive.org/advancedsearch.php?q=title:(${encodeURIComponent(searchTerm)}) AND mediatype:texts&fl=identifier,title,creator,date,description,format,publicdate&rows=20&output=json`;
  const response = await fetchWithTimeout(url, 4000);
  if (!response.ok) return [];
  const data = await response.json();

  if (!data.response?.docs || !Array.isArray(data.response.docs)) return [];

  return data.response.docs
    .map((item: any) => {
      const id = item.identifier;
      const formats: string[] = Array.isArray(item.format) ? item.format : item.format ? [item.format] : [];
      const hasTextPdf = formats.some((f: string) => f.toLowerCase().includes('text pdf') || f.toLowerCase() === 'pdf');
      const hasEpub = formats.some((f: string) => f.toLowerCase().includes('epub'));

      const availableFormats: string[] = [];
      if (hasTextPdf) availableFormats.push('pdf');
      if (hasEpub) availableFormats.push('epub');
      availableFormats.push('web_reader');

      // Crucial fix: DO NOT fabricate arbitrary .pdf links that 404
      // Use clean verified stream/reader and details URLs
      const readerUrl = id ? `https://archive.org/details/${id}` : undefined;
      const coverUrl = id ? `https://archive.org/services/img/${id}` : undefined;

      return {
        title: (item.title || '').trim(),
        author: Array.isArray(item.creator) ? item.creator[0] : item.creator,
        genre: undefined,
        cover_image_url: coverUrl,
        description: Array.isArray(item.description) ? item.description[0] : item.description,
        publication_year: item.date ? Number.parseInt(item.date.split('-')[0]) : undefined,
        language: 'English',
        reader_url: readerUrl,
        source: 'internet_archive',
        access_type: (hasTextPdf || hasEpub ? 'full_download' : 'borrow') as AccessType,
        formats: availableFormats,
        provider_id: id ? `archive:${id}` : undefined,
      };
    })
    .filter((b: BookData) => b.title && b.title !== 'Unknown Title');
}

async function searchStandardEbooks(searchTerm: string): Promise<BookData[]> {
  const url = `https://standardebooks.org/opds/all?query=${encodeURIComponent(searchTerm)}`;
  const response = await fetchWithTimeout(url, 4000);
  if (!response.ok) return [];
  const xml = await response.text();

  if (!xml || !xml.includes('<entry>')) return [];

  const entries = xml.split('<entry>').slice(1);
  const results: BookData[] = [];

  for (const rawEntry of entries.slice(0, 15)) {
    const entry = rawEntry.split('</entry>')[0];
    const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
    const authorMatch = entry.match(/<author>\s*<name>([^<]+)<\/name>/);
    const coverMatch = entry.match(/href="([^"]+downloads\/cover\.(?:jpg|png))"/);
    const epubMatch = entry.match(/href="([^"]+\.epub)"/);
    const summaryMatch = entry.match(/<summary[^>]*>([^<]+)<\/summary>/);
    const publishedMatch = entry.match(/<published>(\d{4})/);

    const title = titleMatch ? titleMatch[1].trim() : '';
    if (!title) continue;

    results.push({
      title,
      author: authorMatch ? authorMatch[1].trim() : undefined,
      genre: 'Classic Literature',
      cover_image_url: coverMatch ? coverMatch[1] : undefined,
      description: summaryMatch ? summaryMatch[1].trim() : undefined,
      epub_url: epubMatch ? epubMatch[1] : undefined,
      publication_year: publishedMatch ? Number.parseInt(publishedMatch[1]) : undefined,
      language: 'English',
      source: 'standard_ebooks',
      access_type: 'full_download' as AccessType,
      formats: ['epub'],
      provider_id: `standardebooks:${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    });
  }

  return results;
}

async function searchOpenAlex(searchTerm: string): Promise<BookData[]> {
  // Query only works of type 'book' to keep research articles distinct from books
  const url = `https://api.openalex.org/works?search=${encodeURIComponent(searchTerm)}&filter=type:book&per-page=15`;
  const response = await fetchWithTimeout(url, 4000);
  if (!response.ok) return [];
  const data = await response.json();

  if (!data.results || !Array.isArray(data.results)) return [];

  return data.results
    .map((item: any) => {
      const authors = item.authorships?.map((a: any) => a.author?.display_name).filter(Boolean);
      const isOa = Boolean(item.open_access?.is_oa);
      const oaUrl = item.open_access?.oa_url || item.best_oa_location?.landing_page_url;
      const pdfUrl = item.best_oa_location?.pdf_url;

      const formats: string[] = [];
      if (pdfUrl) formats.push('pdf');
      if (oaUrl) formats.push('open_access');

      return {
        title: (item.display_name || '').trim(),
        author: authors?.[0],
        genre: item.concepts?.[0]?.display_name || 'Nonfiction',
        description: undefined,
        publication_year: item.publication_year,
        language: item.language || 'English',
        pdf_url: pdfUrl,
        reader_url: oaUrl,
        isbn: item.ids?.isbn ? (Array.isArray(item.ids.isbn) ? item.ids.isbn[0] : item.ids.isbn) : undefined,
        source: 'openalex',
        access_type: (pdfUrl ? 'full_download' : oaUrl ? 'official_reader' : 'metadata_only') as AccessType,
        formats,
        provider_id: item.id ? `openalex:${item.id.replace('https://openalex.org/', '')}` : undefined,
      };
    })
    .filter((b: BookData) => b.title && b.title !== 'Unknown Title');
}

async function searchWikisource(searchTerm: string): Promise<BookData[]> {
  const url = `https://en.wikisource.org/w/api.php?action=opensearch&search=${encodeURIComponent(searchTerm)}&limit=10&namespace=0&format=json`;
  const response = await fetchWithTimeout(url, 4000);
  if (!response.ok) return [];
  const data = await response.json();

  if (!Array.isArray(data) || data.length < 4) return [];

  const titles = data[1] || [];
  const descriptions = data[2] || [];
  const urls = data[3] || [];

  const results: BookData[] = [];
  for (let i = 0; i < titles.length; i++) {
    const title = (titles[i] || '').trim();
    const readerUrl = urls[i];
    if (!title || !readerUrl) continue;

    results.push({
      title,
      description: descriptions[i] || undefined,
      reader_url: readerUrl,
      source: 'wikisource',
      access_type: 'official_reader' as AccessType,
      formats: ['html'],
      language: 'English',
      provider_id: `wikisource:${encodeURIComponent(title)}`,
    });
  }

  return results;
}

function mergeBookData(
  openLibraryBooks: BookData[], 
  googleBooksData: BookData[], 
  gutenbergBooks: BookData[], 
  archiveBooks: BookData[],
  standardEbooks: BookData[],
  openAlexBooks: BookData[],
  wikisourceBooks: BookData[]
): BookData[] {
  const allBooks = [
    ...standardEbooks,   // High priority: beautiful full public domain EPUBs
    ...gutenbergBooks,   // High priority: verified full texts
    ...openLibraryBooks, // High priority: comprehensive metadata
    ...googleBooksData,  // High priority: cover images, previews
    ...openAlexBooks,    // Academic open books
    ...archiveBooks,     // Archive scans
    ...wikisourceBooks,  // Public domain transcriptions
  ];

  const mergedMap = new Map<string, BookData>();

  for (const book of allBooks) {
    const normTitle = (book.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const normAuthor = (book.author || 'unknown').toLowerCase().replace(/[^a-z0-9]/g, '');
    const key = book.isbn ? `isbn:${book.isbn.replace(/[^0-9X]/gi, '').toUpperCase()}` : `${normTitle}-${normAuthor}`;
    
    if (mergedMap.has(key)) {
      const existing = mergedMap.get(key)!;
      mergedMap.set(key, {
        title: existing.title || book.title,
        author: existing.author || book.author,
        genre: existing.genre || book.genre,
        cover_image_url: existing.cover_image_url || book.cover_image_url,
        description: (existing.description && existing.description.length > (book.description?.length || 0)) ? existing.description : (book.description || existing.description),
        author_bio: existing.author_bio || book.author_bio,
        isbn: existing.isbn || book.isbn,
        publication_year: existing.publication_year || book.publication_year,
        pages: existing.pages || book.pages,
        language: existing.language || book.language,
        pdf_url: existing.pdf_url || book.pdf_url,
        epub_url: existing.epub_url || book.epub_url,
        reader_url: existing.reader_url || book.reader_url,
        preview_url: existing.preview_url || book.preview_url,
        source: existing.source || book.source,
        access_type: existing.access_type === 'full_download' ? 'full_download' : (book.access_type === 'full_download' ? 'full_download' : existing.access_type || book.access_type),
        formats: Array.from(new Set([...(existing.formats || []), ...(book.formats || [])])),
        provider_id: existing.provider_id || book.provider_id,
      });
    } else {
      mergedMap.set(key, { ...book });
    }
  }

  return Array.from(mergedMap.values());
}