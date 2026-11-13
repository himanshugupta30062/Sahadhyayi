// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useIsMobile } from './use-mobile';

describe('useIsMobile', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.matchMedia = originalMatchMedia;
    window.innerWidth = 1024;
  });

  const originalMatchMedia = window.matchMedia;

  it('returns false on desktop width', () => {
    window.innerWidth = 1024;
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('returns true below the mobile breakpoint', () => {
    window.innerWidth = 767;
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('updates when the media query changes and removes its listener on unmount', () => {
    window.innerWidth = 1024;
    let listener: (() => void) | undefined;
    const addEventListener = vi.fn((_event: string, callback: () => void) => {
      listener = callback;
    });
    const removeEventListener = vi.fn();
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      addEventListener,
      removeEventListener,
    })));

    const { result, unmount } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    act(() => {
      window.innerWidth = 600;
      listener?.();
    });
    expect(result.current).toBe(true);

    unmount();
    expect(removeEventListener).toHaveBeenCalledWith('change', listener);
  });

  it('falls back to window width when matchMedia is unavailable', () => {
    vi.stubGlobal('matchMedia', undefined);
    window.innerWidth = 600;
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });
});
