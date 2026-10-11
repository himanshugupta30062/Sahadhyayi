import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  archiveUnwantedBook,
  restoreBookFromArchive,
  getArchivedBooks,
  runSafeCleanupUnusedBooks,
} from '@/utils/catalog/bookArchiveVault';
import { supabase } from '@/integrations/supabase/client-universal';

describe('Book Archive Vault & Non-Destructive Cleanup Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authorization checks', () => {
    it('rejects archiveUnwantedBook when user is not an administrator', async () => {
      const mockGetUser = vi.spyOn(supabase.auth, 'getUser').mockResolvedValueOnce({
        data: { user: null },
        error: null,
      } as any);

      await expect(archiveUnwantedBook('book-123', 'Unwanted book')).rejects.toThrow(/Unauthorized/);
      mockGetUser.mockRestore();
    });

    it('rejects restoreBookFromArchive when user is not an administrator', async () => {
      const mockGetUser = vi.spyOn(supabase.auth, 'getUser').mockResolvedValueOnce({
        data: { user: null },
        error: null,
      } as any);

      await expect(restoreBookFromArchive('book-123')).rejects.toThrow(/Unauthorized/);
      mockGetUser.mockRestore();
    });

    it('rejects runSafeCleanupUnusedBooks when user is not an administrator', async () => {
      const mockGetUser = vi.spyOn(supabase.auth, 'getUser').mockResolvedValueOnce({
        data: { user: null },
        error: null,
      } as any);

      await expect(runSafeCleanupUnusedBooks()).rejects.toThrow(/Unauthorized/);
      mockGetUser.mockRestore();
    });

    it('returns empty array from getArchivedBooks when user is not an administrator', async () => {
      const mockGetUser = vi.spyOn(supabase.auth, 'getUser').mockResolvedValueOnce({
        data: { user: null },
        error: null,
      } as any);

      const res = await getArchivedBooks();
      expect(res).toEqual([]);
      mockGetUser.mockRestore();
    });
  });

  describe('archiveUnwantedBook', () => {
    it('archives unwanted book via RPC when available', async () => {
      // Mock admin user
      vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: { id: 'admin-1', email: 'admin@sahadhyayi.com' } as any },
        error: null,
      });

      const rpcSpy = vi.spyOn(supabase, 'rpc').mockImplementation(async (fnName, params: any) => {
        if (fnName === 'is_admin') return { data: true, error: null } as any;
        if (fnName === 'archive_unwanted_book') {
          return {
            data: { success: true, message: 'Book safely archived to vault.' },
            error: null,
          } as any;
        }
        return { data: null, error: null } as any;
      });

      const res = await archiveUnwantedBook('book-uuid-1', 'Duplicate and low quality scan');
      expect(res.success).toBe(true);
      expect(res.bookId).toBe('book-uuid-1');
      expect(res.message).toContain('safely archived to vault');

      rpcSpy.mockRestore();
    });

    it('falls back to non-destructive database upsert if RPC fails', async () => {
      vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: { id: 'admin-1', email: 'admin@sahadhyayi.com' } as any },
        error: null,
      });

      // Mock is_admin RPC returning true, archive_unwanted_book failing
      vi.spyOn(supabase, 'rpc').mockImplementation(async (fnName) => {
        if (fnName === 'is_admin') return { data: true, error: null } as any;
        return { data: null, error: new Error('RPC not found') } as any;
      });

      // Mock select single book
      const upsertMock = vi.fn().mockResolvedValue({ error: null });
      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      const fromSpy = vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'books_library') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'book-fallback-1',
                    title: 'A Tale of Two Cities',
                    author: 'Charles Dickens',
                    status: 'active',
                  },
                  error: null,
                }),
              }),
            }),
            update: updateMock,
          } as any;
        }
        if (table === 'books_library_archive') {
          return {
            upsert: upsertMock,
          } as any;
        }
        return {} as any;
      });

      const res = await archiveUnwantedBook('book-fallback-1', 'Redundant edition');
      expect(res.success).toBe(true);
      expect(upsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'book-fallback-1',
          title: 'A Tale of Two Cities',
          archive_reason: 'Redundant edition',
        })
      );
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'archived',
          archive_reason: 'Redundant edition',
        })
      );

      fromSpy.mockRestore();
    });
  });

  describe('restoreBookFromArchive', () => {
    it('restores archived book via RPC when available', async () => {
      vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: { id: 'admin-1', email: 'admin@sahadhyayi.com' } as any },
        error: null,
      });

      const rpcSpy = vi.spyOn(supabase, 'rpc').mockImplementation(async (fnName) => {
        if (fnName === 'is_admin') return { data: true, error: null } as any;
        if (fnName === 'restore_book_from_archive') {
          return {
            data: { success: true, message: 'Book restored to active library.' },
            error: null,
          } as any;
        }
        return { data: null, error: null } as any;
      });

      const res = await restoreBookFromArchive('archived-uuid-1');
      expect(res.success).toBe(true);
      expect(res.bookId).toBe('archived-uuid-1');
      expect(res.message).toContain('Book restored to active library');

      rpcSpy.mockRestore();
    });

    it('falls back to updating status in books_library and cleaning vault if RPC is unavailable', async () => {
      vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: { id: 'admin-1', email: 'admin@sahadhyayi.com' } as any },
        error: null,
      });

      vi.spyOn(supabase, 'rpc').mockImplementation(async (fnName) => {
        if (fnName === 'is_admin') return { data: true, error: null } as any;
        return { data: null, error: new Error('RPC not found') } as any;
      });

      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      const deleteMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      const fromSpy = vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'books_library_archive') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'vault-book-1', title: 'Restorable Title' },
                  error: null,
                }),
              }),
            }),
            delete: deleteMock,
          } as any;
        }
        if (table === 'books_library') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'vault-book-1' },
                  error: null,
                }),
              }),
            }),
            update: updateMock,
          } as any;
        }
        return {} as any;
      });

      const res = await restoreBookFromArchive('vault-book-1');
      expect(res.success).toBe(true);
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'active',
          superseded_by_id: null,
          archive_reason: null,
        })
      );
      expect(deleteMock).toHaveBeenCalled();

      fromSpy.mockRestore();
    });
  });

  describe('runSafeCleanupUnusedBooks', () => {
    it('executes cleanup_unused_books RPC and returns archived count without deleting', async () => {
      vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: { id: 'admin-1', email: 'admin@sahadhyayi.com' } as any },
        error: null,
      });

      const rpcSpy = vi.spyOn(supabase, 'rpc').mockImplementation(async (fnName) => {
        if (fnName === 'is_admin') return { data: true, error: null } as any;
        if (fnName === 'cleanup_unused_books') {
          return { data: 5, error: null } as any; // 5 books archived safely
        }
        return { data: null, error: null } as any;
      });

      const count = await runSafeCleanupUnusedBooks();
      expect(count).toBe(5);

      rpcSpy.mockRestore();
    });
  });

  describe('getArchivedBooks', () => {
    it('retrieves vault books from RPC', async () => {
      vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: { id: 'admin-1', email: 'admin@sahadhyayi.com' } as any },
        error: null,
      });

      const sampleVaultBooks = [
        {
          id: 'v1',
          title: 'Hidden Old Scan',
          author: 'Test Author',
          archived_at: '2026-10-11T12:00:00Z',
          archive_reason: 'Superseded by higher quality edition',
        },
      ];

      const rpcSpy = vi.spyOn(supabase, 'rpc').mockImplementation(async (fnName) => {
        if (fnName === 'is_admin') return { data: true, error: null } as any;
        if (fnName === 'get_archived_books') {
          return { data: sampleVaultBooks, error: null } as any;
        }
        return { data: null, error: null } as any;
      });

      const books = await getArchivedBooks();
      expect(books).toHaveLength(1);
      expect(books[0].title).toBe('Hidden Old Scan');
      expect(books[0].archive_reason).toBe('Superseded by higher quality edition');

      rpcSpy.mockRestore();
    });
  });
});
