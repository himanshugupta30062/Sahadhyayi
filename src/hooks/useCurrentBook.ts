
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

      // First try to get from user's reading progress
      const { data: progressData } = await supabase
        .from('detailed_reading_progress')
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
        .is('completed_at', null)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (progressData?.books_library) {
        return {
          id: progressData.books_library.id,
          title: progressData.books_library.title,
          author: progressData.books_library.author,
          cover_image_url: progressData.books_library.cover_image_url,
        } as CurrentBook;
      }

      // Fallback to user bookshelf with 'reading' status
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
        return {
          id: bookshelfData.books_library.id,
          title: bookshelfData.books_library.title,
          author: bookshelfData.books_library.author,
          cover_image_url: bookshelfData.books_library.cover_image_url,
        } as CurrentBook;
      }

      return null;
    },
    enabled: !!user?.id,
  });
};
