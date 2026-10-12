import { supabase } from '@/integrations/supabase/client-universal';

/**
 * Storage key for persisting IDs of books archived locally or pending sync.
 * This guarantees that even if the remote database has not yet applied the schema migration,
 * any record archived by an administrator is immediately and strictly hidden from all public catalog views.
 */
const LOCAL_ARCHIVED_IDS_KEY = 'sahadhyayi_archived_book_ids_v1';

/**
 * In-memory set of archived book IDs for zero-latency synchronous checks.
 */
const inMemoryArchivedIds = new Set<string>();

// Initialize in-memory set from localStorage if in a browser environment
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const raw = localStorage.getItem(LOCAL_ARCHIVED_IDS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((id: string) => {
          if (typeof id === 'string') inMemoryArchivedIds.add(id);
        });
      }
    }
  } catch {
    // Ignore localStorage parse errors
  }
}

/**
 * Retrieve all currently registered locally archived book IDs.
 */
export function getLocalArchivedBookIds(): string[] {
  return Array.from(inMemoryArchivedIds);
}

/**
 * Check if a book ID is recorded in the local archive vault.
 */
export function isBookArchivedInLocalVault(bookId?: string | null): boolean {
  if (!bookId) return false;
  return inMemoryArchivedIds.has(bookId);
}

/**
 * Register a book ID as archived.
 */
export function recordArchivedBookId(bookId: string): void {
  if (!bookId) return;
  inMemoryArchivedIds.add(bookId);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(LOCAL_ARCHIVED_IDS_KEY, JSON.stringify(Array.from(inMemoryArchivedIds)));
    }
  } catch {
    // Ignore quota errors
  }
}

/**
 * Remove a book ID from the local archive registry (upon restoration).
 */
export function removeArchivedBookId(bookId: string): void {
  if (!bookId) return;
  inMemoryArchivedIds.delete(bookId);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(LOCAL_ARCHIVED_IDS_KEY, JSON.stringify(Array.from(inMemoryArchivedIds)));
    }
  } catch {
    // Ignore quota errors
  }
}

/**
 * Canonical test determining whether a book record is publicly visible.
 *
 * Rules:
 * 1. Must be a valid non-null object.
 * 2. If present in local archive vault -> NOT visible.
 * 3. If `catalog_status` is explicitly set and not 'active' (e.g. 'archived', 'superseded', 'junk', 'needs_review') -> NOT visible.
 * 4. If `status` is explicitly set and not 'active' (e.g. 'archived', 'superseded', 'junk') -> NOT visible.
 * 5. If `is_archived` boolean is true -> NOT visible.
 * 6. If both status fields are null/undefined (legacy active books) or explicitly 'active' -> VISIBLE.
 */
export function isBookPubliclyVisible(book: any): boolean {
  if (!book || typeof book !== 'object') return false;

  // Check local archive registry
  if (book.id && inMemoryArchivedIds.has(book.id)) {
    return false;
  }

  // Check catalog_status if present
  if (typeof book.catalog_status === 'string') {
    const cs = book.catalog_status.trim().toLowerCase();
    if (cs !== 'active') return false;
  }

  // Check status if present
  if (typeof book.status === 'string') {
    const s = book.status.trim().toLowerCase();
    if (s !== 'active') return false;
  }

  // Check boolean flag if present
  if (book.is_archived === true) {
    return false;
  }

  return true;
}

/**
 * Filter an array of books to include only publicly visible records.
 */
export function filterPublicBooks<T>(books: T[]): T[] {
  if (!Array.isArray(books)) return [];
  return books.filter(isBookPubliclyVisible);
}

/**
 * Baseline columns guaranteed to exist in books_library across all schema versions.
 */
export const BASE_BOOK_SELECT_COLUMNS =
  'id,title,author,genre,cover_image_url,description,publication_year,language,pdf_url,created_at,isbn,pages,author_bio';

export interface BookSchemaCapabilities {
  hasStatus: boolean;
  hasCatalogStatus: boolean;
  checked: boolean;
}

let cachedCapabilities: BookSchemaCapabilities | null = null;

/**
 * Probe database schema capabilities once and cache the result.
 * Detects whether `status` and `catalog_status` columns exist on `books_library`.
 */
export async function detectBookSchemaCapabilities(): Promise<BookSchemaCapabilities> {
  if (cachedCapabilities && cachedCapabilities.checked) {
    return cachedCapabilities;
  }

  try {
    // Attempt single fast probe for both status columns
    const { error: bothError } = await supabase
      .from('books_library')
      .select('status, catalog_status')
      .limit(1);

    if (!bothError) {
      cachedCapabilities = { hasStatus: true, hasCatalogStatus: true, checked: true };
      return cachedCapabilities;
    }

    // If both failed, probe individually
    const [statusRes, catalogStatusRes] = await Promise.all([
      supabase.from('books_library').select('status').limit(1),
      supabase.from('books_library').select('catalog_status').limit(1),
    ]);

    cachedCapabilities = {
      hasStatus: !statusRes.error,
      hasCatalogStatus: !catalogStatusRes.error,
      checked: true,
    };
    return cachedCapabilities;
  } catch {
    cachedCapabilities = { hasStatus: false, hasCatalogStatus: false, checked: true };
    return cachedCapabilities;
  }
}

/**
 * Allow test suites or environment initializers to configure schema capabilities directly.
 */
export function setDetectedBookSchemaCapabilities(capabilities: Partial<BookSchemaCapabilities>): void {
  cachedCapabilities = {
    hasStatus: capabilities.hasStatus ?? false,
    hasCatalogStatus: capabilities.hasCatalogStatus ?? false,
    checked: true,
  };
}

/**
 * Reset schema capability detection cache.
 */
export function resetBookSchemaCapabilities(): void {
  cachedCapabilities = null;
}

/**
 * Construct safe SELECT column string including status fields only when supported by the schema.
 */
export function getPublicBookSelectColumns(capabilities?: BookSchemaCapabilities | null): string {
  const caps = capabilities || cachedCapabilities;
  const cols = [BASE_BOOK_SELECT_COLUMNS];
  if (caps?.hasStatus) cols.push('status');
  if (caps?.hasCatalogStatus) cols.push('catalog_status');
  return cols.join(',');
}

/**
 * Apply database-level visibility filters to a Supabase PostgREST query.
 * Filters out archived, superseded, and junk records before limits, pagination, and counts.
 */
export function applyPublicBookFilter<T>(
  query: T,
  capabilities?: BookSchemaCapabilities | null
): T {
  const caps = capabilities || cachedCapabilities;
  let q: any = query;

  if (caps?.hasCatalogStatus) {
    q = q.or('catalog_status.is.null,catalog_status.eq.active');
  }
  if (caps?.hasStatus) {
    q = q.or('status.is.null,status.eq.active');
  }

  // Also exclude any IDs in the local archive registry
  const archivedIds = getLocalArchivedBookIds();
  if (archivedIds.length > 0 && archivedIds.length <= 100) {
    q = q.not('id', 'in', `(${archivedIds.join(',')})`);
  }

  return q as T;
}

