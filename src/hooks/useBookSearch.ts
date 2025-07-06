import { useState } from 'react';
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
  booksSaved: number;
  books: BookSearchResult[];
  sources?: {
    openLibrary: number;
    googleBooks: number;
    gutenberg: number;
    archive: number;
  };
  error?: string;
}

export const useBookSearch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<BookSearchResult[]>([]);

  const searchBooks = async (searchTerm: string): Promise<void> => {
    if (!searchTerm.trim()) {
      setError('Please enter a search term');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('search-books', {
        body: { searchTerm: searchTerm.trim() }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      const response = data as SearchResponse;

      if (response.success) {
        setSearchResults(response.books);
        if (response.books.length === 0) {
          setError('No books found for your search term. Try different keywords.');
        }
      } else {
        throw new Error(response.error || 'Search failed');
      }
    } catch (err) {
      console.error('Book search error:', err);
      setError(err instanceof Error ? err.message : 'Failed to search books');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getAllLibraryBooks = async (): Promise<void> => {
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
  };

  const clearResults = () => {
    setSearchResults([]);
    setError(null);
  };

  return {
    loading,
    error,
    searchResults,
    searchBooks,
    getAllLibraryBooks,
    clearResults
  };
};