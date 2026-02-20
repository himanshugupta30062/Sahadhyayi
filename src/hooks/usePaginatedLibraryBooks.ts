import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import type { Book } from './useLibraryBooks';

interface UsePaginatedLibraryBooksParams {
  searchQuery?: string;
  selectedGenre?: string;
  selectedAuthor?: string;
  selectedYear?: string;
  selectedLanguage?: string;
  priceRange?: [number, number];
}

interface PaginatedBooksResponse {
  books: Book[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export const usePaginatedLibraryBooks = (params: UsePaginatedLibraryBooksParams = {}) => {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [totalPages, setTotalPages] = React.useState(0);

  const {
    searchQuery,
    selectedGenre,
    selectedAuthor,
    selectedYear,
    selectedLanguage,
    priceRange
  } = params;

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedGenre, selectedAuthor, selectedYear, selectedLanguage, priceRange]);

  const fetchPaginatedBooks = React.useCallback(async (): Promise<PaginatedBooksResponse> => {
    try {
      // Start building the query - remove the order clause to apply custom sorting later
      let query = supabase
        .from('books_library')
        .select('*', { count: 'exact' });

      // Apply search filter
      if (searchQuery && searchQuery.trim()) {
        query = query.or(
          `title.ilike.%${searchQuery}%,author.ilike.%${searchQuery}%,genre.ilike.%${searchQuery}%`
        );
      }

      // Apply genre filter
      if (selectedGenre && selectedGenre !== 'All') {
        if (selectedGenre === 'Hindi') {
          query = query.eq('language', 'Hindi');
        } else {
          query = query.eq('genre', selectedGenre);
        }
      }

      // Apply author filter
      if (selectedAuthor && selectedAuthor !== 'All') {
        query = query.eq('author', selectedAuthor);
      }

      // Apply year filter
      if (selectedYear && selectedYear.trim()) {
        query = query.eq('publication_year', parseInt(selectedYear));
      }

      // Apply language filter
      if (selectedLanguage && selectedLanguage !== 'All') {
        query = query.eq('language', selectedLanguage);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching paginated books:', error);
        throw error;
      }

      const totalCount = count || 0;
      const calculatedTotalPages = Math.ceil(totalCount / pageSize);
      setTotalPages(calculatedTotalPages);

      // Map and sort books by completeness before pagination
      const allMappedBooks: Book[] = (data || []).map(book => ({
        id: book.id,
        title: book.title,
        author: book.author || 'Unknown Author',
        genre: book.genre,
        cover_image_url: book.cover_image_url,
        description: book.description,
        publication_year: book.publication_year,
        language: book.language || 'English',
        pdf_url: book.pdf_url,
        created_at: book.created_at,
        price: 0,
        isbn: book.isbn,
        pages: book.pages,
        author_bio: book.author_bio
      }));

      // Sort by completeness
      const sortedBooks = allMappedBooks.sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;
        
        // PDF availability (highest priority)
        if (a.pdf_url) scoreA += 100;
        if (b.pdf_url) scoreB += 100;
        
        // Cover image availability
        if (a.cover_image_url) scoreA += 50;
        if (b.cover_image_url) scoreB += 50;
        
        // Complete details
        if (a.description) scoreA += 20;
        if (b.description) scoreB += 20;
        if (a.author_bio) scoreA += 15;
        if (b.author_bio) scoreB += 15;
        if (a.genre) scoreA += 10;
        if (b.genre) scoreB += 10;
        if (a.publication_year) scoreA += 8;
        if (b.publication_year) scoreB += 8;
        if (a.pages) scoreA += 7;
        if (b.pages) scoreB += 7;
        if (a.isbn) scoreA += 5;
        if (b.isbn) scoreB += 5;
        
        // Sort by completeness score (descending), then by creation date (newest first)
        if (scoreA !== scoreB) {
          return scoreB - scoreA;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      // Deduplicate by title (case-insensitive) — keep the first (most complete) entry
      const seen = new Set<string>();
      const deduplicatedBooks = sortedBooks.filter(book => {
        const key = book.title.trim().toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const dedupTotalCount = deduplicatedBooks.length;
      const dedupTotalPages = Math.ceil(dedupTotalCount / pageSize);
      setTotalPages(dedupTotalPages);

      // Apply pagination to deduplicated books
      const startIndex = (page - 1) * pageSize;
      const books = deduplicatedBooks.slice(startIndex, startIndex + pageSize);

      return {
        books,
        totalCount: dedupTotalCount,
        totalPages: dedupTotalPages,
        currentPage: page,
        pageSize,
        hasNextPage: page < dedupTotalPages,
        hasPrevPage: page > 1
      };
    } catch (error) {
      console.error('Error in fetchPaginatedBooks:', error);
      throw error;
    }
  }, [page, pageSize, searchQuery, selectedGenre, selectedAuthor, selectedYear, selectedLanguage]);

  const query = useQuery({
    queryKey: ['paginated-library-books', page, pageSize, searchQuery, selectedGenre, selectedAuthor, selectedYear, selectedLanguage, priceRange],
    queryFn: fetchPaginatedBooks,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const goToPage = React.useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= (query.data?.totalPages || 1)) {
      setPage(newPage);
    }
  }, [query.data?.totalPages]);

  const goToNextPage = React.useCallback(() => {
    if (query.data?.hasNextPage) {
      setPage(prev => prev + 1);
    }
  }, [query.data?.hasNextPage]);

  const goToPrevPage = React.useCallback(() => {
    if (query.data?.hasPrevPage) {
      setPage(prev => prev - 1);
    }
  }, [query.data?.hasPrevPage]);

  const changePageSize = React.useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
    setTotalPages(0); // Reset total pages
  }, []);

  return {
    ...query,
    page,
    pageSize,
    totalPages,
    goToPage,
    goToNextPage,
    goToPrevPage,
    changePageSize,
    setPage,
    setPageSize
  };
};