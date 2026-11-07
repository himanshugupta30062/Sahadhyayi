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

  it("loads a valid saved record only for its owner and book", () => {
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
    expect(loadProgressLocally("book-1", "user-2")).toBeNull();
    expect(loadProgressLocally("book-1")).toBeNull();
  });

  it("returns null when neither scoped nor legacy progress exists", () => {
    expect(loadProgressLocally("missing-book", "user-1")).toBeNull();
  });

  it("never attributes ambiguous legacy progress to a signed-in user or guest", () => {
    localStorage.setItem("book-legacy-book-page", "17");
    localStorage.setItem("book-legacy-book-position", "old-position");
    localStorage.setItem("book-legacy-book-bookmarks", JSON.stringify(["old-bookmark"]));

    expect(loadProgressLocally("legacy-book", "user-2")).toBeNull();
    expect(localStorage.getItem("book-legacy-book-page")).toBeNull();
    expect(localStorage.getItem("book-legacy-book-position")).toBeNull();
    expect(localStorage.getItem("book-legacy-book-bookmarks")).toBeNull();
    expect(loadProgressLocally("legacy-book")).toBeNull();
  });

  it("saves bounded progress to a scoped key without writing shared legacy keys", () => {
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
    expect(localStorage.getItem("book-book-2-page")).toBeNull();
    expect(localStorage.getItem("book-book-2-position")).toBeNull();
    expect(localStorage.getItem("book-book-2-bookmarks")).toBeNull();
    expect(loadProgressLocally("book-2", "another-user")).toBeNull();
  });

  it("preserves omitted fields when updating the same user's progress", () => {
    saveProgressLocally({
      bookId: "book-3",
      currentPage: 10,
      totalPages: 200,
      position: "pos-1",
      bookmarks: ["bm-initial"],
    }, "user-3");

    saveProgressLocally({ bookId: "book-3", currentPage: 25 }, "user-3");

    expect(loadProgressLocally("book-3", "user-3")).toMatchObject({
      currentPage: 25,
      totalPages: 200,
      position: "pos-1",
      bookmarks: ["bm-initial"],
    });
  });

  it("ignores malformed scoped JSON instead of falling back to another user's legacy data", () => {
    localStorage.setItem(getProgressStorageKey("book-4", "user-4"), "{broken");
    localStorage.setItem("book-book-4-page", "12");

    expect(loadProgressLocally("book-4", "user-4")).toBeNull();
    expect(localStorage.getItem("book-book-4-page")).toBeNull();
  });
});
