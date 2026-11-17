// @vitest-environment jsdom

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  user: null as null | { id: string },
  from: vi.fn(),
  activity: vi.fn(),
  queryResult: { data: [] as unknown, error: null as unknown },
  mutationResult: { data: { id: 'chapter-row' } as unknown, error: null as unknown },
  calls: [] as Array<{ table: string; method: string; args: unknown[] }>,
}));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: { from: (...args: unknown[]) => mocks.from(...args) },
}));
vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: mocks.user }),
}));
vi.mock('@/lib/readingActivity', () => ({
  recordReadingActivity: (...args: unknown[]) => mocks.activity(...args),
}));

import { useChapterProgress, useMarkChapterAsRead } from './useChapterProgress';

const createHarness = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
  const wrapper = ({ children }: React.PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { wrapper, invalidate };
};

describe('chapter progress hooks', () => {
  beforeEach(() => {
    mocks.user = { id: 'reader-1' };
    mocks.queryResult = { data: [], error: null };
    mocks.mutationResult = { data: { id: 'chapter-row' }, error: null };
    mocks.calls = [];
    mocks.activity.mockResolvedValue(undefined);

    const builder: Record<string, any> = {};
    for (const method of ['select', 'eq', 'upsert']) {
      builder[method] = vi.fn((...args: unknown[]) => {
        mocks.calls.push({ table: 'detailed_reading_progress', method, args });
        return builder;
      });
    }
    builder.single = vi.fn(async () => mocks.mutationResult);
    builder.then = (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(mocks.queryResult).then(resolve, reject);
    mocks.from.mockImplementation((table: string) => {
      expect(table).toBe('detailed_reading_progress');
      return builder;
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('does not run the chapter query when signed out', async () => {
    mocks.user = null;
    const { wrapper } = createHarness();
    const { result } = renderHook(() => useChapterProgress('book-1'), { wrapper });
    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('does not run the chapter query when no book is selected', async () => {
    const { wrapper } = createHarness();
    const { result } = renderHook(() => useChapterProgress(), { wrapper });
    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('loads progress scoped to the authenticated reader and selected book', async () => {
    const rows = [{ id: 'chapter-1', book_id: 'book-1', chapter_number: 1, completion_percentage: 100, completed_at: null }];
    mocks.queryResult.data = rows;
    const { wrapper } = createHarness();
    const { result } = renderHook(() => useChapterProgress('book-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(rows);
    expect(mocks.from).toHaveBeenCalledWith('detailed_reading_progress');
    expect(mocks.calls.filter(call => call.method === 'eq')).toEqual([
      { table: 'detailed_reading_progress', method: 'eq', args: ['user_id', 'reader-1'] },
      { table: 'detailed_reading_progress', method: 'eq', args: ['book_id', 'book-1'] },
    ]);
  });

  it('surfaces errors from the chapter progress query', async () => {
    mocks.queryResult.error = new Error('chapter query failed');
    const { wrapper } = createHarness();
    const { result } = renderHook(() => useChapterProgress('book-1'), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('chapter query failed'));
  });

  it('requires authentication before marking a chapter complete', async () => {
    mocks.user = null;
    const { wrapper } = createHarness();
    const { result } = renderHook(() => useMarkChapterAsRead('book-1'), { wrapper });
    await expect(result.current.mutateAsync(3)).rejects.toThrow('User not authenticated');
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.activity).not.toHaveBeenCalled();
  });

  it('upserts a completed chapter, records activity, and invalidates related reading queries', async () => {
    const { wrapper, invalidate } = createHarness();
    const { result } = renderHook(() => useMarkChapterAsRead('book-1'), { wrapper });
    await act(async () => {
      await result.current.mutateAsync(4);
    });

    const upsert = mocks.calls.find(call => call.method === 'upsert');
    expect(upsert).toBeDefined();
    expect(upsert?.args[0]).toEqual(expect.objectContaining({
      user_id: 'reader-1',
      book_id: 'book-1',
      chapter_number: 4,
      completion_percentage: 100,
      total_pages: 1,
      pages_read: 1,
      time_spent_minutes: 0,
      completed_at: expect.any(String),
      updated_at: expect.any(String),
    }));
    expect(upsert?.args[1]).toEqual({ onConflict: 'user_id,book_id,chapter_number' });
    expect(mocks.activity).toHaveBeenCalledWith('reader-1', 'chapter_complete', { bookId: 'book-1' });
    await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(3));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['chapter-progress', 'reader-1', 'book-1'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['reading-streak', 'reader-1'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['reading-activity-days', 'reader-1'] });
  });

  it('does not record activity when the chapter upsert fails', async () => {
    mocks.mutationResult.error = new Error('chapter write failed');
    const { wrapper } = createHarness();
    const { result } = renderHook(() => useMarkChapterAsRead('book-1'), { wrapper });
    await expect(result.current.mutateAsync(2)).rejects.toThrow('chapter write failed');
    expect(mocks.activity).not.toHaveBeenCalled();
  });

  it('surfaces activity recording failures after a successful chapter write', async () => {
    mocks.activity.mockRejectedValue(new Error('activity unavailable'));
    const { wrapper } = createHarness();
    const { result } = renderHook(() => useMarkChapterAsRead('book-1'), { wrapper });
    await expect(result.current.mutateAsync(2)).rejects.toThrow('activity unavailable');
    expect(mocks.calls.some(call => call.method === 'upsert')).toBe(true);
  });
});
