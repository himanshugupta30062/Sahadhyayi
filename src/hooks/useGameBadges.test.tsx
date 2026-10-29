// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  user: null as null | { id: string },
  badges: [] as any[],
  earned: [] as any[],
  selectResult: { data: null as any, error: null as any },
  insertResult: { error: null as any },
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  insert: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock('@/contexts/authHelpers', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (...args: unknown[]) => mocks.from(...args) },
}));
vi.mock('sonner', () => ({
  toast: { success: (...args: unknown[]) => mocks.toastSuccess(...args) },
}));

import { useGameBadges } from './useGameBadges';

const badge = (id: string, requirement_type: string, requirement_value = 1) => ({
  id, name: `Badge ${id}`, description: `Description ${id}`, icon: '🏆',
  requirement_type, requirement_value,
});

describe('useGameBadges', () => {
  beforeEach(() => {
    mocks.user = { id: 'reader-1' };
    mocks.badges = [badge('games', 'games_played', 3), badge('points', 'total_points', 100), badge('streak', 'streak', 2), badge('perfect', 'perfect_game'), badge('speed', 'speed_answers', 5)];
    mocks.earned = [];
    mocks.insertResult = { error: null };
    mocks.from.mockReset().mockImplementation((table: string) => ({
      select: vi.fn(() => {
        const response = Promise.resolve({
          data: table === 'game_badges' ? mocks.badges : mocks.earned,
          error: null,
        });
        return {
          then: response.then.bind(response),
          catch: response.catch.bind(response),
          finally: response.finally.bind(response),
          eq: vi.fn(() => Promise.resolve({ data: mocks.earned, error: null })),
        };
      }),
      insert: (...args: unknown[]) => mocks.insert(...args),
    }));
    mocks.select.mockReset().mockImplementation(function (this: { table: string }) {
      const table = this.table;
      return Promise.resolve({
        data: table === 'game_badges' ? mocks.badges : mocks.earned,
        error: null,
      });
    });
    mocks.eq.mockReset().mockImplementation(function (this: { table: string }) {
      return Promise.resolve({ data: mocks.earned, error: null });
    });
    mocks.insert.mockReset().mockImplementation(() => Promise.resolve(mocks.insertResult));
    mocks.toastSuccess.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('loads available badges and earned badges for the current user', async () => {
    mocks.earned = [{ id: 'earned-1', user_id: 'reader-1', badge_id: 'games' }];
    const { result } = renderHook(() => useGameBadges());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.allBadges).toHaveLength(5);
    expect(result.current.userBadges).toEqual(mocks.earned);
    expect(mocks.from).toHaveBeenCalledWith('game_badges');
    expect(mocks.from).toHaveBeenCalledWith('user_game_badges');
  });

  it('does not award badges to a signed-out visitor', async () => {
    mocks.user = null;
    const { result } = renderHook(() => useGameBadges());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let awarded;
    await act(async () => {
      awarded = await result.current.checkAndAwardBadges({
        games_played: 10, games_won: 10, total_points: 1000, current_streak: 10,
        perfect_game: true, speed_answers: 10,
      });
    });

    expect(awarded).toBeUndefined();
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it('awards only newly qualified badges and skips already earned badges', async () => {
    mocks.earned = [{ id: 'earned-1', user_id: 'reader-1', badge_id: 'games' }];
    const { result } = renderHook(() => useGameBadges());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let awarded;
    await act(async () => {
      awarded = await result.current.checkAndAwardBadges({
        games_played: 4, games_won: 1, total_points: 150, current_streak: 2,
        perfect_game: false, speed_answers: 0,
      });
    });

    expect(awarded?.map((item: { id: string }) => item.id)).toEqual(['points', 'streak']);
    expect(mocks.insert).toHaveBeenCalledTimes(2);
    expect(mocks.insert).toHaveBeenCalledWith({ user_id: 'reader-1', badge_id: 'points' });
    expect(mocks.insert).toHaveBeenCalledWith({ user_id: 'reader-1', badge_id: 'streak' });
    expect(mocks.toastSuccess).toHaveBeenCalledTimes(2);
    expect(result.current.newBadge?.id).toBe('streak');
  });

  it('recognizes perfect-game and speed-answer requirements', async () => {
    const { result } = renderHook(() => useGameBadges());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let awarded;
    await act(async () => {
      awarded = await result.current.checkAndAwardBadges({
        games_played: 0, games_won: 0, total_points: 0, current_streak: 0,
        perfect_game: true, speed_answers: 5,
      });
    });

    expect(awarded?.map((item: { id: string }) => item.id)).toEqual(['perfect', 'speed']);
  });

  it('dismisses the new badge and checks earned badge membership', async () => {
    const { result } = renderHook(() => useGameBadges());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.hasEarnedBadge('games')).toBe(false);
    act(() => result.current.dismissNewBadge());
    expect(result.current.newBadge).toBeNull();
  });
});
