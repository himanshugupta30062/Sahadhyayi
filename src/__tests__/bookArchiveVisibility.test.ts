import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isBookPubliclyVisible,
  filterPublicBooks,
  getPublicBookSelectColumns,
  applyPublicBookFilter,
  recordArchivedBookId,
  removeArchivedBookId,
  setDetectedBookSchemaCapabilities,
  resetBookSchemaCapabilities,
} from '@/utils/catalog/bookVisibility';
import {
  archiveLibraryBook,
  restoreArchivedBook,
} from '@/utils/catalog/bookArchiveVault';
import { searchLibrary } from '@/lib/searchLibrary';
import { supabase } from '@/integrations/supabase/client-universal';

describe('Fix 1: Enforce Archived Book Visibility Across Sahadhyayi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetBookSchemaCapabilities();
    // Clear any local archived IDs
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });

  describe('1. Canonical Public Visibility Rules', () => {
    it('treats active book as publicly visible', () => {
      const activeBook = {
        id: 'book-1',
        title: 'Clean Code',
        status: 'active',
        catalog_status: 'active',
      };
      expect(isBookPubliclyVisible(activeBook)).toBe(true);
    });

    it('preserves legacy books with missing or null status as visible active records', () => {
      const legacyNullStatus = {
        id: 'book-legacy-1',
        title: 'War and Peace',
        status: null,
        catalog_status: null,
      };
      const legacyUndefinedStatus = {
        id: 'book-legacy-2',
        title: 'Anna Karenina',
      };

      expect(isBookPubliclyVisible(legacyNullStatus)).toBe(true);
      expect(isBookPubliclyVisible(legacyUndefinedStatus)).toBe(true);
    });

    it('hides book when status is "archived"', () => {
      const archivedByStatus = {
        id: 'book-arch-1',
        title: 'Archived Edition',
        status: 'archived',
        catalog_status: 'active',
      };
      expect(isBookPubliclyVisible(archivedByStatus)).toBe(false);
    });

    it('hides book when catalog_status is "archived"', () => {
      const archivedByCatalogStatus = {
        id: 'book-arch-2',
        title: 'Archived Vault Book',
        status: 'active',
        catalog_status: 'archived',
      };
      expect(isBookPubliclyVisible(archivedByCatalogStatus)).toBe(false);
    });

    it('hides book when marked with superseded, junk, or low_quality status', () => {
      expect(isBookPubliclyVisible({ id: 'b-junk', title: 'Spam', status: 'junk' })).toBe(false);
      expect(isBookPubliclyVisible({ id: 'b-sup', title: 'Old Dup', catalog_status: 'superseded' })).toBe(false);
      expect(isBookPubliclyVisible({ id: 'b-review', title: 'Unvetted', catalog_status: 'needs_review' })).toBe(false);
    });

    it('hides book when is_archived boolean flag is true', () => {
      const archivedByFlag = {
        id: 'book-flag',
        title: 'Flagged Book',
        status: 'active',
        catalog_status: 'active',
        is_archived: true,
      };
      expect(isBookPubliclyVisible(archivedByFlag)).toBe(false);
    });

    it('hides book immediately if tracked in local archive vault registry', () => {
      const book = { id: 'book-vault-1', title: 'Local Vault Book' };
      expect(isBookPubliclyVisible(book)).toBe(true);

      recordArchivedBookId('book-vault-1');
      expect(isBookPubliclyVisible(book)).toBe(false);

      removeArchivedBookId('book-vault-1');
      expect(isBookPubliclyVisible(book)).toBe(true);
    });
  });

  describe('2. Batch Filtering & List Visibility', () => {
    it('correctly filters a heterogeneous catalogue array preserving legacy rows and hiding archived rows', () => {
      const catalog = [
        { id: '1', title: 'Active 1', status: 'active', catalog_status: 'active' },
        { id: '2', title: 'Legacy Active (null)', status: null, catalog_status: null },
        { id: '3', title: 'Archived by status', status: 'archived', catalog_status: 'active' },
        { id: '4', title: 'Archived by catalog_status', status: 'active', catalog_status: 'archived' },
        { id: '5', title: 'Active 2', status: 'active', catalog_status: 'active' },
        { id: '6', title: 'Junk record', status: 'junk', catalog_status: 'junk' },
      ];

      const visible = filterPublicBooks(catalog);
      expect(visible.map((b) => b.id)).toEqual(['1', '2', '5']);
    });
  });

  describe('3. Schema-Aware Column Selection & Database Filtering', () => {
    it('omits status columns from SELECT if schema lacks them, preventing Postgres 42703 error', () => {
      setDetectedBookSchemaCapabilities({ hasStatus: false, hasCatalogStatus: false });
      const selectCols = getPublicBookSelectColumns();
      expect(selectCols).not.toContain('status');
      expect(selectCols).not.toContain('catalog_status');
      expect(selectCols).toContain('id,title,author');
    });

    it('includes status and catalog_status in SELECT when schema supports them', () => {
      setDetectedBookSchemaCapabilities({ hasStatus: true, hasCatalogStatus: true });
      const selectCols = getPublicBookSelectColumns();
      expect(selectCols).toContain('status');
      expect(selectCols).toContain('catalog_status');
    });

    it('applies database-level or filter only for supported columns', () => {
      setDetectedBookSchemaCapabilities({ hasStatus: true, hasCatalogStatus: true });
      const mockQuery: any = {
        orConditions: [] as string[],
        or(cond: string) {
          this.orConditions.push(cond);
          return this;
        },
      };

      applyPublicBookFilter(mockQuery);
      expect(mockQuery.orConditions).toContain('catalog_status.is.null,catalog_status.eq.active');
      expect(mockQuery.orConditions).toContain('status.is.null,status.eq.active');
    });
  });

  describe('4. Search and Library Public Access', () => {
    it('searchLibrary filters out archived and junk books before returning results', async () => {
      setDetectedBookSchemaCapabilities({ hasStatus: true, hasCatalogStatus: true });

      const mockFrom = vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        abortSignal: vi.fn().mockResolvedValue({
          data: [
            { id: 's1', title: 'Dune Active', status: 'active', catalog_status: 'active', author: 'Frank Herbert' },
            { id: 's2', title: 'Dune Archived', status: 'archived', catalog_status: 'active', author: 'Frank Herbert' },
            { id: 's3', title: 'Dune Legacy', status: null, catalog_status: null, author: 'Frank Herbert' },
          ],
          error: null,
        }),
      } as any);

      const results = await searchLibrary('Dune');
      expect(results.length).toBe(2);
      expect(results.map((b) => b.id)).toEqual(['s1', 's3']);

      mockFrom.mockRestore();
    });
  });

  describe('5. Admin Authorization, Archival, and Restoration Lifecycle', () => {
    it('rejects archive attempt by unauthorized user', async () => {
      const mockGetUser = vi.spyOn(supabase.auth, 'getUser').mockResolvedValueOnce({
        data: { user: null },
        error: null,
      } as any);

      await expect(
        archiveLibraryBook('target-book-1', 'Admin archive test')
      ).rejects.toThrow(/Unauthorized/);

      mockGetUser.mockRestore();
    });

    it('rejects restore attempt by unauthorized user', async () => {
      const mockGetUser = vi.spyOn(supabase.auth, 'getUser').mockResolvedValueOnce({
        data: { user: null },
        error: null,
      } as any);

      await expect(
        restoreArchivedBook('target-book-1')
      ).rejects.toThrow(/Unauthorized/);

      mockGetUser.mockRestore();
    });

    it('successfully archives a book and makes it immediately hidden, then restores it and makes it visible again', async () => {
      // Mock authenticated admin user
      const mockGetUser = vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: { id: 'admin-uuid', email: 'admin@sahadhyayi.com' } },
        error: null,
      } as any);

      // Mock admin check profile RPC
      const mockRpc = vi.spyOn(supabase, 'rpc').mockImplementation(async (fn: string, params: any) => {
        if (fn === 'is_admin' || fn === 'is_app_admin') {
          return { data: true, error: null } as any;
        }
        if (fn === 'archive_library_book') {
          return {
            data: {
              success: true,
              message: 'Book safely archived.',
              archive_id: 'arch-100',
              catalog_status: 'archived',
            },
            error: null,
          } as any;
        }
        if (fn === 'restore_library_book') {
          return {
            data: {
              success: true,
              message: 'Book successfully restored.',
              catalog_status: 'active',
            },
            error: null,
          } as any;
        }
        return { data: null, error: null } as any;
      });

      const book = { id: 'test-lifecycle-book', title: 'Target Book', status: 'active' };

      // 1. Initially visible
      expect(isBookPubliclyVisible(book)).toBe(true);

      // 2. Admin archives the book
      const archiveResult = await archiveLibraryBook('test-lifecycle-book', 'Unwanted edition');
      expect(archiveResult.success).toBe(true);

      // 3. Immediately hidden from public views
      expect(isBookPubliclyVisible(book)).toBe(false);

      // 4. Admin restores the book
      const restoreResult = await restoreArchivedBook('test-lifecycle-book');
      expect(restoreResult.success).toBe(true);

      // 5. Immediately visible again
      expect(isBookPubliclyVisible(book)).toBe(true);

      mockGetUser.mockRestore();
      mockRpc.mockRestore();
    });
  });
});

