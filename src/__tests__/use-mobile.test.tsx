/** @vitest-environment jsdom */

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useIsMobile } from "@/hooks/use-mobile";

describe("useIsMobile", () => {
  let addEventListener: ReturnType<typeof vi.fn>;
  let removeEventListener: ReturnType<typeof vi.fn>;
  let changeHandler: (() => void) | undefined;

  const setWidth = (width: number) => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: width,
    });
  };

  beforeEach(() => {
    addEventListener = vi.fn((event: string, handler: () => void) => {
      if (event === "change") changeHandler = handler;
    });
    removeEventListener = vi.fn();
    changeHandler = undefined;

    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: false,
        media: "(max-width: 767px)",
        onchange: null,
        addEventListener,
        removeEventListener,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(() => true),
      })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns false for desktop widths after mounting", () => {
    setWidth(1024);

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
    expect(window.matchMedia).toHaveBeenCalledWith("(max-width: 767px)");
    expect(addEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  });

  it("returns true below the mobile breakpoint", () => {
    setWidth(767);

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
  });

  it("treats the breakpoint itself as desktop width", () => {
    setWidth(768);

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
  });

  it("updates when the media query change event fires", () => {
    setWidth(1024);
    const { result } = renderHook(() => useIsMobile());

    setWidth(600);
    act(() => {
      changeHandler?.();
    });
    expect(result.current).toBe(true);

    setWidth(900);
    act(() => {
      changeHandler?.();
    });
    expect(result.current).toBe(false);
  });

  it("removes its media query listener when unmounted", () => {
    const { unmount } = renderHook(() => useIsMobile());

    unmount();

    expect(removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  });
});
