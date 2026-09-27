import { describe, it, expect } from "vitest";
import {
  genreOverlap,
  cosineSimilarity,
  matchScore,
  getCrossRecommendations,
  type ReadingDna,
  type ShelfBookItem,
} from "@/lib/readingDna";

describe("readingDna pure functions", () => {
  const dnaA: ReadingDna = {
    user_id: "user-1",
    genres: [
      { name: "Sci-Fi", weight: 0.5 },
      { name: "Philosophy", weight: 0.3 },
      { name: "History", weight: 0.2 },
    ],
    moods: ["contemplative", "epic", "intellectual"],
    pace: "steady",
    themes: ["existentialism", "technology"],
    summary: "A thoughtful sci-fi enthusiast",
    signature_color: "#3b82f6",
    generated_at: new Date().toISOString(),
  };

  const dnaB: ReadingDna = {
    user_id: "user-2",
    genres: [
      { name: "Sci-Fi", weight: 0.4 },
      { name: "Philosophy", weight: 0.4 },
      { name: "Poetry", weight: 0.2 },
    ],
    moods: ["contemplative", "intellectual", "cozy"],
    pace: "steady",
    themes: ["existentialism", "mind"],
    summary: "Philosophical fiction lover",
    signature_color: "#10b981",
    generated_at: new Date().toISOString(),
  };

  const dnaC: ReadingDna = {
    user_id: "user-3",
    genres: [
      { name: "Romance", weight: 0.7 },
      { name: "Cookbooks", weight: 0.3 },
    ],
    moods: ["lighthearted", "whimsical"],
    pace: "fast",
    themes: ["relationships", "food"],
    summary: "Romance & culinary fan",
    signature_color: "#ec4899",
    generated_at: new Date().toISOString(),
  };

  it("calculates genre overlap using weighted Jaccard correctly", () => {
    const overlapAB = genreOverlap(dnaA, dnaB);
    expect(overlapAB).toBeGreaterThan(0.5);

    const overlapAC = genreOverlap(dnaA, dnaC);
    expect(overlapAC).toBe(0);
  });

  it("calculates cosine similarity over mood and theme vectors", () => {
    const moodSimAB = cosineSimilarity(dnaA.moods, dnaB.moods);
    expect(moodSimAB).toBeGreaterThan(0.5);

    const moodSimAC = cosineSimilarity(dnaA.moods, dnaC.moods);
    expect(moodSimAC).toBe(0);
  });

  it("calculates accurate match score between 0 and 100", () => {
    const scoreSelf = matchScore(dnaA, dnaA);
    expect(scoreSelf).toBe(100);

    const scoreAB = matchScore(dnaA, dnaB);
    expect(scoreAB).toBeGreaterThan(50);
    expect(scoreAB).toBeLessThanOrEqual(100);

    const scoreAC = matchScore(dnaA, dnaC);
    expect(scoreAC).toBeLessThan(20);
  });

  it("handles null DNA inputs gracefully", () => {
    expect(matchScore(null, dnaA)).toBe(0);
    expect(matchScore(dnaA, null)).toBe(0);
    expect(matchScore(null, null)).toBe(0);
  });

  it("generates cross-recommendations prioritizing top overlapping genres", () => {
    const myShelf: ShelfBookItem[] = [
      { book_id: "book-1", books_library: { id: "book-1", title: "Dune", author: "Frank Herbert", genre: "Sci-Fi", cover_image_url: null } },
    ];

    const friendShelf: ShelfBookItem[] = [
      { book_id: "book-1", books_library: { id: "book-1", title: "Dune", author: "Frank Herbert", genre: "Sci-Fi", cover_image_url: null } }, // already read
      { book_id: "book-2", rating: 5, books_library: { id: "book-2", title: "Foundation", author: "Isaac Asimov", genre: "Sci-Fi", cover_image_url: null } },
      { book_id: "book-3", rating: 4, books_library: { id: "book-3", title: "Meditations", author: "Marcus Aurelius", genre: "Philosophy", cover_image_url: null } },
      { book_id: "book-4", rating: 3, books_library: { id: "book-4", title: "Baking 101", author: "Baker Bob", genre: "Cookbooks", cover_image_url: null } },
    ];

    const recs = getCrossRecommendations(myShelf, friendShelf, dnaA, 2);
    expect(recs.length).toBe(2);
    // Foundation (Sci-Fi) and Meditations (Philosophy) match top genres of dnaA
    const titles = recs.map((r) => r.books_library?.title);
    expect(titles).toContain("Foundation");
    expect(titles).not.toContain("Dune"); // Should filter out already read book
  });
});
