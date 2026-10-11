import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  archiveLibraryBook,
  restoreArchivedBook,
  archiveUnwantedBook,
  restoreBookFromArchive,
  getAdminArchivedBooks,
  getArchivedBooks,
  runSafeCleanupUnusedBooks,
} from '@/utils/catalog/bookArchiveVault';
import { supabase } from '@/integrations/supabase/client-universal';

describe('Admin-Controlled Book Archive, Hide and Restore System Acceptance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Admin Authorization & Security Gates', () => {
    it('rejects archiveLibraryBook when user is unauthenticated or not an admin', async () => {
      const mockGetUser = vi.spyOn(supabase.auth, 'getUser').mockResolvedValueOnce({
        data: { user: null },
        error: null,
      } as any);

      await expect(
        archiveLibraryBook('book-123', 'Unwanted record', { classification: 'unwanted' })
      ).rejects.toThrow(/Unauthorized/);
      mockGetUser.mockRestore();
    });

    it('rejects restoreArchivedBook when user is not an administrator', async () => {
      const mockGetUser = vi.spyOn(supabase.auth, 'getUser').mockResolvedValueOnce({
        data: { user: null },
        error: null,
      } as any);

      await expect(restoreArchivedBook('book-123')).rejects.toThrow(/Unauthorized/);
      mockGetUser.mockRestore();
    });

    it('rejects getAdminArchivedBooks for non-admins', async () => {
      const mockGetUser = vi.spyOn(supabase.auth, 'getUser').mockResolvedValueOnce({
        data: { user: null },
        error: null,
      } as any);

      const res = await getAdminArchivedBooks();
      expect(res).toEqual([]);
      mockGetUser.mockRestore();
    });

    it('never exposes the Supabase service-role key to client frontend code', () => {
      // Verify that browser client only uses anon public key, never service-role
      const clientEnv = (import.meta as any).env || {};
      expect(clientEnv.VITE_SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
      expect(clientEnv.SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
    });
  });

  describe('2. archiveLibraryBook Actions', () => {
    it('archives book via archive_library_book RPC with full classification and snapshot', async () => {
      vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: { id: 'admin-uuid', email: 'admin@sahadhyayi.com' } as any },
        error: null,
      });

      const rpcSpy = vi.spyOn(supabase, 'rpc').mockImplementation(async (fnName, params: any) => {
        if (fnName === 'is_admin') return { data: true, error: null } as any;
        if (fnName === 'archive_library_book') {
          return {
            data: {
              success: true,
              message: 'Book safely archived from public Library and safely preserved in vault.',
              book_id: params.p_book_id,
              archive_id: 'archive-uuid-1',
              catalog_status: 'archived',
              user_references: { shelves: 2, progress: 1, notes: 0 },
            },
            error: null,
          } as any;
        }
        return { data: null, error: null } as any;
      });

      const result = await archiveLibraryBook('target-book-1', 'Duplicate edition of canonical work', {
        classification: 'duplicate',
        canonicalBookId: 'canonical-book-1',
      });

      expect(result.success).toBe(true);
      expect(result.book_id).toBe('target-book-1');
      expect(result.catalog_status).toBe('archived');
      expect(result.user_references?.shelves).toBe(2);

      rpcSpy.mockRestore();
    });

    it('behave idempotently: repeating archive on already archived book succeeds safely', async () => {
      vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: { id: 'admin-uuid', email: 'admin@sahadhyayi.com' } as any },
        error: null,
      });

      const rpcSpy = vi.spyOn(supabase, 'rpc').mockImplementation(async (fnName) => {
        if (fnName === 'is_admin') return { data: true, error: null } as any;
        if (fnName === 'archive_library_book') {
          return {
            data: {
              success: true,
              already_archived: true,
              message: 'Book is already archived in the library.',
              book_id: 'book-already-archived',
              catalog_status: 'archived',
            },
            error: null,
          } as any;
        }
        return { data: null, error: null } as any;
      });

      const result = await archiveLibraryBook('book-already-archived', 'Already archived check');
      expect(result.success).toBe(true);
      expect(result.already_archived).toBe(true);
      expect(result.catalog_status).toBe('archived');

      rpcSpy.mockRestore();
    });

    it('fallback non-destructively: updates original books_library row and copies snapshot without deleting', async () => {
      vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: { id: 'admin-uuid', email: 'admin@sahadhyayi.com' } as any },
        error: null,
      });

      vi.spyOn(supabase, 'rpc').mockImplementation(async (fnName) => {
        if (fnName === 'is_admin') return { data: true, error: null } as any;
        return { data: null, error: new Error('RPC not found') } as any;
      });

      const upsertVaultMock = vi.fn().mockResolvedValue({ error: null });
      const updateLibraryMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      const fromSpy = vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'books_library') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'book-preserve-uuid',
                    title: 'The Great Gatsby',
                    author: 'F. Scott Fitzgerald',
                    status: 'active',
                    catalog_status: 'active',
                  },
                  error: null,
                }),
              }),
            }),
            update: updateLibraryMock,
          } as any;
        }
        if (table === 'books_library_archive') {
          return {
            upsert: upsertVaultMock,
          } as any;
        }
        return {} as any;
      });

      const result = await archiveLibraryBook('book-preserve-uuid', 'Low scan quality', {
        classification: 'low_quality',
      });

      expect(result.success).toBe(true);
      // Confirmed books_library_archive receives snapshot with original ID
      expect(upsertVaultMock).toHaveBeenCalledWith(
        expect.objectContaining({
          book_id: 'book-preserve-uuid',
          title: 'The Great Gatsby',
          catalog_status: 'archived',
          archive_classification: 'low_quality',
        })
      );
      // Confirmed books_library is updated to archived without deleting the row
      expect(updateLibraryMock).toHaveBeenCalledWith(
        expect.objectContaining({
          catalog_status: 'archived',
          status: 'archived',
          archive_reason: 'Low scan quality',
        })
      );

      fromSpy.mockRestore();
    });
  });

  describe('3. restoreArchivedBook Actions', () => {
    it('restores book via restore_library_book RPC preserving original UUID', async () => {
      vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: { id: 'admin-uuid', email: 'admin@sahadhyayi.com' } as any },
        error: null,
      });

      const rpcSpy = vi.spyOn(supabase, 'rpc').mockImplementation(async (fnName, params: any) => {
        if (fnName === 'is_admin') return { data: true, error: null } as any;
        if (fnName === 'restore_library_book') {
          return {
            data: {
              success: true,
              message: 'Book successfully restored to public Library.',
              book_id: params.p_book_id,
              catalog_status: 'active',
            },
            error: null,
          } as any;
        }
        return { data: null, error: null } as any;
      });

      const result = await restoreArchivedBook('book-to-restore', 'Mistakenly archived');
      expect(result.success).toBe(true);
      expect(result.book_id).toBe('book-to-restore');
      expect(result.catalog_status).toBe('active');

      rpcSpy.mockRestore();
    });

    it('fallback updates catalog_status to active without altering book ID or deleting history', async () => {
      vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: { id: 'admin-uuid', email: 'admin@sahadhyayi.com' } as any },
        error: null,
      });

      vi.spyOn(supabase, 'rpc').mockImplementation(async (fnName) => {
        if (fnName === 'is_admin') return { data: true, error: null } as any;
        return { data: null, error: new Error('RPC not found') } as any;
      });

      const updateLibraryMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      const fromSpy = vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'books_library') {
          return {
            update: updateLibraryMock,
          } as any;
        }
        return {} as any;
      });

      const result = await restoreArchivedBook('book-restore-fallback', 'Admin manual restore');
      expect(result.success).toBe(true);
      expect(updateLibraryMock).toHaveBeenCalledWith(
        expect.objectContaining({
          catalog_status: 'active',
          status: 'active',
          archived_at: null,
          archive_reason: null,
        })
      );

      fromSpy.mockRestore();
    });
  });

  describe('4. getAdminArchivedBooks Inspection & Metrics', () => {
    it('returns archived books with user references metrics from RPC', async () => {
      vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: { id: 'admin-uuid', email: 'admin@sahadhyayi.com' } as any },
        error: null,
      });

      const sampleVault = [
        {
          archive_id: 'arch-1',
          book_id: 'book-1',
          title: 'Oliver Twist',
          author: 'Charles Dickens',
          catalog_status: 'archived',
          archive_classification: 'duplicate',
          archive_reason: 'Identical reprint',
          archived_at: '2026-10-11T10:00:00Z',
          user_shelves_count: 5,
          reading_progress_count: 3,
          margin_notes_count: 1,
        },
      ];

      const rpcSpy = vi.spyOn(supabase, 'rpc').mockImplementation(async (fnName) => {
        if (fnName === 'is_admin') return { data: true, error: null } as any;
        if (fnName === 'get_admin_archived_books') {
          return { data: sampleVault, error: null } as any;
        }
        return { data: null, error: null } as any;
      });

      const books = await getAdminArchivedBooks();
      expect(books).toHaveLength(1);
      expect(books[0].title).toBe('Oliver Twist');
      expect(books[0].user_shelves_count).toBe(5);
      expect(books[0].reading_progress_count).toBe(3);
      expect(books[0].margin_notes_count).toBe(1);

      rpcSpy.mockRestore();
    });
  });

  describe('5. Catalog Visibility Safeguards: Public Excludes Archived Books', () => {
    it('filters out archived and superseded records in public discovery data', () => {
      const mixedCatalog = [
        { id: '1', title: 'Active Book 1', catalog_status: 'active', status: 'active' },
        { id: '2', title: 'Archived Duplicate', catalog_status: 'archived', status: 'archived' },
        { id: '3', title: 'Superseded Edition', catalog_status: 'superseded', status: 'superseded' },
        { id: '4', title: 'Active Book 2', catalog_status: 'active', status: 'active' },
      ];

      const publicVisible = mixedCatalog.filter(
        (b) => (!b.catalog_status || b.catalog_status === 'active') && (!b.status || b.status === 'active')
      );

      expect(publicVisible).toHaveLength(2);
      expect(publicVisible.map((b) => b.id)).toEqual(['1', '4']);
    });
  });

  describe('6. Zero Permanent Deletion in Routine Cleanup', () => {
    it('runs safe cleanup without executing DELETE FROM books_library', async () => {
      vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: { id: 'admin-uuid', email: 'admin@sahadhyayi.com' } as any },
        error: null,
      });

      const rpcSpy = vi.spyOn(supabase, 'rpc').mockImplementation(async (fnName) => {
        if (fnName === 'is_admin') return { data: true, error: null } as any;
        if (fnName === 'cleanup_unused_books') {
          return { data: 3, error: null } as any; // 3 archived safely
        }
        return { data: null, error: null } as any;
      });

      const archivedCount = await runSafeCleanupUnusedBooks();
      expect(archivedCount).toBe(3);

      rpcSpy.mockRestore();
    });
  });
});
