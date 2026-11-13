// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { READING_ACTIVITY_CUTOVER_DATE } from '@/lib/readingStreak';

const mocks = vi.hoisted(() => ({
  user: { id: 'reader-1' } as null | { id: string },
  durableRows: [] as Array<{ activity_date: string; last_activity_at: string | null }>,
  durableError: null as unknown,
  legacyRows: [] as Array<{ updated_at: string | null }>,
  legacyError: null as unknown,
  from: vi.fn(),
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

const dayKeyAtOffset = (offset: number) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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
    mocks.durableRows = [];
    mocks.durableError = null;
    mocks.legacyRows = [];
    mocks.legacyError = null;

    mocks.from.mockImplementation((table: string) => {
      if (table === 'reading_activity_days') {
        const chain: Record<string, any> = {};
        chain.select = vi.fn().mockReturnValue(chain);
        chain.eq = vi.fn().mockReturnValue(chain);
        chain.order = vi.fn().mockReturnValue(chain);
        chain.then = (resolve: any) =>
          resolve({
            data: mocks.durableRows,
            error: mocks.durableError,
          });
        return chain;
      }

      if (table === 'detailed_reading_progress') {
        const chain: Record<string, any> = {};
        chain.select = vi.fn().mockReturnValue(chain);
        chain.eq = vi.fn().mockReturnValue(chain);
        chain.lt = vi.fn().mockReturnValue(chain);
        chain.order = vi.fn().mockReturnValue(chain);
        chain.then = (resolve: any) =>
          resolve({
            data: mocks.legacyRows,
            error: mocks.legacyError,
          });
        return chain;
      }

      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        then: (resolve: any) => resolve({ data: [], error: null }),
      };
    });
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

  it('computes the current streak, best streak, and active days in the last week without 365-day query limit', async () => {
    mocks.durableRows = [0, 1, 5, 6, 7, 8].map((offset) => ({
      activity_date: dayKeyAtOffset(offset),
      last_activity_at: dayAtOffset(offset),
    }));
    const { result } = renderStreakHook();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      current: 2,
      best: 4,
      daysThisWeek: 4,
      activeDays: [dayKeyAtOffset(6), dayKeyAtOffset(5), dayKeyAtOffset(1), dayKeyAtOffset(0)],
      lastActiveAt: expect.any(String),
      cutoverDate: READING_ACTIVITY_CUTOVER_DATE,
      hasLegacyFallback: false,
    });
    expect(mocks.from).toHaveBeenCalledWith('reading_activity_days');
  });

  it('returns zeroed streak data when there is no reading history', async () => {
    mocks.durableRows = [];
    const { result } = renderStreakHook();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      current: 0,
      best: 0,
      daysThisWeek: 0,
      activeDays: [],
      lastActiveAt: null,
      cutoverDate: READING_ACTIVITY_CUTOVER_DATE,
      hasLegacyFallback: false,
    });
  });

  it('rejects the query when the durable reading-history request fails', async () => {
    mocks.durableError = new Error('Reading history unavailable');
    const { result } = renderStreakHook();

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('Reading history unavailable'));
  });

  it('merges legacy progress timestamps before cutover date as fallback when durable records are absent', async () => {
    mocks.durableRows = [];
    mocks.legacyRows = [
      { updated_at: '2026-11-09T10:00:00Z' },
      { updated_at: '2026-11-10T12:00:00Z' },
    ];

    const { result } = renderStreakHook();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.hasLegacyFallback).toBe(true);
    expect(result.current.data?.best).toBe(2);
  });

  it('ignores legacy timestamps after cutover date to protect post-cutover durable tracking', async () => {
    mocks.durableRows = [];
    mocks.legacyRows = [
      { updated_at: '2026-11-13T10:00:00Z' }, // after cutover date 2026-11-12
    ];

    const { result } = renderStreakHook();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.hasLegacyFallback).toBe(false);
    expect(result.current.data?.current).toBe(0);
    expect(result.current.data?.best).toBe(0);
  });
});
