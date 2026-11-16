import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useReadingGoal } from './useReadingGoal';

const mocks = vi.hoisted(() => ({
  user: null as null | { id: string; user_metadata?: Record<string, unknown> },
  updateUser: vi.fn(),
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: mocks.user }),
}));
vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: { auth: { updateUser: mocks.updateUser } },
}));

describe('useReadingGoal', () => {
  beforeEach(() => {
    mocks.user = null;
    mocks.updateUser.mockReset().mockResolvedValue({ error: null });
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('prefers the authenticated user metadata over stored goals', () => {
    const year = new Date().getFullYear();
    localStorage.setItem(`sahadhyayi_goal_reader-1_${year}`, '8');
    localStorage.setItem(`readingGoal${year}`, '10');
    mocks.user = { id: 'reader-1', user_metadata: { [`reading_goal_${year}`]: 24 } };

    const { result } = renderHook(() => useReadingGoal());

    expect(result.current).toMatchObject({ goal: 24, currentYear: year, isLoading: false });
  });

  it('uses the user-specific local value before the legacy value and defaults to 12', () => {
    const year = new Date().getFullYear();
    mocks.user = { id: 'reader-1' };
    localStorage.setItem(`sahadhyayi_goal_reader-1_${year}`, '18');
    localStorage.setItem(`readingGoal${year}`, '9');
    const personalized = renderHook(() => useReadingGoal());
    expect(personalized.result.current.goal).toBe(18);

    localStorage.removeItem(`sahadhyayi_goal_reader-1_${year}`);
    const legacy = renderHook(() => useReadingGoal());
    expect(legacy.result.current.goal).toBe(9);

    localStorage.clear();
    const fallback = renderHook(() => useReadingGoal());
    expect(fallback.result.current.goal).toBe(12);
  });

  it('ignores non-positive, fractional, and unsafe goals without persisting', async () => {
    const { result } = renderHook(() => useReadingGoal());
    await act(async () => {
      await result.current.setGoal(0);
      await result.current.setGoal(-1);
      await result.current.setGoal(1.5);
      await result.current.setGoal(Number.MAX_SAFE_INTEGER + 1);
    });

    expect(result.current.goal).toBe(12);
    expect(result.current.isLoading).toBe(false);
    expect(localStorage.length).toBe(0);
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it('persists an authenticated goal, broadcasts it, and syncs metadata', async () => {
    const year = new Date().getFullYear();
    mocks.user = { id: 'reader-1' };
    const { result } = renderHook(() => useReadingGoal());
    const listener = vi.fn();
    window.addEventListener('readingGoalUpdated', listener);

    await act(async () => {
      await result.current.setGoal(30);
    });

    expect(result.current).toMatchObject({ goal: 30, isLoading: false });
    expect(localStorage.getItem(`readingGoal${year}`)).toBe('30');
    expect(localStorage.getItem(`sahadhyayi_goal_reader-1_${year}`)).toBe('30');
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({
      detail: { goal: 30 },
    }));
    expect(mocks.updateUser).toHaveBeenCalledWith({
      data: { [`reading_goal_${year}`]: 30 },
    });
    window.removeEventListener('readingGoalUpdated', listener);
  });

  it('persists guest goals only to the legacy key without calling Supabase', async () => {
    const year = new Date().getFullYear();
    const { result } = renderHook(() => useReadingGoal());

    await act(async () => {
      await result.current.setGoal(15);
    });

    expect(localStorage.getItem(`readingGoal${year}`)).toBe('15');
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it('accepts goal update events from other components and ignores empty values', () => {
    const { result } = renderHook(() => useReadingGoal());

    act(() => {
      window.dispatchEvent(new CustomEvent('readingGoalUpdated', { detail: { goal: 20 } }));
    });
    expect(result.current.goal).toBe(20);

    act(() => {
      window.dispatchEvent(new CustomEvent('readingGoalUpdated', { detail: { goal: 0 } }));
    });
    expect(result.current.goal).toBe(20);
  });

  it('continues with optimistic state when storage or metadata persistence fails', async () => {
    mocks.user = { id: 'reader-1' };
    const storageError = new Error('storage blocked');
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw storageError;
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    mocks.updateUser.mockResolvedValue({ error: new Error('metadata unavailable') });
    const { result } = renderHook(() => useReadingGoal());

    await act(async () => {
      await result.current.setGoal(22);
    });

    expect(result.current).toMatchObject({ goal: 22, isLoading: false });
    expect(setItem).toHaveBeenCalled();
    expect(mocks.updateUser).toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith('Could not persist goal to localStorage:', storageError);
    expect(warn).toHaveBeenCalledWith(
      'Failed to sync reading goal to user profile metadata:',
      expect.any(Error),
    );
  });
});
