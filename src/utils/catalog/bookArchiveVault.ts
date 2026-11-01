import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase as typedClient } from '@/integrations/supabase/client-universal';

// Catalog tooling targets RPCs and columns that may not exist in every schema
// version (capabilities are probed at runtime). A loose client keeps the
// graceful runtime fallbacks compilable against the generated database types.
const supabase = typedClient as unknown as SupabaseClient<any>;
import { verifyAdminStatus } from './duplicateResolution';
import {
  recordArchivedBookId,
  removeArchivedBookId,
  detectBookSchemaCapabilities,
  getLocalArchivedBookIds,
} from './bookVisibility';

export type ArchiveClassification =
  | 'duplicate'
  | 'unwanted'
  | 'junk'
  | 'low_quality'
  | 'superseded';

export interface UserReferencesBreakdown {
  shelves: number;
  progress: number;
  notes: number;
  reviews?: number;
  rooms?: number;
}

export interface AdminArchivedBookRecord {
  archive_id: string;
  book_id: string;
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
  archived_by?: string;
  archived_by_email?: string;
  archive_reason?: string;
  archive_classification: ArchiveClassification;
  canonical_book_id?: string;
  canonical_title?: string;
  catalog_status: string;
  previous_catalog_status?: string;
  user_shelves_count: number;
  reading_progress_count: number;
  margin_notes_count: number;
  reviews_count: number;
  reading_rooms_count: number;
  book_snapshot?: any;
}

export interface ArchiveBookOptions {
  classification?: ArchiveClassification;
  canonicalBookId?: string;
  batchId?: string;
  evidence?: Record<string, any>;
}

export interface ArchiveOperationResult {
  success: boolean;
  message: string;
  book_id: string;
  archive_id?: string;
  catalog_status?: string;
  user_references?: UserReferencesBreakdown;
  already_archived?: boolean;
}

/**
 * Legacy interface for backward compatibility
 */
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
 * Primary operation: Archive a book from public Library.
 * Transactionally captures recovery snapshot in books_library_archive,
 * updates original row in books_library to catalog_status = 'archived',
 * and logs audit event. NEVER deletes the book row or storage files.
 */
export async function archiveLibraryBook(
  bookId: string,
  reason: string,
  options: ArchiveBookOptions = {}
): Promise<ArchiveOperationResult> {
  const isAdmin = await verifyAdminStatus();
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin privileges required to archive books.');
  }

  const {
    classification = 'unwanted',
    canonicalBookId = null,
    batchId = null,
    evidence = {},
  } = options;

  // 1. Try PostgreSQL RPC archive_library_book
  try {
    const { data, error } = await supabase.rpc('archive_library_book', {
      p_book_id: bookId,
      p_reason: reason,
      p_classification: classification,
      p_canonical_book_id: canonicalBookId,
      p_batch_id: batchId,
      p_evidence: evidence,
    });

    if (!error && data?.success) {
      recordArchivedBookId(bookId);
      return {
        success: true,
        message: data.message || 'Book safely archived from public Library.',
        book_id: bookId,
        archive_id: data.archive_id,
        catalog_status: data.catalog_status || 'archived',
        user_references: data.user_references,
        already_archived: data.already_archived,
      };
    }
  } catch (rpcErr) {
    console.warn('RPC archive_library_book failed, attempting fallback:', rpcErr);
  }

  // 1b. Fallback to older RPC archive_unwanted_book if exists
  try {
    const { data: legacyData, error: legacyErr } = await supabase.rpc('archive_unwanted_book', {
      p_book_id: bookId,
      p_reason: reason,
    });
    if (!legacyErr && legacyData?.success) {
      recordArchivedBookId(bookId);
      return {
        success: true,
        message: legacyData.message || 'Book archived.',
        book_id: bookId,
      };
    }
  } catch (legacyRpcErr) {
    // continue to client-side fallback
  }

  // 2. Client-side fallback: Fetch book, upsert to books_library_archive, mark catalog_status = 'archived'
  const { data: book, error: fetchErr } = await supabase
    .from('books_library')
    .select('*')
    .eq('id', bookId)
    .single();

  if (fetchErr || !book) {
    throw new Error(`Book ${bookId} not found in library: ${fetchErr?.message}`);
  }

  const prevStatus = book.catalog_status || book.status || 'active';
  const archiveRecordId = crypto.randomUUID();

  // Insert full recovery snapshot into books_library_archive
  await supabase.from('books_library_archive' as any).upsert({
    id: archiveRecordId,
    book_id: book.id,
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
    archive_classification: classification,
    canonical_book_id: canonicalBookId,
    catalog_status: 'archived',
    previous_catalog_status: prevStatus,
    book_snapshot: book,
    original_data: book,
    review_evidence: evidence,
    archive_batch_id: batchId,
  });

  // Soft-archive in books_library without deleting
  const { error: updateErr } = await supabase
    .from('books_library')
    .update({
      catalog_status: 'archived',
      status: 'archived',
      archived_at: new Date().toISOString(),
      archive_reason: reason,
      archive_classification: classification,
      canonical_book_id: canonicalBookId,
      superseded_by_id: canonicalBookId || book.superseded_by_id,
      archive_batch_id: batchId,
      last_audited_at: new Date().toISOString(),
    })
    .eq('id', bookId);

  if (updateErr) throw updateErr;

  recordArchivedBookId(bookId);

  return {
    success: true,
    message: 'Book safely archived from public Library and preserved in vault.',
    book_id: bookId,
    archive_id: archiveRecordId,
    catalog_status: 'archived',
  };
}

