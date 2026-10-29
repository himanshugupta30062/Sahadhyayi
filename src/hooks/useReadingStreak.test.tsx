// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mocks = vi.hoisted(() => ({
  user: { id: 'reader-1' } as null | { id: string },
  rows: [] as Array<{ updated_at: string }>,
  error: null as unknown,
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  gte: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mocks.from(...args),
  },
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: mocks.user }),
}));

import { useReadingStreak } from './useReadingStreak';

const dayAtOffset = (offset: number) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - offset);
  return date.toISOString();
};

const renderStreakHook = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: React.PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(() => useReadingStreak(), { wrapper });
};

describe('useReadingStreak', () => {
  beforeEach(() => {
    mocks.user = { id: 'reader-1' };
    mocks.rows = [];
    mocks.error = null;
    const builder = {
      select: mocks.select,
      eq: mocks.eq,
      gte: mocks.gte,
      order: mocks.order,
      limit: mocks.limit,
    };
    mocks.from.mockReset().mockReturnValue(builder);
    mocks.select.mockReset().mockReturnValue(builder);
    mocks.eq.mockReset().mockReturnValue(builder);
    mocks.gte.mockReset().mockReturnValue(builder);
    mocks.order.mockReset().mockReturnValue(builder);
    mocks.limit.mockReset().mockImplementation(async () => ({
      data: mocks.rows,
      error: mocks.error,
    }));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('does not query reading history for a signed-out visitor', async () => {
    mocks.user = null;
    const { result } = renderStreakHook();

    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('computes the current streak, best streak, and active days in the last week', async () => {
    mocks.rows = [0, 1, 5, 6, 7, 8].map((offset) => ({ updated_at: dayAtOffset(offset) }));
    const { result } = renderStreakHook();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      current: 2,
      best: 4,
      daysThisWeek: 4,
      lastActiveAt: expect.any(String),
    });
    expect(mocks.from).toHaveBeenCalledWith('detailed_reading_progress');
    expect(mocks.select).toHaveBeenCalledWith('updated_at');
    expect(mocks.eq).toHaveBeenCalledWith('user_id', 'reader-1');
    expect(mocks.gte).toHaveBeenCalledWith('updated_at', expect.any(String));
    expect(mocks.order).toHaveBeenCalledWith('updated_at', { ascending: false });
    expect(mocks.limit).toHaveBeenCalledWith(1000);
  });

  it('returns zeroed streak data when there is no reading history', async () => {
    mocks.rows = [];
    const { result } = renderStreakHook();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      current: 0,
      best: 0,
      daysThisWeek: 0,
      lastActiveAt: null,
    });
  });

  it('rejects the query when the reading-history request fails', async () => {
    mocks.error = new Error('Reading history unavailable');
    const { result } = renderStreakHook();

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('Reading history unavailable'));
  });
});
