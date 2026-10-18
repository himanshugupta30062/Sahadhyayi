import * as React from 'react';
import { supabase } from '@/integrations/supabase/client-universal';
import {
  detectBookSchemaCapabilities,
  applyPublicBookFilter,
  filterPublicBooks,
} from '@/utils/catalog/bookVisibility';

export type AccessType = 'full_download' | 'official_reader' | 'preview' | 'borrow' | 'metadata_only';

export interface BookSearchResult {
  id: string;
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
  created_at: string;
}

export interface BookSaveResult {
  title: string;
  status: 'inserted' | 'already_exists' | 'enriched' | 'failed';
  id?: string;
  enrichedFields?: string[];
  error?: string;
}

interface SearchResponse {
  success: boolean;
  booksFound: number;
  books: BookSearchResult[];
  sources?: Record<string, number>;
  metrics?: Record<string, { count: number; latencyMs: number; status: string }>;
  error?: string;
}

export interface SaveBooksResponse {
  success: boolean;
  booksSaved: number;
  newlyInserted?: number;
  enrichedCount?: number;
  duplicatesFound: number;
  failedCount?: number;
  results?: BookSaveResult[];
  books: BookSearchResult[];
  duplicates: BookSearchResult[];
  error?: string;
}

export interface SaveBooksOutcome {
  savedBooks: BookSearchResult[];
  duplicates: BookSearchResult[];
  duplicatesFound: number;
  newlyInserted: number;
  enrichedCount: number;
  failedCount: number;
  results: BookSaveResult[];
}

// In-memory short-lived search cache (5 minute TTL)
export const clientSearchCache = new Map<string, { results: BookSearchResult[]; timestamp: number }>();
export const CLIENT_CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Direct public search fallback to Open Library when Edge Function is cold, times out, or fails.
 */
async function searchOpenLibraryDirect(cleanTerm: string): Promise<BookSearchResult[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(cleanTerm)}&limit=15&fields=key,title,author_name,first_publish_year,isbn,cover_i,number_of_pages_median,language`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.docs || !Array.isArray(data.docs)) return [];

    return data.docs.map((doc: any, index: number) => {
      const isbn = Array.isArray(doc.isbn) && doc.isbn[0] ? String(doc.isbn[0]).trim() : undefined;
      const coverUrl = doc.cover_i
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
        : isbn
        ? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false`
        : undefined;
      const authors = Array.isArray(doc.author_name) ? doc.author_name.join(', ') : doc.author_name;
      return {
        id: `ol-${doc.key?.replace(/[^a-zA-Z0-9]/g, '') || index}`,
        title: doc.title || 'Untitled',
        author: authors,
        isbn,
        cover_image_url: coverUrl,
        publication_year: typeof doc.first_publish_year === 'number' ? doc.first_publish_year : undefined,
        pages: typeof doc.number_of_pages_median === 'number' ? doc.number_of_pages_median : undefined,
        language: Array.isArray(doc.language) && doc.language[0] ? doc.language[0] : 'en',
        source: 'open_library',
        access_type: 'metadata_only' as AccessType,
        formats: [],
        created_at: new Date().toISOString(),
      };
    });
  } catch {
    return [];
  }
}

/**
 * Direct public search fallback to Google Books when Edge Function is cold, times out, or fails.
 */
