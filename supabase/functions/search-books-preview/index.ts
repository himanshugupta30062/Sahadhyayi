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
      { name: 'oapen', fn: () => searchOapen(cleanQuery) },
      { name: 'doab', fn: () => searchDoab(cleanQuery) },
      { name: 'openTextbookLibrary', fn: () => searchOpenTextbookLibrary(cleanQuery) },
      { name: 'openStax', fn: () => searchOpenStax(cleanQuery) },
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
    const oapenBooks = settledResults[7].status === 'fulfilled' ? settledResults[7].value : [];
    const doabBooks = settledResults[8].status === 'fulfilled' ? settledResults[8].value : [];
    const openTextbookLibraryBooks = settledResults[9].status === 'fulfilled' ? settledResults[9].value : [];
    const openStaxBooks = settledResults[10].status === 'fulfilled' ? settledResults[10].value : [];

    // Merge book data across providers without saving
    const mergedBooks = mergeBookData(
      openLibraryBooks,
      googleBooksData,
      gutenbergBooks,
      archiveBooks,
      standardEbooks,
      openAlexBooks,
      oapenBooks,
      doabBooks,
      openTextbookLibraryBooks,
      openStaxBooks,
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
        oapen: metrics.oapen?.count || 0,
        doab: metrics.doab?.count || 0,
        openTextbookLibrary: metrics.openTextbookLibrary?.count || 0,
        openStax: metrics.openStax?.count || 0,
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
      // Google only exposes a true full-book PDF when all pages are viewable and the access status is FULL.
      const isPdfDownload = Boolean(access.pdf?.isAvailable && access.pdf?.downloadLink && info.accessViewStatus === 'FULL' && access.viewability === 'ALL_PAGES');
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
        publication_year: book.authors?.[0]?.death_year ? Number.Number.parseInt(book.authors[0].death_year) - 40 : undefined,
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

  return await Promise.all(data.response.docs
    .map(async (item: any) => {
      const id = item.identifier;
      const formats: string[] = Array.isArray(item.format) ? item.format : item.format ? [item.format] : [];
      const hasTextPdf = formats.some((f: string) => f.toLowerCase().includes('text pdf') || f.toLowerCase() === 'pdf');
      const hasEpub = formats.some((f: string) => f.toLowerCase().includes('epub'));
      const pdfUrl = id ? await getPublicArchivePdfUrl(id) : undefined;

      const availableFormats: string[] = [];
      if (pdfUrl) availableFormats.push('pdf');
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
        publication_year: item.date ? Number.Number.parseInt(item.date.split('-')[0]) : undefined,
        language: 'English',
        pdf_url: pdfUrl,
        reader_url: readerUrl,
        source: 'internet_archive',
        access_type: (pdfUrl || hasEpub ? 'full_download' : 'borrow') as AccessType,
        formats: availableFormats,
        provider_id: id ? `archive:${id}` : undefined,
      };
    })
    .filter((b: BookData) => b.title && b.title !== 'Unknown Title'));
}

async function getPublicArchivePdfUrl(identifier: string): Promise<string | undefined> {
  try {
    const response = await fetchWithTimeout(`https://archive.org/metadata/${encodeURIComponent(identifier)}`, 3500);
    if (!response.ok) return undefined;
    const item = await response.json();
    const files = Array.isArray(item.files) ? item.files : [];
    const pdf = files.find((file: any) =>
      typeof file.name === 'string' && file.name.toLowerCase().endsWith('.pdf') &&
      file.private !== 'true' && file.private !== true &&
      !file.name.toLowerCase().includes('_text.pdf')
    );
    if (!pdf || item.metadata?.access === 'restricted' || item.metadata?.is_dark === true || item.metadata?.is_dark === 'true' || item.metadata?.is_private === true || item.metadata?.is_private === 'true') return undefined;
    const encodedPath = pdf.name.split('/').map(encodeURIComponent).join('/');
    return `https://archive.org/download/${encodeURIComponent(identifier)}/${encodedPath}`;
  } catch {
    return undefined;
  }
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
    const coverMatch = entry.match(/href="([^"\s]+downloads\/cover\.(?:jpg|png))"/);
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
      publication_year: publishedMatch ? Number.Number.parseInt(publishedMatch[1]) : undefined,
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


