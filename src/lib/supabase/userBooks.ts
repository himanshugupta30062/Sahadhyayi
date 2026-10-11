import { supabase } from '@/integrations/supabase/client-universal';
import type { Book } from '@/hooks/useLibraryBooks';

export interface CurrentRead {
  id: string;
  book_id: string;
  status: string;
  progress?: number | null;
  last_opened_at?: string | null;
  books_library: Book;
}

export const fetchCurrentReads = async (): Promise<CurrentRead[]> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. Primary: Query the active user_bookshelf table
    if (user?.id) {
      const { data: shelfData, error: shelfErr } = await supabase
        .from('user_bookshelf')
        .select('id, book_id, status, added_at')
        .eq('user_id', user.id)
        .eq('status', 'reading')
        .order('added_at', { ascending: false })
        .limit(6);

      if (!shelfErr && Array.isArray(shelfData) && shelfData.length > 0) {
        const bookIds = shelfData.map((item: any) => item.book_id).filter(Boolean);
        let booksMap = new Map<string, any>();

        if (bookIds.length > 0) {
          const { data: booksLib } = await supabase
            .from('books_library')
            .select('id, title, author, genre, cover_image_url, description, publication_year, language, pdf_url')
            .in('id', bookIds);

          if (booksLib) {
            booksMap = new Map(booksLib.map((b: any) => [b.id, b]));
          }
        }

        return shelfData.map((item: any) => ({
          id: item.id,
          book_id: item.book_id,
          status: item.status || 'reading',
          progress: typeof item.progress === 'number' ? item.progress : null,
          last_opened_at: item.added_at,
          books_library: (booksMap.get(item.book_id) as Book) || {
            id: item.book_id,
            title: 'Untitled Book',
            cover_image_url: null,
          },
        }));
      }
    }

    // 2. Fallback: Query legacy user_books table safely
    if (user?.id) {
      const { data: legacyData, error: legacyErr } = await supabase
        .from('user_books')
        .select('id, book_id, status, progress, last_opened_at')
        .eq('user_id', user.id)
        .eq('status', 'reading')
        .order('last_opened_at', { ascending: false })
        .limit(6);

      if (!legacyErr && Array.isArray(legacyData) && legacyData.length > 0) {
        const bookIds = legacyData.map((d: any) => d.book_id).filter(Boolean);
        let booksMap = new Map<string, any>();

        if (bookIds.length > 0) {
          const { data: booksLib } = await supabase
            .from('books_library')
            .select('id, title, author, cover_image_url, description, genre')
            .in('id', bookIds);

          if (booksLib) {
            booksMap = new Map(booksLib.map((b: any) => [b.id, b]));
          }
        }

        return legacyData.map((item: any) => ({
          id: item.id,
          book_id: item.book_id,
          status: item.status || 'reading',
          progress: item.progress ?? null,
          last_opened_at: item.last_opened_at,
          books_library: (booksMap.get(item.book_id) as Book) || {
            id: item.book_id,
            title: 'Untitled Book',
            cover_image_url: null,
          },
        }));
      }
    }

    return [];
  } catch (err) {
    console.warn('Current reads fetch fallback notice:', err);
    return [];
  }
};

export const updateLastOpenedAt = async (id: string) => {
  try {
    await supabase
      .from('user_bookshelf')
      .update({ added_at: new Date().toISOString() })
      .eq('id', id);
  } catch {
    try {
      await supabase
        .from('user_books')
        .update({ last_opened_at: new Date().toISOString() })
        .eq('id', id);
    } catch {
      // non-fatal
    }
  }
};
