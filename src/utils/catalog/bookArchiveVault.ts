import { supabase } from '@/integrations/supabase/client-universal';
import { verifyAdminStatus } from './duplicateResolution';

export interface ArchivedBookRecord {
  id: string;
  title: string;
  author?: string;
  genre?: string;
  cover_image_url?: string;
  description?: string;
  isbn?: string;
  publication_year?: number;
  pages?: number;
  language?: string;
  pdf_url?: string;
  created_at?: string;
  archived_at: string;
  archive_reason?: string;
}

/**
 * Places an unwanted or redundant book into the archive vault (invisible to regular users).
 * Never deletes the book; preserves all metadata so it can be restored in the future.
 */
export async function archiveUnwantedBook(
  bookId: string,
  reason: string = 'Archived by administrator'
): Promise<{ success: boolean; message: string; bookId: string }> {
  const isAdmin = await verifyAdminStatus();
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin privileges required to archive books.');
  }

  // 1. Try PostgreSQL RPC
  try {
    const { data, error } = await supabase.rpc('archive_unwanted_book', {
      p_book_id: bookId,
      p_reason: reason,
    });

    if (!error && data?.success) {
      return {
        success: true,
        message: data.message || 'Book safely archived to vault.',
        bookId,
      };
    }
  } catch (rpcErr) {
    console.warn('RPC archive_unwanted_book failed, falling back to direct update:', rpcErr);
  }

  // 2. Client-side fallback: fetch book, copy to books_library_archive, mark status = 'archived'
  const { data: book, error: fetchErr } = await supabase
    .from('books_library')
    .select('*')
    .eq('id', bookId)
    .single();

  if (fetchErr || !book) {
    throw new Error(`Book ${bookId} not found in library: ${fetchErr?.message}`);
  }

  // Copy to archive vault table
  await supabase
    .from('books_library_archive' as any)
    .upsert({
      id: book.id,
      title: book.title,
      author: book.author,
      genre: book.genre,
      cover_image_url: book.cover_image_url,
      description: book.description,
      author_bio: book.author_bio,
      isbn: book.isbn,
      publication_year: book.publication_year,
      pages: book.pages,
      language: book.language,
      pdf_url: book.pdf_url,
      created_at: book.created_at,
      archived_at: new Date().toISOString(),
      archive_reason: reason,
      original_data: book,
    });

  // Soft-archive in books_library to hide from users
  const { error: updateErr } = await supabase
    .from('books_library')
    .update({
      status: 'archived',
      archive_reason: reason,
      last_audited_at: new Date().toISOString(),
    })
    .eq('id', bookId);

  if (updateErr) throw updateErr;

  return {
    success: true,
    message: 'Book safely moved to archive vault and hidden from users.',
    bookId,
  };
}

/**
 * Restores an archived book from the vault back into the active library.
 * Makes it visible to all users again in the public catalog.
 */
export async function restoreBookFromArchive(
  bookId: string
): Promise<{ success: boolean; message: string; bookId: string }> {
  const isAdmin = await verifyAdminStatus();
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin privileges required to restore books.');
  }

  // 1. Try PostgreSQL RPC
  try {
    const { data, error } = await supabase.rpc('restore_book_from_archive', {
      p_book_id: bookId,
    });

    if (!error && data?.success) {
      return {
        success: true,
        message: data.message || 'Book restored to active library.',
        bookId,
      };
    }
  } catch (rpcErr) {
    console.warn('RPC restore_book_from_archive failed, falling back to direct update:', rpcErr);
  }

  // 2. Client-side fallback: check books_library_archive, reactivate in books_library
  const { data: archivedBook } = await supabase
    .from('books_library_archive' as any)
    .select('*')
    .eq('id', bookId)
    .single();

  const { data: existingInLibrary } = await supabase
    .from('books_library')
    .select('id')
    .eq('id', bookId)
    .single();

  if (existingInLibrary) {
    await supabase
      .from('books_library')
      .update({
        status: 'active',
        superseded_by_id: null,
        archive_reason: null,
        last_audited_at: new Date().toISOString(),
      })
      .eq('id', bookId);
  } else if (archivedBook) {
    // Re-insert from archive vault
    await supabase.from('books_library').insert({
      id: archivedBook.id,
      title: archivedBook.title,
      author: archivedBook.author,
      genre: archivedBook.genre,
      cover_image_url: archivedBook.cover_image_url,
      description: archivedBook.description,
      author_bio: archivedBook.author_bio,
      isbn: archivedBook.isbn,
      publication_year: archivedBook.publication_year,
      pages: archivedBook.pages,
      language: archivedBook.language,
      pdf_url: archivedBook.pdf_url,
      created_at: archivedBook.created_at,
      status: 'active',
    });
  }

  // Remove from archive vault
  await supabase
    .from('books_library_archive' as any)
    .delete()
    .eq('id', bookId);

  return {
    success: true,
    message: 'Book restored to active library and visible to users.',
    bookId,
  };
}

/**
 * Retrieves all books currently stored in the archive vault.
 * Restricted to administrators only.
 */
export async function getArchivedBooks(): Promise<ArchivedBookRecord[]> {
  const isAdmin = await verifyAdminStatus();
  if (!isAdmin) return [];

  // Try RPC first
  try {
    const { data, error } = await supabase.rpc('get_archived_books');
    if (!error && Array.isArray(data)) {
      return data;
    }
  } catch (rpcErr) {
    console.warn('RPC get_archived_books fallback to direct select:', rpcErr);
  }

  // Fallback: Query books_library_archive table directly, OR query books_library where status = 'archived'
  const { data: archiveTableData } = await supabase
    .from('books_library_archive' as any)
    .select('*')
    .order('archived_at', { ascending: false });

  if (archiveTableData && archiveTableData.length > 0) {
    return archiveTableData;
  }

  // Second fallback: query books_library where status is archived
  const { data: libraryArchived } = await supabase
    .from('books_library')
    .select('*')
    .eq('status', 'archived')
    .order('last_audited_at', { ascending: false });

  return (libraryArchived || []).map((b) => ({
    id: b.id,
    title: b.title,
    author: b.author || undefined,
    genre: b.genre || undefined,
    cover_image_url: b.cover_image_url || undefined,
    description: b.description || undefined,
    isbn: b.isbn || undefined,
    publication_year: b.publication_year || undefined,
    pages: b.pages || undefined,
    language: b.language || undefined,
    pdf_url: b.pdf_url || undefined,
    created_at: b.created_at || undefined,
    archived_at: b.last_audited_at || new Date().toISOString(),
    archive_reason: b.archive_reason || 'Archived record',
  }));
}

/**
 * Runs the safe cleanup of unused older book duplicates.
 * Archives without deleting any book!
 */
export async function runSafeCleanupUnusedBooks(): Promise<number> {
  const isAdmin = await verifyAdminStatus();
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin privileges required to run book cleanup.');
  }

  const { data, error } = await supabase.rpc('cleanup_unused_books');
  if (error) {
    console.warn('cleanup_unused_books error:', error);
    return 0;
  }

  return typeof data === 'number' ? data : 0;
}
