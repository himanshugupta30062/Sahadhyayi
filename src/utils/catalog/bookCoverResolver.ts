/**
 * Book Cover Resolution Pipeline
 * Resolves genuine publisher cover artwork for catalog books with missing or broken cover URLs.
 * Matches by ISBN first via Open Library Cover CDN / Google Books API, then by normalized Title + Author.
 * Verifies matches and caches results persistently to prevent duplicate network calls.
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client-universal';
import { normalizeCoverUrl } from '@/utils/normalizeCoverUrl';
import { normalizeTitle, normalizeAuthor, normalizeIsbn } from '@/utils/catalog/metadataNormalization';

export async function persistVerifiedCoverToDatabase(bookId: string, verifiedUrl: string): Promise<boolean> {
  if (!bookId || !verifiedUrl || !verifiedUrl.startsWith('https://')) return false;
  try {
    const { data, error } = await supabase.rpc('repair_verified_book_cover', {
      p_book_id: bookId,
      p_cover_image_url: verifiedUrl,
    });
    if (error) return false;
    return Boolean(data);
  } catch {
    return false;
  }
}

export interface BookCoverTarget {
  id?: string;
  title: string;
  author?: string | null;
  isbn?: string | null;
  cover_image_url?: string | null;
}

interface CacheEntry {
  url: string | null;
  timestamp: number;
}

const CACHE_KEY = 'sahadhyayi_cover_cache_v2'; // v2 invalidates unverified URL-only cache entries
const CACHE_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

// Memory cache for fast synchronous access during session
const memoryCache = new Map<string, CacheEntry>();

function getStorageCache(): Record<string, CacheEntry> {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStorageCache(cache: Record<string, CacheEntry>): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore quota errors
  }
}

export function clearCoverCache(): void {
  memoryCache.clear();
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch {
      // Ignore errors
    }
  }
}

export function getBookLookupKey(book: BookCoverTarget): string {
  if (book.id) return `id_${book.id}`;
  const isbn = normalizeIsbn(book.isbn);
  if (isbn.isValid && (isbn.isbn13 || isbn.isbn10)) {
    return `isbn_${isbn.isbn13 || isbn.isbn10}`;
  }
  const cleanTitle = normalizeTitle(book.title).cleanTitle.toLowerCase().trim();
  const cleanAuthor = normalizeAuthor(book.author).normalizedAuthor.toLowerCase().trim();
  return `meta_${cleanTitle}_${cleanAuthor}`;
}

export function getCachedCover(book: BookCoverTarget): string | null | undefined {
  const key = getBookLookupKey(book);

  // 1. Check memory cache first
  const mem = memoryCache.get(key);
  if (mem && Date.now() - mem.timestamp < CACHE_TTL_MS) {
    return mem.url;
  }

  // 2. Check localStorage
  const disk = getStorageCache()[key];
  if (disk && Date.now() - disk.timestamp < CACHE_TTL_MS) {
    memoryCache.set(key, disk);
    return disk.url;
  }

  return undefined; // Not cached yet
}

export function setCachedCover(book: BookCoverTarget, url: string | null): void {
  const key = getBookLookupKey(book);
  const entry: CacheEntry = { url, timestamp: Date.now() };

  memoryCache.set(key, entry);

  try {
    const disk = getStorageCache();
    disk[key] = entry;
    saveStorageCache(disk);
  } catch {
    // Ignore storage issues
  }
}

/**
 * Construct Open Library direct cover URL for a valid ISBN.
 * Appends `?default=false` so client receives 404 if no genuine cover is stored.
 */
export function getOpenLibraryCoverUrl(isbnRaw?: string | null, size: 'S' | 'M' | 'L' = 'M'): string | null {
  const norm = normalizeIsbn(isbnRaw);
  if (!norm.isValid) return null;
  const isbn = norm.isbn13 || norm.isbn10;
  if (!isbn) return null;
  return `https://covers.openlibrary.org/b/isbn/${isbn}-${size}.jpg?default=false`;
}

/**
 * Fetch genuine cover from Google Books API using ISBN or normalized Title + Author.
 * Strictly verifies the match to avoid showing incorrect covers.
 */
