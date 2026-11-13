import { describe, expect, it } from "vitest";
import {
  cosineSimilarity,
  genreOverlap,
  getCrossRecommendations,
  matchScore,
  type ReadingDna,
  type ShelfBookItem,
} from "./readingDna";

const dna = (overrides: Partial<ReadingDna> = {}): ReadingDna => ({
  user_id: "reader-1",
  genres: [{ name: "Fantasy", weight: 0.8 }, { name: "Mystery", weight: 0.4 }],
  moods: ["hopeful", "curious"],
  pace: "fast",
  themes: ["friendship", "identity"],
  summary: null,
  signature_color: null,
  generated_at: "2026-01-01",
  ...overrides,
});

const shelfBook = (id: string, genre: string, rating?: number): ShelfBookItem => ({
  book_id: id,
  rating,
  books_library: { id, title: `Book ${id}`, author: "Author", cover_image_url: null, genre },
});

describe("reading DNA similarity", () => {
  it("calculates weighted genre overlap case-insensitively", () => {
    expect(genreOverlap(dna(), dna({ genres: [{ name: " fantasy ", weight: 0.5 }, { name: "Romance", weight: 0.5 }] }))).toBeCloseTo(0.5);
  });

  it("returns zero when both genre lists are empty", () => {
    expect(genreOverlap(dna({ genres: [] }), dna({ genres: [] }))).toBe(0);
  });

  it("handles empty and disjoint cosine vectors", () => {
    expect(cosineSimilarity([], ["hopeful"])).toBe(0);
    expect(cosineSimilarity(["hopeful"], ["dark"])).toBe(0);
  });

  it("normalizes terms and computes cosine similarity", () => {
    expect(cosineSimilarity([" Hopeful ", "curious"], ["hopeful", "CURIOUS"])).toBe(1);
    expect(cosineSimilarity(["hopeful", "curious"], ["hopeful"])).toBeCloseTo(1 / Math.sqrt(2));
  });

  it("returns zero for missing DNA and rounds a weighted match", () => {
    expect(matchScore(null, dna())).toBe(0);
    expect(matchScore(dna(), null)).toBe(0);
    expect(matchScore(dna(), dna())).toBe(100);
  });

  it("awards pace alignment only when normalized pace values match", () => {
    const base = dna({ genres: [], moods: [], themes: [], pace: " FAST " });
    expect(matchScore(base, dna({ genres: [], moods: [], themes: [], pace: "fast" }))).toBe(10);
    expect(matchScore(base, dna({ genres: [], moods: [], themes: [], pace: "slow" }))).toBe(0);
  });
});

describe("reading DNA cross recommendations", () => {
  const mine = [shelfBook("already-read", "Fantasy")];
  const friends = [
    shelfBook("mystery", "Mystery", 5),
    shelfBook("fantasy", "Fantasy", 2),
    shelfBook("already-read", "Fantasy", 5),
    { book_id: "missing-title", books_library: { id: "missing-title", title: "", author: null, cover_image_url: null, genre: "Fantasy" } },
  ];

  it("excludes books already on my shelf and invalid titles", () => {
    const result = getCrossRecommendations(mine, friends, null);
    expect(result.map((book) => book.book_id)).toEqual(["mystery", "fantasy"]);
  });

  it("returns shelf order without DNA and respects the limit", () => {
    expect(getCrossRecommendations([], friends, null, 1).map((book) => book.book_id)).toEqual(["mystery"]);
  });

  it("ranks genre matches and boosts high friend ratings", () => {
    const result = getCrossRecommendations([], friends, dna({ genres: [{ name: "fantasy", weight: 1 }] }));
    expect(result.map((book) => book.book_id)).toEqual(["fantasy", "mystery"]);
  });

  it("supports fallback identifiers and empty genre DNA", () => {
    const books: ShelfBookItem[] = [
      { id: "one", books_library: { title: "One", id: "one", author: null, cover_image_url: null, genre: null } },
      { books_library: { title: "Two", id: "two", author: null, cover_image_url: null, genre: "Drama" } },
    ];
    expect(getCrossRecommendations([], books, dna({ genres: [] })).map((b) => b.books_library?.id)).toEqual(["one", "two"]);
  });
});
