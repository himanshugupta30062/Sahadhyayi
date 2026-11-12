// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";\nimport "@testing-library/jest-dom/vitest";
import BackToTopButton from "./BackToTopButton";

describe("BackToTopButton", () => {
  let scrollToMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
    scrollToMock = vi.fn();
    Object.defineProperty(window, "scrollTo", { configurable: true, value: scrollToMock });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("stays hidden until the page scrolls past 100px", () => {
    render(<BackToTopButton />);
    expect(screen.queryByRole("button", { name: "Back to top" })).not.toBeInTheDocument();

    act(() => {
      Object.defineProperty(window, "scrollY", { configurable: true, value: 101 });
      fireEvent.scroll(window);
    });
    expect(screen.getByRole("button", { name: "Back to top" })).toBeInTheDocument();
  });

  it("hides again when scroll position returns to the threshold", () => {
    render(<BackToTopButton />);
    act(() => {
      Object.defineProperty(window, "scrollY", { configurable: true, value: 150 });
      fireEvent.scroll(window);
    });
    expect(screen.getByRole("button", { name: "Back to top" })).toBeInTheDocument();

    act(() => {
      Object.defineProperty(window, "scrollY", { configurable: true, value: 100 });
      fireEvent.scroll(window);
    });
    expect(screen.queryByRole("button", { name: "Back to top" })).not.toBeInTheDocument();
  });

  it("smoothly scrolls to the top when clicked", () => {
    render(<BackToTopButton />);
    act(() => {
      Object.defineProperty(window, "scrollY", { configurable: true, value: 200 });
      fireEvent.scroll(window);
    });

    fireEvent.click(screen.getByRole("button", { name: "Back to top" }));
    expect(scrollToMock).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });

  it("removes its scroll listener on unmount", () => {
    const removeListener = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(<BackToTopButton />);
    unmount();
    expect(removeListener).toHaveBeenCalledWith("scroll", expect.any(Function));
  });
});
