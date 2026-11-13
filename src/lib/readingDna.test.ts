import { describe, expect, it } from "vitest";
import {
  cosineSimilarity,
  genreOverlap,
  getCrossRecommendations,
  getCompatibilityBreakdown,
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
    expect(genreOverlap(dna(), dna({ genres: [{ name: " fantasy ", weight: 0.5 }, { name: "Romance", weight: 0.5 }] }))).toBeCloseTo(0.5 / 1.7);
  });

  it("returns zero when both genre lists are empty", () => {
    expect(genreOverlap(dna({ genres: [] }), dna({ genres: [] }))).toBe(0);
  });

  it("handles empty and disjoint cosine vectors", () => {
    expect(cosineSimilarity([], ["hopeful"])).toBe(0);
    expect(cosineSimilarity(["hopeful"], ["dark"])).toBe(0);
  });

  it("normalizes terms and computes cosine similarity", () => {
    expect(cosineSimilarity([" Hopeful ", "curious"], ["hopeful", "CURIOUS"])).toBeCloseTo(1);
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
    const result = getCrossRecommendations(mine, friends, dna({ genres: [{ name: "fantasy", weight: 1 }] }));
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

describe("compatibility breakdown and explanation", () => {
  it("provides comprehensive breakdown with confidence, shared signals, and narrative", () => {
    const readerA = dna({
      genres: [
        { name: "Science Fiction", weight: 0.9 },
        { name: "Fantasy", weight: 0.7 },
        { name: "Literary Fiction", weight: 0.5 },
      ],
      moods: ["thoughtful", "reflective"],
      themes: ["space", "identity"],
      pace: "steady",
    });

    const readerB = dna({
      user_id: "reader-2",
      genres: [
        { name: "Science Fiction", weight: 0.8 },
        { name: "Fantasy", weight: 0.6 },
        { name: "Historical Fiction", weight: 0.4 },
      ],
      moods: ["thoughtful", "adventurous"],
      themes: ["space", "revolution"],
      pace: "steady",
    });

    const shelfA: ShelfBookItem[] = [
      shelfBook("dune", "Science Fiction", 5),
      shelfBook("hobbit", "Fantasy", 4),
    ];

    const shelfB: ShelfBookItem[] = [
      shelfBook("dune", "Science Fiction", 5),
      shelfBook("foundation", "Science Fiction", 4),
    ];

    const breakdown = getCompatibilityBreakdown(readerA, readerB, shelfA, shelfB);

    expect(breakdown.score).toBeGreaterThan(50);
    expect(breakdown.confidence).toBe("high");
    expect(breakdown.sharedGenres).toContain("Science Fiction");
    expect(breakdown.sharedGenres).toContain("Fantasy");
    expect(breakdown.sharedMoods).toEqual(["thoughtful"]);
    expect(breakdown.sharedThemes).toEqual(["space"]);
    expect(breakdown.paceMatch).toBe(true);

    // Overlapping book Dune
    expect(breakdown.overlappingBooks).toHaveLength(1);
    expect(breakdown.overlappingBooks[0].title).toBe("Book dune");
    expect(breakdown.overlappingBooks[0].myRating).toBe(5);

    // Narrative contains shared genre
    expect(breakdown.narrativeExplanation).toMatch(/Science Fiction/i);

    // Differences in taste contains Historical Fiction
    expect(breakdown.differencesInTaste).toContain("Historical Fiction");
  });

  it("handles empty or emerging DNA profiles safely without division by zero or crashing", () => {
    const emptyDna = dna({ genres: [], moods: [], themes: [], pace: null });
    const breakdown = getCompatibilityBreakdown(null, emptyDna);

    expect(breakdown.score).toBe(0);
    expect(breakdown.confidence).toBe("emerging");
    expect(breakdown.sharedGenres).toHaveLength(0);
    expect(breakdown.narrativeExplanation).toBeTruthy();
  });
});

