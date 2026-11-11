// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAsyncError } from "./useAsyncError";
import { errorHandler } from "@/utils/errorHandler";

vi.mock("@/utils/errorHandler", () => ({
  errorHandler: { handleError: vi.fn() },
}));

describe("useAsyncError", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reports async errors with browser and route context", () => {
    const { result } = renderHook(() => useAsyncError());
    const error = new Error("boom");

    act(() => result.current.reportAsyncError(error, { action: "load", component: "Widget" }));

    expect(errorHandler.handleError).toHaveBeenCalledWith(expect.objectContaining({
      message: "boom",
      stack: error.stack,
      type: "promise",
      severity: "high",
      context: expect.objectContaining({
        userAgent: navigator.userAgent,
        route: window.location.pathname,
        action: "load",
        component: "Widget",
        timestamp: expect.any(Number),
      }),
    }));
  });

  it("returns the async function result on success", async () => {
    const { result } = renderHook(() => useAsyncError());
    await expect(result.current.safeAsync(async () => 42)).resolves.toBe(42);
    expect(errorHandler.handleError).not.toHaveBeenCalled();
  });

  it("reports rejected work and returns the supplied fallback", async () => {
    const { result } = renderHook(() => useAsyncError());
    const error = new Error("request failed");

    await expect(result.current.safeAsync(
      async () => { throw error; },
      "fallback",
      { action: "fetch", component: "Panel" },
    )).resolves.toBe("fallback");

    expect(errorHandler.handleError).toHaveBeenCalledWith(expect.objectContaining({
      message: "request failed",
      type: "promise",
      severity: "high",
      context: expect.objectContaining({ action: "fetch", component: "Panel" }),
    }));
  });

  it("returns undefined when a rejected task has no fallback", async () => {
    const { result } = renderHook(() => useAsyncError());
    await expect(result.current.safeAsync(async () => {
      throw new Error("failed");
    })).resolves.toBeUndefined();
    expect(errorHandler.handleError).toHaveBeenCalledTimes(1);
  });
});
