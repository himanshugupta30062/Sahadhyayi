// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  user: null as null | { id: string },
  queryResult: { data: null as any, error: null as any },
  createdResult: { data: null as any, error: null as any },
  updateResult: { data: null as any, error: null as any },
  leaderboardResult: { data: [] as any[], error: null as any },
  from: vi.fn(),
  rpc: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  maybeSingle: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  single: vi.fn(),
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: mocks.user }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mocks.from(...args),
    rpc: (...args: unknown[]) => mocks.rpc(...args),
  },
}));

import { getNextRank, getRankForPoints, useGameStats, useLeaderboard } from './useGameStats';

const stats = (overrides: Record<string, unknown> = {}) => ({
  id: 'stats-1',
  user_id: 'reader-1',
  total_points: 400,
  games_played: 5,
  games_won: 2,
  current_streak: 1,
  best_streak: 3,
  rank: 'Beginner',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const builder = {
  select: (...args: unknown[]) => mocks.select(...args),
  eq: (...args: unknown[]) => mocks.eq(...args),
  maybeSingle: (...args: unknown[]) => mocks.maybeSingle(...args),
  insert: (...args: unknown[]) => mocks.insert(...args),
  update: (...args: unknown[]) => mocks.update(...args),
  single: (...args: unknown[]) => mocks.single(...args),
};

describe('game rank helpers', () => {
  it.each([
    [-1, 'Beginner'],
    [0, 'Beginner'],
    [499, 'Beginner'],
    [500, 'Book Worm'],
    [2000, 'Scholar'],
    [5000, 'Expert'],
    [15000, 'Master'],
    [50000, 'Legend'],
  ])('maps %i points to the %s rank', (points, rank) => {
    expect(getRankForPoints(points).name).toBe(rank);
  });

  it.each([
    [-1, 'Book Worm'],
    [499, 'Book Worm'],
    [500, 'Scholar'],
    [2000, 'Expert'],
    [5000, 'Master'],
    [15000, 'Legend'],
  ])('finds the next rank above %i points', (points, rank) => {
    expect(getNextRank(points)?.name).toBe(rank);
  });

  it('returns no next rank for a Legend', () => {
    expect(getNextRank(50000)).toBeNull();
  });
});

describe('useGameStats', () => {
  beforeEach(() => {
    mocks.user = { id: 'reader-1' };
    mocks.queryResult = { data: stats(), error: null };
    mocks.createdResult = { data: stats({ total_points: 0, games_played: 0, games_won: 0, current_streak: 0, best_streak: 0 }), error: null };
    mocks.updateResult = { data: stats({ total_points: 450, games_played: 6, games_won: 3, current_streak: 2, best_streak: 3, rank: 'Beginner' }), error: null };
    mocks.leaderboardResult = { data: [], error: null };
    mocks.from.mockReset().mockReturnValue(builder);
    mocks.rpc.mockReset().mockResolvedValue(mocks.leaderboardResult);
    mocks.select.mockReset().mockReturnValue(builder);
    mocks.eq.mockReset().mockReturnValue(builder);
    mocks.maybeSingle.mockReset().mockImplementation(async () => mocks.queryResult);
    mocks.insert.mockReset().mockReturnValue(builder);
    mocks.update.mockReset().mockReturnValue(builder);
    mocks.single.mockReset().mockImplementation(async () => {
      if (mocks.update.mock.calls.length > 0) return mocks.updateResult;
      return mocks.createdResult;
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('does not query stats for signed-out visitors', async () => {
    mocks.user = null;
    const { result } = renderHook(() => useGameStats());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stats).toBeNull();
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('loads an existing stats record', async () => {
    const { result } = renderHook(() => useGameStats());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stats).toEqual(stats());
    expect(mocks.from).toHaveBeenCalledWith('user_game_stats');
    expect(mocks.eq).toHaveBeenCalledWith('user_id', 'reader-1');
  });

  it('creates initial stats when a user has no record', async () => {
    mocks.queryResult = { data: null, error: null };
    const { result } = renderHook(() => useGameStats());

    await waitFor(() => expect(result.current.stats).toEqual(mocks.createdResult.data));
    expect(mocks.insert).toHaveBeenCalledWith({
      user_id: 'reader-1',
      total_points: 0,
      games_played: 0,
      games_won: 0,
      current_streak: 0,
      best_streak: 0,
      rank: 'Beginner',
    });
  });

  it('surfaces a stable error state when loading fails', async () => {
    mocks.queryResult = { data: null, error: new Error('database unavailable') };
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useGameStats());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Unable to load game stats. Please try again.');
    expect(result.current.stats).toBeNull();
  });

  it('adds points, increments wins and streaks, and updates the rank', async () => {
    const { result } = renderHook(() => useGameStats());
    await waitFor(() => expect(result.current.stats).toEqual(stats()));

    await act(async () => {
      await result.current.addPoints(50, true);
    });

    expect(mocks.update).toHaveBeenCalledWith({
      total_points: 450,
      games_played: 6,
      games_won: 3,
      current_streak: 2,
      best_streak: 3,
      rank: 'Beginner',
    });
    expect(result.current.stats).toEqual(mocks.updateResult.data);
  });

  it('resets the current streak after a loss without lowering the best streak', async () => {
    const { result } = renderHook(() => useGameStats());
    await waitFor(() => expect(result.current.stats).toEqual(stats()));

    await act(async () => {
      await result.current.addPoints(0, false);
    });

    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      current_streak: 0,
      best_streak: 3,
      games_won: 2,
    }));
  });

  it('does not update stats before a record is loaded', async () => {
    mocks.user = null;
    const { result } = renderHook(() => useGameStats());

    await act(async () => {
      await result.current.addPoints(100, true);
    });

    expect(mocks.update).not.toHaveBeenCalled();
  });
});

describe('useLeaderboard', () => {
  it('loads leaderboard entries from the RPC with the requested limit', async () => {
    const entries = [{ user_id: 'reader-1', username: 'reader', full_name: 'Reader', profile_photo_url: null, total_points: 900, games_won: 4, rank: 'Book Worm' }];
    mocks.rpc.mockResolvedValue({ data: entries, error: null });

    const { result } = renderHook(() => useLeaderboard(5));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.leaderboard).toEqual(entries);
    expect(mocks.rpc).toHaveBeenCalledWith('get_game_leaderboard', { limit_count: 5 });
  });

  it('returns an empty leaderboard after an RPC error', async () => {
    mocks.rpc.mockRejectedValue(new Error('leaderboard unavailable'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useLeaderboard());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.leaderboard).toEqual([]);
    expect(console.error).toHaveBeenCalled();
  });
});
