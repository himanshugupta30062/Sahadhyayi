
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Book {
  id: string;
  title: string;
  author: string;
  genre?: string;
  description?: string;
  author_bio?: string;
  cover_image_url?: string;
  ebook_url?: string;
  pdf_url?: string;
  price?: number;
  amazon_url?: string;
  google_books_url?: string;
  isbn?: string;
  publication_year?: number;
  pages?: number;
  language?: string;
  rating?: number;
  location?: string;
  community?: string;
  created_at: string;
  updated_at?: string;
}

export interface Genre {
  id: string;
  name: string;
}

export const useLibraryBooks = () => {
  return useQuery({
    queryKey: ['library-books'],
    queryFn: async () => {
      console.log('Fetching library books...');
      
      const { data, error } = await supabase
        .from('books_library')
        .select(`
          id,
          title,
          author,
          genre,
          description,
          author_bio,
          cover_image_url,
          pdf_url,
          isbn,
          publication_year,
          pages,
          language,
          created_at
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching library books:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw error;
      }
      
      console.log('Raw books data from database:', data);
      console.log('Number of books fetched:', data?.length || 0);
      
      const transformedBooks = (data || []).map(book => ({
        id: book.id,
        title: book.title,
        author: book.author || 'Unknown Author',
        genre: book.genre,
        description: book.description,
        author_bio: book.author_bio,
        cover_image_url: book.cover_image_url,
        ebook_url: undefined,
        pdf_url: book.pdf_url,
        price: undefined,
        amazon_url: undefined,
        google_books_url: undefined,
        isbn: book.isbn,
        publication_year: book.publication_year,
        pages: book.pages,
        language: book.language,
        rating: Math.random() * 2 + 3.5,
        created_at: book.created_at || new Date().toISOString(),
      }));
      
      console.log('Transformed books:', transformedBooks);
      console.log('Hindi books:', transformedBooks.filter(book => book.language === 'Hindi'));
      
      return transformedBooks as Book[];
    },
  });
};

export const useBooksByGenre = (genre?: string) => {
  return useQuery({
    queryKey: ['books-by-genre', genre],
    queryFn: async () => {
      console.log('Filtering by genre:', genre);
      
      let query = supabase
        .from('books_library')
        .select(`
          id,
          title,
          author,
          genre,
          description,
          author_bio,
          cover_image_url,
          pdf_url,
          isbn,
          publication_year,
          pages,
          language,
          created_at
        `)
        .order('created_at', { ascending: false });
      
      if (genre && genre !== 'All') {
        // Handle Hindi language filter specifically
        if (genre === 'Hindi') {
          console.log('Applying Hindi language filter');
          query = query.eq('language', 'Hindi');
        } else {
          console.log('Applying genre filter for:', genre);
          query = query.eq('genre', genre);
        }
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching books by genre:', error);
        throw error;
      }
      
      console.log('Filtered books data:', data);
      console.log('Found books count:', data?.length || 0);
      
      const transformedBooks = (data || []).map(book => ({
        id: book.id,
        title: book.title,
        author: book.author || 'Unknown Author',
        genre: book.genre,
        description: book.description,
        author_bio: book.author_bio,
        cover_image_url: book.cover_image_url,
        ebook_url: undefined,
        pdf_url: book.pdf_url,
        price: undefined,
        amazon_url: undefined,
        google_books_url: undefined,
        isbn: book.isbn,
        publication_year: book.publication_year,
        pages: book.pages,
        language: book.language,
        rating: Math.random() * 2 + 3.5,
        created_at: book.created_at || new Date().toISOString(),
      }));
      
      console.log('Transformed filtered books:', transformedBooks);
      
      return transformedBooks as Book[];
    },
  });
};

export const useGenres = () => {
  return useQuery<Genre[]>({
    queryKey: ['genres'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('books_library')
        .select('genre, language')
        .order('genre');
      
      if (error) {
        console.error('Error fetching genres:', error);
        // Return default genres including Hindi
        const genres: Genre[] = [
          { id: '1', name: 'Science' },
          { id: '2', name: 'Fiction' },
          { id: '3', name: 'Non-Fiction' },
          { id: '4', name: 'Biography' },
          { id: '5', name: 'History' },
          { id: '6', name: 'Philosophy' },
          { id: '7', name: 'Technology' },
          { id: '8', name: 'Self-Help' },
          { id: '9', name: 'Hindi' },
          { id: '10', name: 'Devotional' },
        ];
        return genres;
      }
      
      console.log('Genre data from database:', data);
      
      const genreValues = data?.map(item => item.genre).filter(Boolean) || [];
      const languageValues = data?.map(item => item.language).filter(Boolean) || [];
      
      // Combine genres and languages, with special handling for Hindi
      const allValues = [...genreValues, ...languageValues];
      const uniqueValues = [...new Set(allValues.filter((value): value is string => typeof value === 'string' && value !== null))];
      
      // Always include Hindi as a filter option
      if (!uniqueValues.includes('Hindi')) {
        uniqueValues.push('Hindi');
      }
      
      const genres = uniqueValues.map((value, index) => ({
        id: (index + 1).toString(),
        name: value
      })) as Genre[];
      
      console.log('Generated genres:', genres);
      
      return genres;
    },
  });
};