export async function fetchGoogleBooksCover(
  title: string,
  author?: string | null,
  isbnRaw?: string | null
): Promise<string | null> {
  try {
    const isbnNorm = normalizeIsbn(isbnRaw);
    const validIsbn = isbnNorm.isValid ? (isbnNorm.isbn13 || isbnNorm.isbn10) : null;

    let query = '';
    if (validIsbn) {
      query = `isbn:${encodeURIComponent(validIsbn)}`;
    } else {
      const cleanTitle = normalizeTitle(title).cleanTitle;
      const cleanAuthor = normalizeAuthor(author).normalizedAuthor;
      if (!cleanTitle || cleanTitle === 'Untitled') return null;

      query = `intitle:${encodeURIComponent(cleanTitle)}`;
      if (cleanAuthor && cleanAuthor !== 'Unknown Author') {
        query += `+inauthor:${encodeURIComponent(cleanAuthor)}`;
      }
    }

    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1&fields=items(volumeInfo(title,authors,imageLinks))`);
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.items || data.items.length === 0) return null;

    const volume = data.items[0].volumeInfo;
    if (!volume || !volume.imageLinks) return null;

    // Verify Title similarity if searched without ISBN
    if (!validIsbn) {
      const returnedTitle = (volume.title || '').toLowerCase();
      const targetTitle = normalizeTitle(title).cleanTitle.toLowerCase();
      if (!returnedTitle.includes(targetTitle) && !targetTitle.includes(returnedTitle)) {
        return null; // Reject false positive match
      }
    }

    const rawUrl =
      volume.imageLinks.thumbnail ||
      volume.imageLinks.smallThumbnail ||
      volume.imageLinks.medium ||
      volume.imageLinks.large;

    if (!rawUrl) return null;

    // Ensure secure HTTPS and remove curl/zoom limitations
    // Google Books often returns a generic "image not available" thumbnail with HTTP 200.
    // Reject the endpoint here as well as in normalization so it cannot re-enter via lookup.
    return normalizeCoverUrl(rawUrl.replace(/^http:\/\//i, 'https://').replace(/&edge=curl/gi, ''));
  } catch {
    return null;
  }
}

/**
 * Clean title for fuzzy search matching against bibliographic records.
 */
function cleanTitleForMatch(title: string): string {
  if (!title) return '';
  return title
    .replace(/\[[^\]]{0,512}\]|\([^)]{0,512}\)/g, '')
    .replace(/[^\w\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Validate that returned document title matches target title sufficiently
 * to avoid false positive matches.
 */
function isTitleMatch(targetTitle: string, candidateTitle?: string | null): boolean {
  if (!candidateTitle) return false;
  const target = cleanTitleForMatch(targetTitle);
  const candidate = cleanTitleForMatch(candidateTitle);
  if (!target || !candidate) return false;
  if (target === candidate) return true;
  if (candidate.includes(target) || target.includes(candidate)) return true;

  // Word overlap comparison for longer titles, while rejecting very short generic matches.
  const targetWords = target.split(/\\s+/).filter((w) => w.length > 3);
  if (targetWords.length >= 2) {
    const matchCount = targetWords.filter((w) => candidate.includes(w)).length;
    return matchCount / targetWords.length >= 0.8;
  }
  return false;
}

function isAuthorMatch(targetAuthor: string, candidateAuthors?: string[] | null): boolean {
  if (!targetAuthor || targetAuthor.toLowerCase() === 'unknown author') return true;
  if (!Array.isArray(candidateAuthors) || candidateAuthors.length === 0) return false;
  const target = normalizeAuthor(targetAuthor).normalizedAuthor.toLowerCase();
  return candidateAuthors.some((candidate) => {
    const normalized = normalizeAuthor(candidate).normalizedAuthor.toLowerCase();
    return normalized === target || normalized.includes(target) || target.includes(normalized);
  });
}

/**
 * Search Open Library for genuine cover artwork using Title and optional Author.
 */
export async function fetchOpenLibraryCoverBySearch(
  title: string,
  author?: string | null
): Promise<string | null> {
  try {
    const cleanTitle = normalizeTitle(title).cleanTitle;
    if (!cleanTitle || cleanTitle.toLowerCase() === 'untitled') return null;

    const normAuthor = normalizeAuthor(author).normalizedAuthor;
    const authorParam =
      normAuthor && normAuthor.toLowerCase() !== 'unknown author'
        ? `&author=${encodeURIComponent(normAuthor)}`
        : '';

    const url = `https://openlibrary.org/search.json?title=${encodeURIComponent(cleanTitle)}${authorParam}&limit=5&fields=title,author_name,cover_i`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    let docWithCover = data.docs?.find((d: any) => d.cover_i && isTitleMatch(cleanTitle, d.title) && isAuthorMatch(normAuthor, d.author_name));

    // Fall back to title-only search if author-constrained search returned no matching cover,
    // but still verify that the author matches the returned record.
    if (!docWithCover && authorParam) {
      const fallbackUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(cleanTitle)}&limit=5&fields=title,author_name,cover_i`;
      const fallbackRes = await fetch(fallbackUrl);
      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        docWithCover = fallbackData.docs?.find(
          (d: any) =>
            d.cover_i &&
            isTitleMatch(cleanTitle, d.title) &&
            (!d.author_name || isAuthorMatch(normAuthor, d.author_name))
        );
      }
    }

    if (docWithCover && docWithCover.cover_i) {
      return `https://covers.openlibrary.org/b/id/${docWithCover.cover_i}-L.jpg`;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Synchronous or asynchronous resolution of the best available book cover.
 */
export async function resolveGenuineBookCover(book: BookCoverTarget): Promise<string | null> {
  // 1. Accept only structurally plausible existing URLs. Known generic thumbnail
  // endpoints are deliberately rejected by normalizeCoverUrl because they can return
  // HTTP 200 with placeholder/blank artwork.
  const existing = normalizeCoverUrl(book.cover_image_url);
  if (existing) return existing;

  // 2. Check persistent cache
  const cached = getCachedCover(book);
  if (cached !== undefined) {
    return cached;
  }

  // 3. Try direct Open Library ISBN CDN URL first: instant, deterministic, and requires no external search call.
  const olCover = getOpenLibraryCoverUrl(book.isbn, 'M');
  if (olCover) {
    setCachedCover(book, olCover);
    if (book.id) void persistVerifiedCoverToDatabase(book.id, olCover);
    return olCover;
  }

  // 4. Try Open Library search by Title and Author
  const olSearchCover = await fetchOpenLibraryCoverBySearch(book.title, book.author);
  if (olSearchCover) {
    setCachedCover(book, olSearchCover);
    if (book.id) {
      void persistVerifiedCoverToDatabase(book.id, olSearchCover);
    }
    return olSearchCover;
  }

  // 5. Try Google Books API metadata lookup
  const gbCover = await fetchGoogleBooksCover(book.title, book.author, book.isbn);
  if (gbCover) {
    setCachedCover(book, gbCover);
    if (book.id) {
      void persistVerifiedCoverToDatabase(book.id, gbCover);
    }
    return gbCover;
  }

  // 7. No genuine cover found — record negative in cache to avoid repetitive queries
  setCachedCover(book, null);
  return null;
}

/**
 * React hook to resolve genuine cover with instant cache lookup and background fallback.
 */
export function useResolvedBookCover(book: BookCoverTarget): {
  coverUrl: string | null;
  isGenuine: boolean;
} {
  const existing = normalizeCoverUrl(book.cover_image_url);
  const cached = getCachedCover(book);
  const initialUrl = existing || (cached !== undefined ? cached : getOpenLibraryCoverUrl(book.isbn, 'M'));
  const [coverUrl, setCoverUrl] = useState<string | null>(initialUrl);

  const lookupKey = getBookLookupKey(book);

  useEffect(() => {
    // If existing valid cover is present, nothing to resolve
    if (existing) {
      setCoverUrl(existing);
      return;
    }

    const currentCached = getCachedCover(book);
    if (currentCached !== undefined) {
      setCoverUrl(currentCached);
      return;
    }

    let isMounted = true;

    void resolveGenuineBookCover(book).then(
      (resolved) => {
        if (isMounted) setCoverUrl(resolved);
      },
      (error: unknown) => {
        console.warn("Unable to resolve book cover:", error);
        if (isMounted) setCoverUrl(null);
      }
    );

    return () => {
      isMounted = false;
    };
  }, [lookupKey, existing, book]);

  return {
    coverUrl,
    isGenuine: Boolean(coverUrl),
  };
}
