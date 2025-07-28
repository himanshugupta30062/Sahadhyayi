import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const {
    searchQuery,
    selectedGenre,
    selectedAuthor,
    selectedYear,
    selectedLanguage,
    priceRange
  } = params;

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedGenre, selectedAuthor, selectedYear, selectedLanguage, priceRange]);

  const fetchPaginatedBooks = useCallback(async (): Promise<PaginatedBooksResponse> => {
    try {
      // Start building the query
      let query = supabase
        .from('books_library')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

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

      // Apply pagination
      const startIndex = (page - 1) * pageSize;
      query = query.range(startIndex, startIndex + pageSize - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching paginated books:', error);
        throw error;
      }

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);

      const books: Book[] = (data || []).map(book => ({
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
        rating: 0,
        isbn: book.isbn,
        pages: book.pages,
        author_bio: book.author_bio
      }));

      return {
        books,
        totalCount,
        totalPages,
        currentPage: page,
        pageSize,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      };
    } catch (error) {
      console.error('Error in fetchPaginatedBooks:', error);
      throw error;
    }
  }, [page, pageSize, searchQuery, selectedGenre, selectedAuthor, selectedYear, selectedLanguage, priceRange]);

  const query = useQuery({
    queryKey: ['paginated-library-books', page, pageSize, searchQuery, selectedGenre, selectedAuthor, selectedYear, selectedLanguage, priceRange],
    queryFn: fetchPaginatedBooks,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const goToPage = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= (query.data?.totalPages || 1)) {
      setPage(newPage);
    }
  }, [query.data?.totalPages]);

  const goToNextPage = useCallback(() => {
    if (query.data?.hasNextPage) {
      setPage(prev => prev + 1);
    }
  }, [query.data?.hasNextPage]);

  const goToPrevPage = useCallback(() => {
    if (query.data?.hasPrevPage) {
      setPage(prev => prev - 1);
    }
  }, [query.data?.hasPrevPage]);

  const changePageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
  }, []);

  return {
    ...query,
    page,
    pageSize,
    goToPage,
    goToNextPage,
    goToPrevPage,
    changePageSize,
    setPage,
    setPageSize
  };
};