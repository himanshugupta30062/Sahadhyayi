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

interface SaveBooksResponse {
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
          let query = supabase
            .from('books_library')
            .select('*')
            .or(`title.ilike.%${cleanTerm}%,author.ilike.%${cleanTerm}%,isbn.ilike.%${cleanTerm}%`)
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
          if (functionError) throw new Error(functionError.message);
          const response = data as SearchResponse;
          if (!response.success) throw new Error(response.error || 'External search failed');
          return response.books || [];
        } catch (err: any) {
          console.warn('External search-books-preview notice:', err?.message);
          return [];
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
      if (finalResults.length === 0) {
        setError('No books found for your search term. Try different keywords.');
      } else {
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

      const { data, error: functionError } = await supabase.functions.invoke('save-selected-books', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: {
          selectedBooks: selectedBooks.map(book => {
            const { id, created_at, ...bookData } = book;
            return bookData;
          }),
        },
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      const response = data as SaveBooksResponse;

      if (response.success) {
        return { 
          savedBooks: response.books || [],
          duplicates: response.duplicates || [],
          duplicatesFound: response.duplicatesFound || 0,
          newlyInserted: response.newlyInserted ?? response.booksSaved ?? 0,
          enrichedCount: response.enrichedCount ?? 0,
          failedCount: response.failedCount ?? 0,
          results: response.results || [],
        };
      } else {
        throw new Error(response.error || 'Failed to save books');
      }
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