// OAPEN is a repository (not just a metadata index) and exposes bitstreams via its
// documented REST API. Only an actual PDF bitstream is returned as pdf_url.
async function searchOapen(searchTerm: string): Promise<BookData[]> {
  const url = `https://library.oapen.org/rest/search?query=${encodeURIComponent(searchTerm)}&expand=metadata,bitstreams&limit=15`;
  const response = await fetchWithTimeout(url, 4500, { headers: { Accept: 'application/json' } });
  if (!response.ok) return [];
  const payload = await response.json();
  const items = payload?.searchResults?.items || payload?.items || payload?.results || [];
  if (!Array.isArray(items)) return [];

  const metadataValue = (metadata: any, key: string): string | undefined => {
    const value = metadata?.[key];
    if (Array.isArray(value)) return value[0]?.value || value[0];
    return typeof value === 'string' ? value : value?.value;
  };

  return items.slice(0, 15).map((item: any) => {
    const metadata = item.metadata || item;
    const bitstreams = item.bitstreams || item.expand?.bitstreams || [];
    const pdf = Array.isArray(bitstreams) ? bitstreams.find((file: any) =>
      (file.name || file.bundleName || '').toLowerCase().endsWith('.pdf') &&
      (file.bundleName === 'ORIGINAL' || file.bundle === 'ORIGINAL' || !file.bundleName)
    ) : undefined;
    const handle = item.handle || metadataValue(metadata, 'dc.identifier.uri') || metadataValue(metadata, 'dc.identifier');
    const pdfUrl = pdf?.retrieveLink || pdf?.link || pdf?.url ||
      (pdf?.uuid ? `https://library.oapen.org/bitstream/${handle}/${encodeURIComponent(pdf.name || '')}` : undefined);
    const title = metadataValue(metadata, 'dc.title') || item.name || item.title;
    const author = metadataValue(metadata, 'dc.contributor.author') || metadataValue(metadata, 'dc.creator');
    const year = metadataValue(metadata, 'dc.date.issued');
    const license = metadataValue(metadata, 'dc.rights') || metadataValue(metadata, 'dc.rights.uri');
    const itemUrl = handle ? (String(handle).startsWith('http') ? handle : `https://library.oapen.org/handle/${handle}`) : undefined;
    return {
      title: String(title || '').trim(),
      author: author ? String(author).trim() : undefined,
      description: metadataValue(metadata, 'dc.description.abstract'),
      publication_year: year ? Number.parseInt(String(year).slice(0, 4), 10) : undefined,
      language: metadataValue(metadata, 'dc.language') || 'English',
      pdf_url: pdfUrl,
      reader_url: itemUrl,
      source: 'oapen',
      access_type: pdfUrl ? 'full_download' as AccessType : itemUrl ? 'official_reader' as AccessType : 'metadata_only' as AccessType,
      formats: pdfUrl ? ['pdf'] : itemUrl ? ['reader'] : [],
      provider_id: handle ? `oapen:${String(handle).split('/').pop() || ''}` : undefined,
      // OAPEN exposes license metadata; retain it in description for transparent attribution.
      ...(license ? { genre: `License: ${license}` } : {}),
    };
  }).filter((book: BookData) => book.title);
}