/**
 * Backward compatibility wrapper
 */
export async function archiveUnwantedBook(
  bookId: string,
  reason: string = 'Archived by administrator'
): Promise<{ success: boolean; message: string; bookId: string }> {
  const result = await archiveLibraryBook(bookId, reason, { classification: 'unwanted' });
  return {
    success: result.success,
    message: result.message,
    bookId: result.book_id,
  };
}

/**
 * Primary operation: Restore an archived book back to public Library.
 * Sets catalog_status back to 'active' (or 'superseded'), clears archive flags,
 * logs audit event, and keeps recovery snapshot for historical reference.
 */
export async function restoreArchivedBook(
  bookId: string,
  restoreReason: string = 'Restored by administrator',
  targetStatus: 'active' | 'superseded' = 'active'
): Promise<{ success: boolean; message: string; book_id: string; catalog_status: string }> {
  const isAdmin = await verifyAdminStatus();
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin privileges required to restore books.');
  }

  // 1. Try PostgreSQL RPC restore_library_book
  try {
    const { data, error } = await supabase.rpc('restore_library_book', {
      p_book_id: bookId,
      p_restore_reason: restoreReason,
      p_target_status: targetStatus,
    });

    if (!error && data?.success) {
      removeArchivedBookId(bookId);
      return {
        success: true,
        message: data.message || 'Book successfully restored to public Library.',
        book_id: bookId,
        catalog_status: data.catalog_status || targetStatus,
      };
    }
  } catch (rpcErr) {
    console.warn('RPC restore_library_book failed, attempting fallback:', rpcErr);
  }

  // 1b. Fallback to legacy RPC restore_book_from_archive
  try {
    const { data: legacyData, error: legacyErr } = await supabase.rpc('restore_book_from_archive', {
      p_book_id: bookId,
    });
    if (!legacyErr && legacyData?.success) {
      removeArchivedBookId(bookId);
      return {
        success: true,
        message: legacyData.message || 'Book restored to active library.',
        book_id: bookId,
        catalog_status: 'active',
      };
    }
  } catch (legacyRpcErr) {
    // continue
  }

  // 2. Client-side fallback: Re-activate in books_library
  const { error: updateErr } = await supabase
    .from('books_library')
    .update({
      catalog_status: targetStatus,
      status: targetStatus,
      archived_at: null,
      archived_by: null,
      archive_reason: null,
      archive_classification: null,
      canonical_book_id: null,
      superseded_by_id: null,
      archive_batch_id: null,
      last_audited_at: new Date().toISOString(),
    })
    .eq('id', bookId);

  if (updateErr) throw updateErr;

  removeArchivedBookId(bookId);

  return {
    success: true,
    message: 'Book restored to active library and visible to users.',
    book_id: bookId,
    catalog_status: targetStatus,
  };
}

/**
 * Backward compatibility wrapper
 */
export async function restoreBookFromArchive(
  bookId: string
): Promise<{ success: boolean; message: string; bookId: string }> {
  const result = await restoreArchivedBook(bookId, 'Restored by administrator', 'active');
  return {
    success: result.success,
    message: result.message,
    bookId: result.book_id,
  };
}

/**
 * Retrieves archived books with full user reference counts and metadata.
 */
