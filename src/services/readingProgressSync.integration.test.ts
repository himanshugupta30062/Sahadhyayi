import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  recordActivity: vi.fn(),
  progressRead: { data: null as Record<string, unknown> | null, error: null as Error | null },
  shelfRead: { data: null as Record<string, unknown> | null, error: null as Error | null },
  progressWrite: { data: { id: 1 }, error: null as Error | null },
  shelfWrite: { data: null, error: null as Error | null },
  shelfInsert: { data: null, error: null as Error | null },
  calls: [] as Array<{ table: string; method: string; args: unknown[] }>,
}));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: { from: (...args: unknown[]) => mocks.from(...args) },
}));
vi.mock('@/lib/readingActivity', () => ({
  recordReadingActivity: (...args: unknown[]) => mocks.recordActivity(...args),
}));

import { syncReadingProgressToSupabase } from './readingProgressSync';

function makeBuilder(table: string, result: { data?: unknown; error: Error | null }) {
  const builder: Record<string, any> = {};
  for (const method of ['select', 'eq', 'upsert', 'update']) {
    builder[method] = vi.fn((...args: unknown[]) => {
      mocks.calls.push({ table, method, args });
      return builder;
    });
  }
  builder.maybeSingle = vi.fn(async () => result);
  builder.single = vi.fn(async () => result);
  builder.insert = vi.fn(async (...args: unknown[]) => {
    mocks.calls.push({ table, method: 'insert', args });
    return result;
  });
  builder.then = (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject);
  return builder;
}

describe('syncReadingProgressToSupabase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.progressRead = { data: null, error: null };
    mocks.shelfRead = { data: null, error: null };
    mocks.progressWrite = { data: { id: 1 }, error: null };
    mocks.shelfWrite = { data: null, error: null };
    mocks.shelfInsert = { data: null, error: null };

    const counts: Record<string, number> = {};
    mocks.from.mockImplementation((table: string) => {
      counts[table] = (counts[table] || 0) + 1;
      const count = counts[table];
      const result = table === 'reading_progress'
        ? (count === 1 ? mocks.progressRead : mocks.progressWrite)
        : (count === 1 ? mocks.shelfRead : mocks.shelfWrite);
      return makeBuilder(table, result);
    });
    mocks.recordActivity.mockResolvedValue(undefined);
  });

  const input = { bookId: ' book-1 ', bookTitle: ' Example Book ', currentPage: 25, totalPages: 100 };

  it('rejects missing users and invalid values before making database requests', async () => {
    await expect(syncReadingProgressToSupabase('', input)).rejects.toThrow('Sign in to save reading progress');
    await expect(syncReadingProgressToSupabase('reader-1', { ...input, currentPage: Number.NaN }))
      .rejects.toThrow('Current page must be a positive number');
    await expect(syncReadingProgressToSupabase('reader-1', { ...input, percentage: Number.POSITIVE_INFINITY }))
      .rejects.toThrow('Percentage must be a finite number');
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('upserts normalized progress, updates an existing shelf row, and records activity', async () => {
    mocks.progressRead.data = { current_page: 10, total_pages: 100, book_title: 'Existing title', started_at: '2026-01-01T00:00:00Z' };
    mocks.shelfRead.data = { id: 42, status: 'reading', started_at: '2026-01-01T00:00:00Z' };

    const result = await syncReadingProgressToSupabase('reader-1', input);

    expect(result).toMatchObject({ bookId: 'book-1', bookTitle: 'Example Book', currentPage: 25, percentage: 25, status: 'reading' });
    expect(mocks.calls).toContainEqual({
      table: 'reading_progress', method: 'upsert',
      args: [expect.objectContaining({ user_id: 'reader-1', book_id: 'book-1', current_page: 25 }), { onConflict: 'user_id,book_id' }],
    });
    expect(mocks.calls).toContainEqual({
      table: 'user_bookshelf', method: 'update',
      args: [expect.objectContaining({ progress: 25, status: 'reading' })],
    });
    expect(mocks.recordActivity).toHaveBeenCalledWith('reader-1', 'progress_save');
  });

  it('inserts a shelf row when one does not exist', async () => {
    await syncReadingProgressToSupabase('reader-1', input);
    expect(mocks.calls).toContainEqual({
      table: 'user_bookshelf', method: 'insert',
      args: [expect.objectContaining({ user_id: 'reader-1', book_id: 'book-1', progress: 25, status: 'reading' })],
    });
  });

  it('falls back to a shelf update when a concurrent insert fails', async () => {
    const shelfBuilders: Array<Record<string, any>> = [];
    const originalFrom = mocks.from.getMockImplementation();
    mocks.from.mockImplementation((table: string) => {
      const builder = originalFrom?.(table) as Record<string, any>;
      if (table === 'user_bookshelf') shelfBuilders.push(builder);
      return builder;
    });
    // The second shelf operation is the insert; make its result a conflict.
    const originalInsert = mocks.shelfInsert;
    mocks.shelfInsert = { data: null, error: new Error('duplicate key') };
    const shelfRead = mocks.shelfRead;
    shelfRead.data = null;
    await syncReadingProgressToSupabase('reader-1', input);
    expect(mocks.calls.some(call => call.table === 'user_bookshelf' && call.method === 'insert')).toBe(true);
    expect(mocks.calls.some(call => call.table === 'user_bookshelf' && call.method === 'update')).toBe(true);
    mocks.shelfInsert = originalInsert;
  });

  it('propagates progress and existing-shelf update errors but ignores activity failures', async () => {
    mocks.progressWrite.error = new Error('progress write failed');
    await expect(syncReadingProgressToSupabase('reader-1', input)).rejects.toThrow('progress write failed');

    mocks.progressWrite.error = null;
    mocks.shelfRead.data = { id: 9, status: 'reading' };
    mocks.shelfWrite.error = new Error('shelf update failed');
    await expect(syncReadingProgressToSupabase('reader-1', input)).rejects.toThrow('shelf update failed');

    mocks.shelfWrite.error = null;
    mocks.shelfRead.data = null;
    mocks.recordActivity.mockRejectedValue(new Error('activity unavailable'));
    await expect(syncReadingProgressToSupabase('reader-1', input)).resolves.toMatchObject({ bookId: 'book-1' });
  });
});