// DOAB's documented DSpace REST API indexes peer-reviewed open-access books.
// Only ORIGINAL PDF bitstreams are offered as direct downloads.
async function searchDoab(searchTerm: string): Promise<BookData[]> {
  const url = `https://directory.doabooks.org/rest/search?query=${encodeURIComponent(searchTerm)}&expand=metadata,bitstreams&limit=15`;
  const response = await fetchWithTimeout(url, 4500, { headers: { Accept: 'application/json' } });
  if (!response.ok) return [];
  const payload = await response.json();
  const items = payload?.searchResults?.items || payload?.items || payload?.results || [];
  if (!Array.isArray(items)) return [];

  const metadataValue = (metadata: any, key: string): string | undefined => {
    const value = metadata?.[key];
    if (Array.isArray(value)) return value[0]?.value || value[0];
    return typeof value === 'string' ? value : value?.value;
  };

  return items.slice(0, 15).map((item: any) => {
    const metadata = item.metadata || item;
    const bitstreams = item.bitstreams || item.expand?.bitstreams || [];
    const pdf = Array.isArray(bitstreams) ? bitstreams.find((file: any) =>
      (file.name || file.bundleName || '').toLowerCase().endsWith('.pdf') &&
      (file.bundleName === 'ORIGINAL' || file.bundle === 'ORIGINAL' || !file.bundleName)
    ) : undefined;
    const handle = item.handle || metadataValue(metadata, 'dc.identifier.uri') || metadataValue(metadata, 'dc.identifier');
    const pdfUrl = pdf?.retrieveLink || pdf?.link || pdf?.url ||
      (pdf?.uuid && handle ? `https://directory.doabooks.org/bitstream/${handle}/${encodeURIComponent(pdf.name || '')}` : undefined);
    const title = metadataValue(metadata, 'dc.title') || item.name || item.title;
    const author = metadataValue(metadata, 'dc.contributor.author') || metadataValue(metadata, 'dc.creator');
    const year = metadataValue(metadata, 'dc.date.issued');
    const license = metadataValue(metadata, 'dc.rights') || metadataValue(metadata, 'dc.rights.uri');
    const itemUrl = handle ? (String(handle).startsWith('http') ? handle : `https://directory.doabooks.org/handle/${handle}`) : undefined;
    return {
      title: String(title || '').trim(),
      author: author ? String(author).trim() : undefined,
      description: metadataValue(metadata, 'dc.description.abstract'),
      publication_year: year ? Number.parseInt(String(year).slice(0, 4), 10) : undefined,
      language: metadataValue(metadata, 'dc.language') || 'English',
      pdf_url: pdfUrl,
      reader_url: itemUrl,
      source: 'doab',
      access_type: pdfUrl ? 'full_download' as AccessType : itemUrl ? 'official_reader' as AccessType : 'metadata_only',
      formats: pdfUrl ? ['pdf'] : itemUrl ? ['reader'] : [],
      provider_id: handle ? `doab:${String(handle).split('/').pop() || ''}` : undefined,
      ...(license ? { genre: `License: ${license}` } : {}),
    };
  }).filter((book: BookData) => book.title);
}


// Open Textbook Library (University of Minnesota) provides a public JSON search API.
// Search metadata is CC0; each textbook's own license remains attached in its record.
async function searchOpenTextbookLibrary(searchTerm: string): Promise<BookData[]> {
  const url = `https://open.umn.edu/opentextbooks/textbooks.json?term=${encodeURIComponent(searchTerm)}&page=1`;
  const response = await fetchWithTimeout(url, 4500, { headers: { Accept: 'application/json' } });
  if (!response.ok) return [];
  const payload = await response.json();
  const items = payload?.textbooks || payload?.results || payload?.data || (Array.isArray(payload) ? payload : []);
  if (!Array.isArray(items)) return [];
  return items.slice(0, 20).map((item: any) => {
    const title = item.title || item.name;
    const authors = item.authors || item.author;
    const author = Array.isArray(authors) ? authors.map((a: any) => typeof a === 'string' ? a : a.name || a.full_name).filter(Boolean).join(', ') : authors;
    const formats = item.formats || item.links || {};
    const pdf = item.pdf || item.pdf_url || item.download_url || (Array.isArray(formats) ? formats.find((f: any) => String(f.format || f.type).toLowerCase().includes('pdf'))?.url : formats.PDF || formats.pdf);
    const online = item.url || item.book_url || item.href || item.front_matter_url;
    const license = item.license || item.licenses || item.license_name;
    return {
      title: String(title || '').trim(), author: author ? String(author) : undefined,
      description: item.description || item.summary, publication_year: Number.parseInt(String(item.publication_year || item.year || '').slice(0, 4), 10) || undefined,
      language: item.language || 'English', pdf_url: typeof pdf === 'string' ? pdf : undefined,
      reader_url: typeof online === 'string' ? online : undefined, source: 'open_textbook_library',
      access_type: pdf ? 'full_download' as AccessType : online ? 'official_reader' as AccessType : 'metadata_only' as AccessType,
      formats: pdf ? ['pdf'] : online ? ['reader'] : [], provider_id: item.id ? `otl:${item.id}` : item.slug ? `otl:${item.slug}` : undefined,
      ...(license ? { genre: `License: ${Array.isArray(license) ? license.join(', ') : license}` } : {}),
    };
  }).filter((b: BookData) => b.title);
}

