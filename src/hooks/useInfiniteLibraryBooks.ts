import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Book } from './useLibraryBooks';
import { sampleBooks } from '@/data/sampleBooks';

interface InfiniteParams {
  genre: string;
  searchQuery?: string;
  author?: string;
  year?: string;
  language?: string;
  pageSize?: number;
}

export interface BooksPage {
  books: Book[];
  nextPage: number;
  total: number;
}

export const useInfiniteLibraryBooks = ({
  genre,
  searchQuery = '',
  author = 'All',
  year = '',
  language = 'All',
  pageSize = 20,
}: InfiniteParams) => {
  return useInfiniteQuery({
    queryKey: ['infinite-library-books', genre, searchQuery, author, year, language, pageSize],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }): Promise<BooksPage> => {
      const start = pageParam * pageSize;
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
          nextPage: pageParam + 1,
          total: sampleBooks.length,
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
        isbn: book.isbn,
        pages: book.pages,
        author_bio: book.author_bio,
      })) as Book[];

      return {
        books,
        nextPage: pageParam + 1,
        total: count ?? books.length,
      };
    },
    getNextPageParam: lastPage => {
      const nextIndex = lastPage.nextPage * pageSize;
      if (nextIndex >= lastPage.total) return undefined;
      return lastPage.nextPage;
    },
  });
};