async function searchGoogleBooksDirect(cleanTerm: string): Promise<BookSearchResult[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(cleanTerm)}&maxResults=15`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.items || !Array.isArray(data.items)) return [];

    return data.items.map((item: any) => {
      const vol = item.volumeInfo || {};
      const isbnObj = (vol.industryIdentifiers || []).find(
        (i: any) => i.type === 'ISBN_13' || i.type === 'ISBN_10'
      );
      const cover = vol.imageLinks?.thumbnail || vol.imageLinks?.smallThumbnail;
      return {
        id: `gb-${item.id}`,
        title: vol.title || 'Untitled',
        author: Array.isArray(vol.authors) ? vol.authors.join(', ') : vol.authors,
        description: vol.description,
        genre: Array.isArray(vol.categories) ? vol.categories[0] : vol.categories,
        cover_image_url: cover ? cover.replace('http://', 'https://') : undefined,
        isbn: isbnObj?.identifier,
        publication_year: vol.publishedDate ? parseInt(vol.publishedDate.slice(0, 4), 10) || undefined : undefined,
        pages: vol.pageCount,
        language: vol.language || 'en',
        preview_url: vol.previewLink,
        reader_url: vol.previewLink,
        source: 'google_books',
        access_type: vol.previewLink ? ('preview' as AccessType) : ('metadata_only' as AccessType),
        formats: vol.previewLink ? ['reader'] : [],
        created_at: new Date().toISOString(),
      };
    });
  } catch {
    return [];
  }
}

export const useBookSearch = () => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [searchResults, setSearchResults] = React.useState<BookSearchResult[]>([]);

  // Generation counter to protect against stale out-of-order responses
  const activeSearchIdRef = React.useRef<number>(0);

  const searchBooks = React.useCallback(async (
    searchTerm: string
  ): Promise<BookSearchResult[]> => {
    const cleanTerm = (searchTerm || '').trim();
    if (!cleanTerm) {
      setError('Please enter a search term');
      return [];
    }

    const cacheKey = cleanTerm.toLowerCase();
    const cached = clientSearchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CLIENT_CACHE_TTL_MS) {
      setSearchResults(cached.results);
      setError(null);
      return cached.results;
    }

    const searchId = ++activeSearchIdRef.current;
    setLoading(true);
    setError(null);

    try {
      // 1. Search local Sahadhyayi catalog and external preview providers concurrently
      const localSearchPromise = (async () => {
        try {
          const caps = await detectBookSchemaCapabilities();
          const safeTerm = cleanTerm.replace(/[,()"'%_]/g, ' ').replace(/\s+/g, ' ').trim();
          if (!safeTerm) return [];

          let query = supabase
            .from('books_library')
            .select('*')
            .or(`title.ilike.%${safeTerm}%,author.ilike.%${safeTerm}%,isbn.ilike.%${safeTerm}%`)
            .limit(15);

          query = applyPublicBookFilter(query, caps);
          const { data, error: dbErr } = await query;
          if (dbErr || !data) return [];
          const visible = filterPublicBooks(data);
          return visible.map((b: any) => ({
            ...b,
            source: 'sahadhyayi',
            access_type: (b.pdf_url ? 'full_download' : 'metadata_only') as AccessType,
            formats: b.pdf_url ? ['pdf'] : [],
          }));
        } catch {
          return [];
        }
      })();

      const externalSearchPromise = (async () => {
        try {
          const { data, error: functionError } = await supabase.functions.invoke('search-books-preview', {
            body: { searchTerm: cleanTerm }
          });

          if (!functionError && data && (data as SearchResponse).success && Array.isArray((data as SearchResponse).books) && (data as SearchResponse).books.length > 0) {
            return (data as SearchResponse).books;
          }

          // If Edge Function returned 0 results or had an error, try direct public browser APIs
          const [olResults, gbResults] = await Promise.all([
            searchOpenLibraryDirect(cleanTerm),
            searchGoogleBooksDirect(cleanTerm),
          ]);
          return [...olResults, ...gbResults];
        } catch (err: any) {
          console.warn('External search-books-preview invocation notice:', err?.message);
          try {
            const [olResults, gbResults] = await Promise.all([
              searchOpenLibraryDirect(cleanTerm),
              searchGoogleBooksDirect(cleanTerm),
            ]);
            return [...olResults, ...gbResults];
          } catch {
            return [];
          }
        }
      })();

      const [localBooks, externalBooks] = await Promise.all([
        localSearchPromise,
        externalSearchPromise
      ]);

      // If a newer search was started while this was in-flight, discard this result to prevent stale overwrites
      if (searchId !== activeSearchIdRef.current) {
        return [];
      }

      // Convert preview books to include temporary ID and formats
      const mappedExternal: BookSearchResult[] = externalBooks.map((book: any, index: number) => ({
        ...book,
        id: book.id || `temp-${Date.now()}-${index}`,
        created_at: new Date().toISOString(),
      }));

      // Combine and deduplicate: prefer local library match over external placeholder
      const combinedMap = new Map<string, BookSearchResult>();

      for (const b of localBooks) {
        const key = b.isbn ? `isbn:${b.isbn}` : `${b.title.toLowerCase().replace(/[^a-z0-9]/g, '')}-${(b.author || '').toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        combinedMap.set(key, b);
      }

      for (const b of mappedExternal) {
        const key = b.isbn ? `isbn:${b.isbn}` : `${b.title.toLowerCase().replace(/[^a-z0-9]/g, '')}-${(b.author || '').toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        if (!combinedMap.has(key)) {
          combinedMap.set(key, b);
        } else {
          // Enrich local book with external reader/cover if missing
          const existing = combinedMap.get(key)!;
          if (!existing.cover_image_url && b.cover_image_url) existing.cover_image_url = b.cover_image_url;
          if (!existing.pdf_url && b.pdf_url) existing.pdf_url = b.pdf_url;
          if (!existing.epub_url && b.epub_url) existing.epub_url = b.epub_url;
          if (!existing.reader_url && b.reader_url) existing.reader_url = b.reader_url;
          if (!existing.preview_url && b.preview_url) existing.preview_url = b.preview_url;
        }
      }

      const finalResults = Array.from(combinedMap.values());

      setSearchResults(finalResults);
      setError(null);

      if (finalResults.length > 0) {
        // Cache result for 5 minutes
        clientSearchCache.set(cacheKey, { results: finalResults, timestamp: Date.now() });
      }

      return finalResults;
    } catch (err: any) {
      if (searchId !== activeSearchIdRef.current) return [];
      console.error('Book search error:', err);
      setError(err instanceof Error ? err.message : 'Failed to search books');
      setSearchResults([]);
      return [];
    } finally {
      if (searchId === activeSearchIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const saveSelectedBooks = React.useCallback(async (
    selectedBooks: BookSearchResult[]
  ): Promise<SaveBooksOutcome> => {
    if (!selectedBooks || selectedBooks.length === 0) {
      return {
        savedBooks: [],
        duplicates: [],
        duplicatesFound: 0,
        newlyInserted: 0,
        enrichedCount: 0,
        failedCount: 0,
        results: [],
      };
    }

    setLoading(true);
    setError(null);

    try {
      // Pass the current user's JWT explicitly in the authorization header
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        throw new Error('Authentication required. Please sign in to save books to the catalog.');
      }

      const payload = selectedBooks.map(book => {
        const { id, created_at, source, access_type, formats, provider_id, ...bookData } = book;
        return {
          title: (bookData.title || '').trim(),
          author: bookData.author ? bookData.author.trim() : undefined,
          genre: bookData.genre ? bookData.genre.trim() : undefined,
          cover_image_url: bookData.cover_image_url ? bookData.cover_image_url.trim() : undefined,
          description: bookData.description ? bookData.description.trim() : undefined,
          author_bio: bookData.author_bio ? bookData.author_bio.trim() : undefined,
          isbn: bookData.isbn ? bookData.isbn.trim() : undefined,
          publication_year: bookData.publication_year,
          pages: bookData.pages,
          language: bookData.language || 'English',
          pdf_url: bookData.pdf_url ? bookData.pdf_url.trim() : undefined,
        };
      });

      let response: SaveBooksResponse | null = null;
      let edgeFunctionError: any = null;

      // 1. Primary Attempt: Edge Function
      try {
        const { data, error: functionError } = await supabase.functions.invoke('save-selected-books', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: {
            selectedBooks: payload,
          },
        });

        if (!functionError && data && (data as SaveBooksResponse).success) {
          response = data as SaveBooksResponse;
        } else {
          edgeFunctionError = functionError || data;
          console.warn('save-selected-books Edge Function returned error, attempting database fallback:', edgeFunctionError);
        }
      } catch (err: any) {
        edgeFunctionError = err;
        console.warn('save-selected-books Edge Function invocation failed, attempting database fallback:', err);
      }

      // 2. Resilient Fallback: PostgreSQL RPC save_selected_books
      if (!response) {
        console.info('Invoking database RPC save_selected_books fallback...');
        const { data: rpcData, error: rpcError } = await supabase.rpc('save_selected_books', {
          p_books: payload,
        });

        if (rpcError) {
          console.error('Database fallback RPC save_selected_books failed:', rpcError);
          const detail = rpcError.message || edgeFunctionError?.message || 'Failed to save books to catalog';
          throw new Error(detail);
        }

        if (rpcData && (rpcData as any).success) {
          response = rpcData as SaveBooksResponse;
        } else {
          throw new Error((rpcData as any)?.error || 'Database save procedure returned an unhandled error');
        }
      }

      return {
        savedBooks: response.books || [],
        duplicates: response.duplicates || [],
        duplicatesFound: response.duplicatesFound || 0,
        newlyInserted: response.newlyInserted ?? response.booksSaved ?? 0,
        enrichedCount: response.enrichedCount ?? 0,
        failedCount: response.failedCount ?? 0,
        results: response.results || [],
      };
    } catch (err: any) {
      console.error('Book save error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to save books';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAllLibraryBooks = React.useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const caps = await detectBookSchemaCapabilities();
      let query = supabase
        .from('books_library')
        .select('*')
        .order('created_at', { ascending: false });

      query = applyPublicBookFilter(query, caps);

      const { data, error: dbError } = await query;

      if (dbError) {
        throw new Error(dbError.message);
      }

      const activeBooks = filterPublicBooks(data || []);
      setSearchResults(activeBooks);
    } catch (err) {
      console.error('Error fetching books:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch books');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = React.useCallback(() => {
    setSearchResults([]);
    setError(null);
  }, []);

  return {
    loading,
    error,
    searchResults,
    searchBooks,
    saveSelectedBooks,
    getAllLibraryBooks,
    clearResults
  };
};