// OpenStax's public CMS catalog API supplies the official textbook slugs and metadata.
// OpenStax confirms every catalog title has a free online version and PDF on its details page.
async function searchOpenStax(searchTerm: string): Promise<BookData[]> {
  const response = await fetchWithTimeout('https://openstax.org/apps/cms/api/books/?format=json', 4500, { headers: { Accept: 'application/json' } });
  if (!response.ok) return [];
  const payload = await response.json();
  const items = payload?.books || payload?.results || payload?.items || (Array.isArray(payload) ? payload : []);
  if (!Array.isArray(items)) return [];
  const q = searchTerm.toLowerCase();
  return items.filter((item: any) => {
    const title = String(item.title || item.name || item.book_title || '');
    const slug = String(item.slug || item.path || item.url || '');
    const subjects = Array.isArray(item.subjects) ? item.subjects.join(' ') : String(item.subject || item.category || '');
    return (title + ' ' + slug + ' ' + subjects).toLowerCase().includes(q) ||
      q.split(/\s+/).every((word: string) => (title + ' ' + slug + ' ' + subjects).toLowerCase().includes(word));
  }).slice(0, 20).map((item: any) => {
    const rawSlug = String(item.slug || item.path || item.url || '');
    const booksIdx = rawSlug.indexOf('/books/');
    let slug = booksIdx !== -1 ? rawSlug.slice(booksIdx + 7) : rawSlug;
    while (slug.startsWith('/')) slug = slug.slice(1);
    while (slug.endsWith('/')) slug = slug.slice(0, -1);
    const title = item.title || item.name || item.book_title;
    const reader = slug ? `https://openstax.org/books/${slug}` : (typeof item.url === 'string' ? item.url : undefined);
    const pdf = item.pdf_url || item.pdf || (slug ? `https://openstax.org/books/${slug}/pages/preface` : undefined);
    return {
      title: String(title || '').trim(), author: Array.isArray(item.authors) ? item.authors.join(', ') : item.author || item.authors,
      description: item.description || item.summary, cover_image_url: item.cover || item.cover_image || item.image,
      language: 'English', reader_url: reader, // PDF is intentionally not fabricated; link to official reader until a verified PDF URL is exposed.
      source: 'openstax', access_type: reader ? 'official_reader' as AccessType : 'metadata_only' as AccessType,
      formats: reader ? ['reader'] : [], provider_id: slug ? `openstax:${slug}` : undefined,
      genre: Array.isArray(item.subjects) ? item.subjects.join(', ') : item.subject || 'Open textbook',
    };
  }).filter((b: BookData) => b.title && b.reader_url);
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
  oapenBooks: BookData[],
  doabBooks: BookData[],
  openTextbookLibraryBooks: BookData[],
  openStaxBooks: BookData[],
  wikisourceBooks: BookData[]
): BookData[] {
  const allBooks = [
    ...standardEbooks,   // High priority: beautiful full public domain EPUBs
    ...gutenbergBooks,   // High priority: verified full texts
    ...openLibraryBooks, // High priority: comprehensive metadata
    ...googleBooksData,  // High priority: cover images, previews
    ...openAlexBooks,    // Academic open books
    ...archiveBooks,     // Archive scans
    ...oapenBooks,       // Peer-reviewed open-access books with hosted full text
    ...doabBooks,         // Directory of Open Access Books discovery and provider files
    ...openTextbookLibraryBooks,
    ...openStaxBooks,
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

  // Put genuine file access ahead of metadata-only matches. Keep metadata as
  // fallback, but never let a metadata-only record occupy the first result.
  const accessRank = (book: BookData) => {
    if (book.pdf_url && book.formats?.includes('pdf')) return 0;
    if (book.epub_url && book.formats?.includes('epub')) return 1;
    if (book.reader_url) return 2;
    if (book.preview_url) return 3;
    return 4;
  };
  return Array.from(mergedMap.values()).sort((a, b) => accessRank(a) - accessRank(b));
}