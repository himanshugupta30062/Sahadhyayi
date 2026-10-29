// @vitest-environment jsdom

import React, { type PropsWithChildren } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mocks = vi.hoisted(() => ({
  user: null as null | { id: string; user_metadata?: Record<string, unknown> },
  updateUser: vi.fn(),
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: mocks.user }),
}));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    auth: {
      updateUser: (...args: unknown[]) => mocks.updateUser(...args),
    },
  },
}));

import { useReadingGoal } from './useReadingGoal';

const currentYear = new Date().getFullYear();
const legacyKey = `readingGoal${currentYear}`;

const renderGoalHook = () => {
  const queryClient = new QueryClient();
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(() => useReadingGoal(), { wrapper });
};

describe('useReadingGoal', () => {
  beforeEach(() => {
    localStorage.clear();
    mocks.user = null;
    mocks.updateUser.mockReset().mockResolvedValue({ data: { user: null }, error: null });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('defaults to twelve books when no saved goal exists', () => {
    const { result } = renderGoalHook();

    expect(result.current.goal).toBe(12);
    expect(result.current.currentYear).toBe(currentYear);
    expect(result.current.isLoading).toBe(false);
  });

  it('prefers a valid goal from user metadata over local storage', () => {
    mocks.user = {
      id: 'reader-1',
      user_metadata: { [`reading_goal_${currentYear}`]: 24 },
    };
    localStorage.setItem(`sahadhyayi_goal_reader-1_${currentYear}`, '18');
    localStorage.setItem(legacyKey, '10');

    const { result } = renderGoalHook();

    expect(result.current.goal).toBe(24);
  });

  it('loads the user-specific local goal before the legacy goal', () => {
    mocks.user = { id: 'reader-1' };
    localStorage.setItem(`sahadhyayi_goal_reader-1_${currentYear}`, '16');
    localStorage.setItem(legacyKey, '8');

    const { result } = renderGoalHook();

    expect(result.current.goal).toBe(16);
  });

  it('falls back to the legacy goal and ignores invalid saved values', () => {
    localStorage.setItem(legacyKey, '9');
    const { result, rerender } = renderGoalHook();
    expect(result.current.goal).toBe(9);

    localStorage.setItem(legacyKey, '-4');
    rerender();
    expect(result.current.goal).toBe(9);
  });

  it('synchronizes the goal when the readingGoalUpdated event fires', async () => {
    const { result } = renderGoalHook();

    act(() => {
      window.dispatchEvent(new CustomEvent('readingGoalUpdated', { detail: { goal: 20 } }));
    });

    await waitFor(() => expect(result.current.goal).toBe(20));
  });

  it('persists a valid goal locally and to authenticated user metadata', async () => {
    mocks.user = { id: 'reader-1' };
    const { result } = renderGoalHook();

    await act(async () => {
      await result.current.setGoal(30);
    });

    expect(result.current.goal).toBe(30);
    expect(result.current.isLoading).toBe(false);
    expect(localStorage.getItem(legacyKey)).toBe('30');
    expect(localStorage.getItem(`sahadhyayi_goal_reader-1_${currentYear}`)).toBe('30');
    expect(mocks.updateUser).toHaveBeenCalledWith({
      data: { [`reading_goal_${currentYear}`]: 30 },
    });
  });

  it('ignores non-positive goals without changing persistence', async () => {
    const { result } = renderGoalHook();

    await act(async () => {
      await result.current.setGoal(0);
    });

    expect(result.current.goal).toBe(12);
    expect(localStorage.getItem(legacyKey)).toBeNull();
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it('keeps the optimistic goal when metadata synchronization fails', async () => {
    mocks.user = { id: 'reader-1' };
    mocks.updateUser.mockRejectedValue(new Error('Auth unavailable'));
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { result } = renderGoalHook();

    await act(async () => {
      await result.current.setGoal(22);
    });

    expect(result.current.goal).toBe(22);
    expect(result.current.isLoading).toBe(false);
    expect(warning).toHaveBeenCalledWith(
      'Failed to sync reading goal to user profile metadata:',
      expect.any(Error),
    );
  });
});