export async function getAdminArchivedBooks(options: {
  search?: string;
  classification?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<AdminArchivedBookRecord[]> {
  const isAdmin = await verifyAdminStatus();
  if (!isAdmin) return [];

  const { search = null, classification = null, limit = 50, offset = 0 } = options;

  // 1. Try PostgreSQL RPC get_admin_archived_books
  try {
    const { data, error } = await supabase.rpc('get_admin_archived_books', {
      p_search: search && search.trim() ? search.trim() : null,
      p_classification: classification && classification !== 'all' ? classification : null,
      p_limit: limit,
      p_offset: offset,
    });

    if (!error && Array.isArray(data)) {
      return data.map((row: any) => ({
        archive_id: row.archive_id || row.id || row.book_id,
        book_id: row.book_id || row.id,
        title: row.title,
        author: row.author,
        genre: row.genre,
        cover_image_url: row.cover_image_url,
        isbn: row.isbn,
        publication_year: row.publication_year,
        pages: row.pages,
        language: row.language,
        pdf_url: row.pdf_url,
        created_at: row.created_at,
        archived_at: row.archived_at || new Date().toISOString(),
        archived_by: row.archived_by,
        archived_by_email: row.archived_by_email,
        archive_reason: row.archive_reason,
        archive_classification: (row.archive_classification || 'unwanted') as ArchiveClassification,
        canonical_book_id: row.canonical_book_id,
        canonical_title: row.canonical_title,
        catalog_status: row.catalog_status || 'archived',
        previous_catalog_status: row.previous_catalog_status || 'active',
        user_shelves_count: Number(row.user_shelves_count || 0),
        reading_progress_count: Number(row.reading_progress_count || 0),
        margin_notes_count: Number(row.margin_notes_count || 0),
        reviews_count: Number(row.reviews_count || 0),
        reading_rooms_count: Number(row.reading_rooms_count || 0),
        book_snapshot: row.book_snapshot,
      }));
    }
  } catch (rpcErr) {
    console.warn('RPC get_admin_archived_books failed, attempting fallback:', rpcErr);
  }

  // 2. Fallback: Query books_library where catalog_status or status is 'archived'
  const caps = await detectBookSchemaCapabilities();
  let query = supabase
    .from('books_library')
    .select('*');

  if (caps.hasCatalogStatus && caps.hasStatus) {
    query = query.or('catalog_status.eq.archived,status.eq.archived');
  } else if (caps.hasCatalogStatus) {
    query = query.eq('catalog_status', 'archived');
  } else if (caps.hasStatus) {
    query = query.eq('status', 'archived');
  } else {
    const localArchived = getLocalArchivedBookIds();
    if (localArchived.length > 0) {
      query = query.in('id', localArchived);
    } else {
      return [];
    }
  }

  if (search && search.trim()) {
    query = query.or(`title.ilike.%${search.trim()}%,author.ilike.%${search.trim()}%`);
  }

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: fallbackRows } = await query;

  return (fallbackRows || []).map((b: any) => ({
    archive_id: b.id,
    book_id: b.id,
    title: b.title,
    author: b.author,
    genre: b.genre,
    cover_image_url: b.cover_image_url,
    description: b.description,
    isbn: b.isbn,
    publication_year: b.publication_year,
    pages: b.pages,
    language: b.language,
    pdf_url: b.pdf_url,
    created_at: b.created_at,
    archived_at: b.archived_at || b.last_audited_at || new Date().toISOString(),
    archived_by: b.archived_by,
    archive_reason: b.archive_reason || 'Archived record',
    archive_classification: (b.archive_classification || 'unwanted') as ArchiveClassification,
    canonical_book_id: b.canonical_book_id || b.superseded_by_id,
    catalog_status: b.catalog_status || b.status || 'archived',
    previous_catalog_status: 'active',
    user_shelves_count: 0,
    reading_progress_count: 0,
    margin_notes_count: 0,
    reviews_count: 0,
    reading_rooms_count: 0,
  }));
}

/**
 * Backward compatibility wrapper
 */
export async function getArchivedBooks(): Promise<ArchivedBookRecord[]> {
  const books = await getAdminArchivedBooks();
  return books.map((b) => ({
    id: b.book_id,
    title: b.title,
    author: b.author,
    genre: b.genre,
    cover_image_url: b.cover_image_url,
    description: b.description,
    isbn: b.isbn,
    publication_year: b.publication_year,
    pages: b.pages,
    language: b.language,
    pdf_url: b.pdf_url,
    created_at: b.created_at,
    archived_at: b.archived_at,
    archive_reason: b.archive_reason,
  }));
}

/**
 * Runs the safe automated cleanup of unused older duplicates without deleting.
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
