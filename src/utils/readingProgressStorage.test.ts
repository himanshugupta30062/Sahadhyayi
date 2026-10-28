/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getProgressStorageKey,
  loadProgressLocally,
  saveProgressLocally,
} from "@/utils/readingProgressStorage";

describe("reading progress storage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("creates separate keys for signed-in users and guests", () => {
    expect(getProgressStorageKey("book-1", "user-1")).toBe("sahadhyayi_progress_user-1_book-1");
    expect(getProgressStorageKey("book-1")).toBe("sahadhyayi_progress_guest_book-1");
  });

  it("loads a valid saved record for the requested user and book", () => {
    const record = {
      bookId: "book-1",
      userId: "user-1",
      currentPage: 8,
      totalPages: 120,
      position: "chapter-2",
      bookmarks: ["page-3"],
      updatedAt: 123,
    };
    localStorage.setItem(getProgressStorageKey("book-1", "user-1"), JSON.stringify(record));

    expect(loadProgressLocally("book-1", "user-1")).toEqual(record);
  });

  it("returns null when neither keyed nor legacy progress exists", () => {
    expect(loadProgressLocally("missing-book", "user-1")).toBeNull();
  });

  it("migrates legacy progress and safely defaults invalid page and bookmark data", () => {
    localStorage.setItem("book-legacy-page", "not-a-page");
    localStorage.setItem("book-legacy-bookmarks", "{broken");

    expect(loadProgressLocally("legacy-book", "user-2")).toEqual({
      bookId: "legacy-book",
      userId: "user-2",
      currentPage: 1,
      totalPages: 1,
      position: null,
      bookmarks: [],
      updatedAt: Date.now(),
    });
  });

  it("saves progress with bounded page values and preserves omitted fields", () => {
    saveProgressLocally({
      bookId: "book-2",
      currentPage: 4,
      totalPages: 30,
      position: "section-1",
      bookmarks: ["page-2"],
    }, "user-2");

    saveProgressLocally({ bookId: "book-2", currentPage: 0 }, "user-2");

    expect(loadProgressLocally("book-2", "user-2")).toMatchObject({
      bookId: "book-2",
      userId: "user-2",
      currentPage: 1,
      totalPages: 30,
      position: "section-1",
      bookmarks: ["page-2"],
      updatedAt: Date.now(),
    });
    expect(localStorage.getItem("book-book-2-page")).toBe("1");
    expect(localStorage.getItem("book-book-2-position")).toBe("section-1");
    expect(localStorage.getItem("book-book-2-bookmarks")).toBe(JSON.stringify(["page-2"]));
  });

  it("recovers from malformed keyed JSON and falls back to legacy data", () => {
    localStorage.setItem(getProgressStorageKey("book-3"), "{broken");
    localStorage.setItem("book-book-3-page", "12");

    expect(loadProgressLocally("book-3")).toMatchObject({
      bookId: "book-3",
      currentPage: 12,
      totalPages: 1,
      bookmarks: [],
    });
  });
});
