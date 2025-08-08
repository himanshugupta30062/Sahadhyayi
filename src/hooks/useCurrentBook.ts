
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CurrentBook {
  id: string;
  title: string;
  author?: string;
  cover_image_url?: string;
}

export const useCurrentBook = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['current-book', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Try to get from user bookshelf with 'reading' status
      const { data: bookshelfData } = await supabase
        .from('user_bookshelf')
        .select(`
          book_id,
          books_library!inner(
            id,
            title,
            author,
            cover_image_url
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'reading')
        .order('added_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (bookshelfData?.books_library) {
        const book = Array.isArray(bookshelfData.books_library)
          ? bookshelfData.books_library[0]
          : bookshelfData.books_library;
        if (book) {
          return {
            id: book.id,
            title: book.title,
            author: book.author,
            cover_image_url: book.cover_image_url,
          } as CurrentBook;
        }
      }

      return null;
    },
    enabled: !!user?.id,
  });
};
