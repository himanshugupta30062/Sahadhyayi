import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  user: { id: 'admin-1' } as null | { id: string },
  isAdmin: true,
  adminError: null as unknown,
  restoreError: null as unknown,
  groupBooks: [] as Array<Record<string, any>>,
  from: vi.fn(),
  rpc: vi.fn(),
  getUser: vi.fn(),
  recommendBestEditions: vi.fn(),
}));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    auth: { getUser: (...args: unknown[]) => mocks.getUser(...args) },
    rpc: (...args: unknown[]) => mocks.rpc(...args),
    from: (...args: unknown[]) => mocks.from(...args),
  },
}));

vi.mock('./editionRecommendation', () => ({
  recommendBestEditions: (...args: unknown[]) => mocks.recommendBestEditions(...args),
}));

import { applyDuplicateResolution, verifyAdminStatus } from './duplicateResolution';

const sampleBooks = () => [
  {
    id: 'book-1',
    title: 'The Dispossessed',
    author: 'Ursula K. Le Guin',
    description: null,
    cover_image_url: null,
    isbn: null,
    publication_year: null,
    pages: null,
    pdf_url: null,
    author_bio: null,
    genre: null,
  },
  {
    id: 'book-2',
    title: 'The Dispossessed duplicate',
    author: 'Ursula K. Le Guin',
    description: 'A complete description',
    cover_image_url: 'https://example.com/cover.jpg',
    isbn: '9780143127741',
    publication_year: 2019,
    pages: 341,
    pdf_url: 'https://example.com/book.pdf',
    author_bio: 'Author biography',
    genre: 'Science fiction',
  },
];

const recommendation = () => ({
  primaryBookId: 'book-1',
  proposedMergedMetadata: {
    description: 'A complete description',
    cover_image_url: 'https://example.com/cover.jpg',
  },
});

describe('duplicate resolution safety guards', () => {
  beforeEach(() => {
    mocks.user = { id: 'admin-1' };
    mocks.isAdmin = true;
    mocks.adminError = null;
    mocks.restoreError = null;
    mocks.groupBooks = sampleBooks();
    mocks.getUser.mockReset().mockImplementation(async () => ({
      data: { user: mocks.user },
      error: null,
    }));
    mocks.rpc.mockReset().mockImplementation(async (name: string) => {
      if (name === 'is_admin') return { data: mocks.isAdmin, error: mocks.adminError };
      if (name === 'restore_archived_book') return { data: { success: true }, error: mocks.restoreError };
      return { data: null, error: new Error('RPC unavailable') };
    });
    mocks.recommendBestEditions.mockReset().mockReturnValue(recommendation());
    mocks.from.mockReset().mockImplementation((table: string) => {
      const builder: any = {
        select: () => builder,
        order: () => builder,
        limit: async () => ({ data: [], error: null }),
        in: async () => ({ data: mocks.groupBooks, error: null }),
        eq: async (column: string) => ({
          data: column === 'duplicate_group_id' ? mocks.groupBooks : [],
          error: null,
        }),
        update: () => ({
          eq: async () => ({ error: null }),
        }),
      };
      return builder;
    });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('denies execution when the active user is not an administrator', async () => {
    mocks.user = null;

    await expect(
      applyDuplicateResolution('group-1', 'merge_and_archive_duplicates'),
    ).rejects.toThrow('Unauthorized: only administrators can execute catalog duplicate cleanup.');
    expect(mocks.rpc).not.toHaveBeenCalledWith('resolve_duplicate_book_group', expect.anything());
  });

  it('returns false when no user is authenticated or the admin RPC errors', async () => {
    mocks.user = null;
    await expect(verifyAdminStatus()).resolves.toBe(false);

    mocks.user = { id: 'reader-1' };
    mocks.adminError = new Error('permission lookup failed');
    await expect(verifyAdminStatus()).resolves.toBe(false);
    expect(console.warn).toHaveBeenCalledWith('is_admin check error:', expect.any(Error));
  });

  it('returns the administrator status from the is_admin RPC', async () => {
    await expect(verifyAdminStatus()).resolves.toBe(true);

    mocks.isAdmin = false;
    await expect(verifyAdminStatus()).resolves.toBe(false);
  });

  it('handles keep-separate without changing any catalog records', async () => {
    const result = await applyDuplicateResolution('group-1', 'keep_separate');

    expect(result).toMatchObject({
      success: true,
      action: 'keep_separate',
      groupId: 'group-1',
      archivedBookIds: [],
      mergedFields: [],
      dryRun: false,
    });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('previews a restore without calling the restore RPC or updating the database', async () => {
    const result = await applyDuplicateResolution('restore-book-7', 'restore_archived_record', {
      dryRun: true,
    });

    expect(result).toMatchObject({
      success: true,
      action: 'restore_archived_record',
      groupId: 'restore-book-7',
      primaryId: 'book-7',
      archivedBookIds: [],
      dryRun: true,
    });
    expect(mocks.rpc).not.toHaveBeenCalledWith('restore_archived_book', expect.anything());
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('rejects a restore request without a target book ID', async () => {
    await expect(
      applyDuplicateResolution('', 'restore_archived_record', { customPrimaryId: '' }),
    ).rejects.toThrow('Target book ID required for restore action');
  });

  it('falls back to a direct update when the restore RPC fails', async () => {
    mocks.restoreError = new Error('RPC not installed');

    const result = await applyDuplicateResolution('restore-book-7', 'restore_archived_record');

    expect(mocks.rpc).toHaveBeenCalledWith('restore_archived_book', {
      p_book_id: 'book-7',
      p_reason: 'Restored by administrator',
    });
    expect(mocks.from).toHaveBeenCalledWith('books_library');
    expect(result).toMatchObject({
      success: true,
      primaryId: 'book-7',
      dryRun: false,
    });
  });

  it('previews archive candidates and proposed metadata without mutating records', async () => {
    const result = await applyDuplicateResolution('group-1', 'merge_and_archive_duplicates', {
      dryRun: true,
    });

    expect(mocks.from).toHaveBeenCalledWith('books_library');
    expect(mocks.recommendBestEditions).toHaveBeenCalledWith(expect.objectContaining({
      groupId: 'group-1',
      books: mocks.groupBooks,
    }));
    expect(result).toMatchObject({
      success: true,
      action: 'merge_and_archive_duplicates',
      groupId: 'group-1',
      primaryId: 'book-1',
      archivedBookIds: ['book-2'],
      mergedFields: ['description', 'cover_image_url'],
      dryRun: true,
    });
    expect(mocks.rpc).not.toHaveBeenCalledWith('resolve_duplicate_book_group', expect.anything());
  });

  it('supports a dry-run preview when no matching books can be found', async () => {
    mocks.groupBooks = [];

    const result = await applyDuplicateResolution('missing-group', 'merge_and_archive_duplicates', {
      dryRun: true,
      customPrimaryId: 'primary-1',
      customKeepIds: ['primary-1', 'duplicate-1'],
    });

    expect(result).toMatchObject({
      success: true,
      primaryId: 'primary-1',
      archivedBookIds: ['duplicate-1'],
      dryRun: true,
    });
    expect(result.message).toContain('Preview: Duplicate group missing-group');
  });

  it('does not propose merged fields when metadata merging is explicitly disabled', async () => {
    const result = await applyDuplicateResolution('group-1', 'keep_top_editions', {
      dryRun: true,
      mergeMetadata: false,
    });

    expect(result.mergedFields).toEqual([]);
    expect(result.archivedBookIds).toEqual(['book-2']);
  });
});
