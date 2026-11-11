import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  admin: false,
  rpc: vi.fn(),
  from: vi.fn(),
  record: vi.fn(),
  remove: vi.fn(),
  caps: vi.fn(),
  localIds: vi.fn(),
  verify: vi.fn(),
}));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: { rpc: (...args: unknown[]) => mocks.rpc(...args), from: (...args: unknown[]) => mocks.from(...args) },
}));
vi.mock('./duplicateResolution', () => ({ verifyAdminStatus: (...args: unknown[]) => mocks.verify(...args) }));
vi.mock('./bookVisibility', () => ({
  recordArchivedBookId: (...args: unknown[]) => mocks.record(...args),
  removeArchivedBookId: (...args: unknown[]) => mocks.remove(...args),
  detectBookSchemaCapabilities: (...args: unknown[]) => mocks.caps(...args),
  getLocalArchivedBookIds: (...args: unknown[]) => mocks.localIds(...args),
}));

import { archiveLibraryBook, restoreArchivedBook, getAdminArchivedBooks, getArchivedBooks, runSafeCleanupUnusedBooks } from './bookArchiveVault';

describe('book archive vault permissions and RPC paths', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.verify.mockResolvedValue(false);
    mocks.rpc.mockResolvedValue({ data: null, error: null });
  });

  it('blocks archive, restore, and cleanup for non-admins', async () => {
    await expect(archiveLibraryBook('b1', 'reason')).rejects.toThrow('Admin privileges required');
    await expect(restoreArchivedBook('b1')).rejects.toThrow('Admin privileges required');
    await expect(runSafeCleanupUnusedBooks()).rejects.toThrow('Admin privileges required');
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('returns no archived records for a non-admin', async () => {
    await expect(getAdminArchivedBooks()).resolves.toEqual([]);
    await expect(getArchivedBooks()).resolves.toEqual([]);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('uses the archive RPC and records the archived ID on success', async () => {
    mocks.verify.mockResolvedValue(true);
    mocks.rpc.mockResolvedValueOnce({ data: { success: true, message: 'Archived', archive_id: 'a1', catalog_status: 'archived' }, error: null });

    await expect(archiveLibraryBook('b1', 'duplicate', { classification: 'duplicate', canonicalBookId: 'b2', batchId: 'batch-1', evidence: { match: true } }))
      .resolves.toMatchObject({ success: true, book_id: 'b1', archive_id: 'a1', catalog_status: 'archived' });
    expect(mocks.rpc).toHaveBeenCalledWith('archive_library_book', expect.objectContaining({
      p_book_id: 'b1', p_reason: 'duplicate', p_classification: 'duplicate', p_canonical_book_id: 'b2', p_batch_id: 'batch-1', p_evidence: { match: true },
    }));
    expect(mocks.record).toHaveBeenCalledWith('b1');
  });

  it('uses restore RPC and clears local archived marker', async () => {
    mocks.verify.mockResolvedValue(true);
    mocks.rpc.mockResolvedValueOnce({ data: { success: true, catalog_status: 'superseded' }, error: null });
    await expect(restoreArchivedBook('b1', 'restore', 'superseded')).resolves.toMatchObject({ success: true, catalog_status: 'superseded' });
    expect(mocks.rpc).toHaveBeenCalledWith('restore_library_book', { p_book_id: 'b1', p_restore_reason: 'restore', p_target_status: 'superseded' });
    expect(mocks.remove).toHaveBeenCalledWith('b1');
  });

  it('returns zero when cleanup RPC fails and returns numeric result on success', async () => {
    mocks.verify.mockResolvedValue(true);
    mocks.rpc.mockResolvedValueOnce({ data: null, error: new Error('missing function') });
    await expect(runSafeCleanupUnusedBooks()).resolves.toBe(0);
    mocks.rpc.mockResolvedValueOnce({ data: 7, error: null });
    await expect(runSafeCleanupUnusedBooks()).resolves.toBe(7);
  });

  it('normalizes admin archive RPC rows and trims search parameters', async () => {
    mocks.verify.mockResolvedValue(true);
    mocks.rpc.mockResolvedValueOnce({ data: [{ id: 'b1', title: 'Archived title', archive_classification: 'junk', user_shelves_count: '2' }], error: null });
    const rows = await getAdminArchivedBooks({ search: '  title  ', classification: 'junk', limit: 10, offset: 5 });
    expect(mocks.rpc).toHaveBeenCalledWith('get_admin_archived_books', { p_search: 'title', p_classification: 'junk', p_limit: 10, p_offset: 5 });
    expect(rows[0]).toMatchObject({ book_id: 'b1', archive_id: 'b1', title: 'Archived title', archive_classification: 'junk', user_shelves_count: 2 });
  });
});
