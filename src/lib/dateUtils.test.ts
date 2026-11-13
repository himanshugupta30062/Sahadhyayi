import { afterEach, describe, expect, it, vi } from "vitest";
import { safeFormatDistanceToNow } from "./dateUtils";

describe("safeFormatDistanceToNow", () => {
  afterEach(() => vi.useRealTimers());

  it.each([null, undefined, "", 0])("returns fallback for empty input %s", (date) => {
    expect(safeFormatDistanceToNow(date as null | undefined | string | number, undefined, "fallback")).toBe("fallback");
  });

  it("returns fallback for invalid date strings", () => {
    expect(safeFormatDistanceToNow("not-a-date", undefined, "unknown")).toBe("unknown");
  });

  it("formats valid dates using date-fns options", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-13T12:00:00Z"));
    expect(safeFormatDistanceToNow("2026-11-13T11:55:00Z", { addSuffix: true })).toBe("5 minutes ago");
    expect(safeFormatDistanceToNow(new Date("2026-11-13T12:00:30Z"), { includeSeconds: true })).toBe("less than a minute");
  });

  it("accepts timestamps and honors a custom fallback", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-13T12:00:00Z"));
    expect(safeFormatDistanceToNow(Date.parse("2026-11-13T11:00:00Z"), { addSuffix: true })).toBe("about 1 hour ago");
    expect(safeFormatDistanceToNow("invalid", undefined, "—")).toBe("—");
  });
});
