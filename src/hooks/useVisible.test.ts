import { cleanup, renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useVisible } from '@/hooks/useVisible';

describe('useVisible', () => {
  let observerCallback: (entries: IntersectionObserverEntry[]) => void;
  let observeMock = vi.fn();
  let disconnectMock = vi.fn();

  beforeEach(() => {
    observeMock = vi.fn();
    disconnectMock = vi.fn();
    class MockIntersectionObserver {
      constructor(callback: any) {
        observerCallback = callback;
      }
      observe = observeMock;
      disconnect = disconnectMock;
      unobserve = vi.fn();
      takeRecords = vi.fn().mockReturnValue([]);
      root = null;
      rootMargin = '';
      thresholds = [];
    }
    window.IntersectionObserver = MockIntersectionObserver as any;
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('observes the ref element and updates visibility on intersection change', () => {
    const div = document.createElement('div');
    const { result, unmount } = renderHook(() => {
      const hook = useVisible<HTMLDivElement>();
      hook.ref.current = div;
      return hook;
    });

    expect(observeMock).toHaveBeenCalledWith(div);
    expect(result.current.visible).toBe(false);

    act(() => {
      observerCallback?.([{ isIntersecting: true } as IntersectionObserverEntry]);
    });

    expect(result.current.visible).toBe(true);

    unmount();
    expect(disconnectMock).toHaveBeenCalled();
  });
});
