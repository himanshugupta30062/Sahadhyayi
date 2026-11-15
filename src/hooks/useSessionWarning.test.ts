import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSessionWarning } from './useSessionWarning';

let mockUser: { id: string } | null = { id: 'user-1' };
vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: mockUser }),
}));

describe('useSessionWarning', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not show warning when user is not authenticated', () => {
    mockUser = null;
    const { result } = renderHook(() => useSessionWarning());
    expect(result.current.showWarning).toBe(false);
    mockUser = { id: 'user-1' };
  });

  it('updates lastActivity and resets warning on extendSession', () => {
    const { result } = renderHook(() => useSessionWarning());

    act(() => {
      result.current.extendSession();
    });

    expect(result.current.showWarning).toBe(false);
    expect(result.current.timeRemaining).toBe(0);
    expect(localStorage.getItem('lastActivity')).toBeTruthy();
  });

  it('triggers warning when inactivity reaches warning window', () => {
    // 30 min timeout, warning is shown at 5 min before timeout (25 min of inactivity)
    const twentySixMinutesAgo = Date.now() - (26 * 60 * 1000);
    localStorage.setItem('lastActivity', twentySixMinutesAgo.toString());

    const { result } = renderHook(() => useSessionWarning());

    expect(result.current.showWarning).toBe(true);
    expect(result.current.timeRemaining).toBeGreaterThan(0);
  });
});
