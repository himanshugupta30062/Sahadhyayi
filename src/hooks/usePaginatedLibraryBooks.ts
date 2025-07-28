import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Book } from './useLibraryBooks';
import { sampleBooks } from '@/data/sampleBooks';

interface PaginatedParams {
  genre: string;
  searchQuery?: string;
  author?: string;
  year?: string;
  language?: string;
  page: number;
  pageSize: number;
}

export interface PaginatedBooksResult {
  books: Book[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export const usePaginatedLibraryBooks = ({
  genre,
  searchQuery = '',
  author = 'All',
  year = '',
  language = 'All',
  page = 1,
  pageSize = 20,
}: PaginatedParams) => {
  return useQuery({
    queryKey: ['paginated-library-books', genre, searchQuery, author, year, language, page, pageSize],
    queryFn: async (): Promise<PaginatedBooksResult> => {
      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;

      let query = supabase
        .from('books_library')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: true })
        .range(start, end);

      if (genre !== 'All') {
        if (genre === 'Hindi') {
          query = query.eq('language', 'Hindi');
        } else {
          query = query.eq('genre', genre);
        }
      }

      if (author !== 'All') {
        query = query.eq('author', author);
      }

      if (year) {
        query = query.eq('publication_year', parseInt(year, 10));
      }

      if (language !== 'All') {
        query = query.eq('language', language);
      }

      if (searchQuery && searchQuery.trim()) {
        query = query.or(
          `title.ilike.%${searchQuery}%,author.ilike.%${searchQuery}%`
        );
      }

      const { data, error, count } = await query;

      if (error || !data) {
        console.error('Error fetching books:', error);
        const fallback = sampleBooks.slice(start, end + 1);
        return {
          books: fallback,
          totalCount: sampleBooks.length,
          totalPages: Math.ceil(sampleBooks.length / pageSize),
          currentPage: page,
        };
      }

      const books = data.map(book => ({
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
        author_bio: book.author_bio,
      })) as Book[];

      return {
        books,
        totalCount: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / pageSize),
        currentPage: page,
      };
    },
  });
};