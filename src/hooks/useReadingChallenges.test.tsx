// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mocks = vi.hoisted(() => ({
  user: null as null | { id: string },
  results: {} as Record<string, { data: any; error: any }>,
  insertResult: { data: null as any, error: null as any },
  from: vi.fn(),
  invalidations: [] as unknown[],
}));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: { from: (table: string) => mocks.from(table) },
}));
vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: mocks.user }),
}));

import {
  useChallenges,
  useUserChallenges,
  useJoinChallenge,
  useUserBadges,
} from './useReadingChallenges';

const renderWithClient = <T,>(callback: () => T) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidate = queryClient.invalidateQueries.bind(queryClient);
  vi.spyOn(queryClient, 'invalidateQueries').mockImplementation((...args: any[]) => {
    mocks.invalidations.push(args[0]);
    return invalidate(args[0]);
  });
  const wrapper = ({ children }: React.PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(callback, { wrapper });
};

describe('reading challenge hooks', () => {
  beforeEach(() => {
    mocks.user = { id: 'reader-1' };
    mocks.results = {};
    mocks.insertResult = { data: { id: 'enrollment-1', user_id: 'reader-1', challenge_id: 'challenge-1' }, error: null };
    mocks.invalidations = [];
    mocks.from.mockReset().mockImplementation((table: string) => {
      const chain: Record<string, any> = {};
      chain.select = vi.fn().mockReturnValue(chain);
      chain.eq = vi.fn().mockReturnValue(chain);
      chain.order = vi.fn().mockReturnValue(chain);
      chain.in = vi.fn().mockReturnValue(chain);
      chain.insert = vi.fn().mockReturnValue(chain);
      chain.single = vi.fn().mockImplementation(() => Promise.resolve(mocks.insertResult));
      chain.then = (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
        Promise.resolve(mocks.results[table] ?? { data: [], error: null }).then(resolve, reject);
      return chain;
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('loads only active challenges ordered by goal', async () => {
    const challenges = [{ id: 'c1', slug: 'read-10', name: 'Read 10', goal: 10, is_active: true }];
    mocks.results.reading_challenges = { data: challenges, error: null };
    const { result } = renderWithClient(() => useChallenges());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(challenges);
    expect(mocks.from).toHaveBeenCalledWith('reading_challenges');
  });

  it('returns an empty catalogue when the database has no active challenges', async () => {
    const { result } = renderWithClient(() => useChallenges());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('surfaces catalogue query errors', async () => {
    mocks.results.reading_challenges = { data: null, error: new Error('catalogue unavailable') };
    const { result } = renderWithClient(() => useChallenges());
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('catalogue unavailable'));
  });

  it('does not query enrolled challenges while signed out', async () => {
    mocks.user = null;
    const { result } = renderWithClient(() => useUserChallenges());
    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('loads enrollments scoped to the authenticated reader', async () => {
    const enrollments = [{ id: 'u1', user_id: 'reader-1', challenge_id: 'c1', progress: 4 }];
    mocks.results.user_challenges = { data: enrollments, error: null };
    const { result } = renderWithClient(() => useUserChallenges());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(enrollments);
    expect(mocks.from).toHaveBeenCalledWith('user_challenges');
  });

  it('rejects joining when the reader is signed out', async () => {
    mocks.user = null;
    const { result } = renderWithClient(() => useJoinChallenge());
    await act(async () => {
      await expect(result.current.mutateAsync('challenge-1')).rejects.toThrow('Not authenticated');
    });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('inserts an enrollment and invalidates catalogue, enrollment, and badge queries', async () => {
    const { result } = renderWithClient(() => useJoinChallenge());
    let enrollment;
    await act(async () => {
      enrollment = await result.current.mutateAsync('challenge-1');
    });

    expect(enrollment).toEqual(mocks.insertResult.data);
    expect(mocks.from).toHaveBeenCalledWith('user_challenges');
    expect(mocks.invalidations).toEqual(expect.arrayContaining([
      { queryKey: ['challenges'] },
      { queryKey: ['user-challenges', 'reader-1'] },
      { queryKey: ['user-badges', 'reader-1'] },
    ]));
  });

  it('surfaces duplicate or database errors when joining a challenge', async () => {
    mocks.insertResult = { data: null, error: new Error('already enrolled') };
    const { result } = renderWithClient(() => useJoinChallenge());
    await act(async () => {
      await expect(result.current.mutateAsync('challenge-1')).rejects.toThrow('already enrolled');
    });
  });

  it('does not query earned badges while signed out', async () => {
    mocks.user = null;
    const { result } = renderWithClient(() => useUserBadges());
    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('returns early when the reader has not earned any badges', async () => {
    mocks.results.user_reading_badges = { data: [], error: null };
    const { result } = renderWithClient(() => useUserBadges());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
    expect(mocks.from).toHaveBeenCalledTimes(1);
  });

  it('hydrates earned badges with their definitions and preserves missing definitions', async () => {
    mocks.results.user_reading_badges = {
      data: [
        { id: 'earned-1', badge_id: 'b1', user_id: 'reader-1', earned_at: '2026-11-17' },
        { id: 'earned-2', badge_id: 'missing', user_id: 'reader-1', earned_at: '2026-11-16' },
      ],
      error: null,
    };
    mocks.results.reading_badges = {
      data: [{ id: 'b1', name: 'First Steps', icon: '/badge.svg' }],
      error: null,
    };
    const { result } = renderWithClient(() => useUserBadges());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([
      { ...mocks.results.user_reading_badges.data[0], badges: { name: 'First Steps', icon_url: '/badge.svg' } },
      { ...mocks.results.user_reading_badges.data[1], badges: undefined },
    ]);
    expect(mocks.from).toHaveBeenCalledWith('reading_badges');
  });

  it('surfaces errors loading earned badge records or badge definitions', async () => {
    mocks.results.user_reading_badges = { data: null, error: new Error('earned badges unavailable') };
    const first = renderWithClient(() => useUserBadges());
    await waitFor(() => expect(first.result.current.isError).toBe(true));
    first.unmount();

    mocks.results.user_reading_badges = {
      data: [{ id: 'e1', badge_id: 'b1', user_id: 'reader-1', earned_at: '2026-11-17' }],
      error: null,
    };
    mocks.results.reading_badges = { data: null, error: new Error('badge definitions unavailable') };
    const second = renderWithClient(() => useUserBadges());
    await waitFor(() => expect(second.result.current.isError).toBe(true));
    expect(second.result.current.error).toEqual(new Error('badge definitions unavailable'));
  });
});
