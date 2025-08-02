
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BookSearchResult {
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
  created_at: string;
}

interface SearchResponse {
  success: boolean;
  booksFound: number;
  books: BookSearchResult[];
  sources?: {
    openLibrary: number;
    googleBooks: number;
    gutenberg: number;
    archive: number;
  };
  error?: string;
}

interface SaveBooksResponse {
  success: boolean;
  booksSaved: number;
  duplicatesFound: number;
  books: BookSearchResult[];
  duplicates: BookSearchResult[];
  error?: string;
}

export const useBookSearch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<BookSearchResult[]>([]);

  const searchBooks = useCallback(async (
    searchTerm: string
  ): Promise<BookSearchResult[]> => {
    if (!searchTerm.trim()) {
      setError('Please enter a search term');
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('search-books-preview', {
        body: { searchTerm: searchTerm.trim() }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      const response = data as SearchResponse;

      if (response.success) {
        // Convert preview books to include temporary ID for UI
        const booksWithTempId = response.books.map((book, index) => ({
          ...book,
          id: `temp-${Date.now()}-${index}`,
          created_at: new Date().toISOString()
        }));
        
        setSearchResults(booksWithTempId);
        if (booksWithTempId.length === 0) {
          setError('No books found for your search term. Try different keywords.');
        }
        return booksWithTempId;
      } else {
        throw new Error(response.error || 'Search failed');
      }
    } catch (err) {
      console.error('Book search error:', err);
      setError(err instanceof Error ? err.message : 'Failed to search books');
      setSearchResults([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSelectedBooks = useCallback(async (
    selectedBooks: BookSearchResult[]
  ): Promise<{ savedBooks: BookSearchResult[], duplicates: BookSearchResult[], duplicatesFound: number }> => {
    if (!selectedBooks || selectedBooks.length === 0) {
      return { savedBooks: [], duplicates: [], duplicatesFound: 0 };
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('save-selected-books', {
        body: { selectedBooks: selectedBooks.map(book => {
          // Remove temporary ID and created_at for saving
          const { id, created_at, ...bookData } = book;
          return bookData;
        }) }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      const response = data as SaveBooksResponse;

      if (response.success) {
        return { 
          savedBooks: response.books,
          duplicates: response.duplicates || [],
          duplicatesFound: response.duplicatesFound || 0
        };
      } else {
        throw new Error(response.error || 'Failed to save books');
      }
    } catch (err) {
      console.error('Book save error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save books');
      return { savedBooks: [], duplicates: [], duplicatesFound: 0 };
    } finally {
      setLoading(false);
    }
  }, []);

  const getAllLibraryBooks = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: dbError } = await supabase
        .from('books_library')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbError) {
        throw new Error(dbError.message);
      }

      setSearchResults(data || []);
    } catch (err) {
      console.error('Error fetching books:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch books');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
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
