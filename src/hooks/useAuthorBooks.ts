import { useQuery } from '@tanstack/react-query';
import type { Book } from './useLibraryBooks';

export const useAuthorBooks = (authorId: string) => {
  return useQuery({
    queryKey: ['author-books', authorId],
    queryFn: async (): Promise<Book[]> => {
      if (!authorId) return [];
      
      const res = await fetch(`/api/authors/${authorId}/books`, { credentials: 'include' });
      if (!res.ok) {
        const err: any = new Error('Failed to fetch author books');
        err.status = res.status;
        throw err;
      }
      const data = await res.json();

      return (data || []).map((book: any) => ({
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
    },
    enabled: !!authorId,
  });
};

export const useBooksByAuthorName = (authorName: string) => {
  return useQuery({
    queryKey: ['books-by-author-name', authorName],
    queryFn: async (): Promise<Book[]> => {
      if (!authorName) return [];
      const res = await fetch(`/api/books?author=${encodeURIComponent(authorName)}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const err: any = new Error('Failed to fetch books');
        err.status = res.status;
        throw err;
      }
      const data = await res.json();

      return (data || []).map((book: any) => ({
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
      }));
    },
    enabled: !!authorName,
  });
};