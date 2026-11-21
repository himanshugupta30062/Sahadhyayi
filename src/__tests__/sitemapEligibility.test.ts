import { describe, expect, it } from "vitest";
import { getBookSitemapEligibility, getUniqueAuthorSitemapEntries } from "../../scripts/sitemapEligibility.mjs";
import { slugify } from "../../scripts/seoBuildUtils.mjs";

describe("sitemap eligibility", () => {
  it("allows complete book records with meaningful metadata", () => {
    expect(getBookSitemapEligibility({
      id: "book-1",
      title: "The Example Book",
      description: "A meaningful, unique description that explains the book's topic and gives readers helpful context before visiting its page.",
      author: "Example Author",
      cover_image_url: "https://cdn.example.com/cover.jpg",
    })).toEqual({ eligible: true, reasons: [] });
  });

  it("excludes records with missing identity, thin text, invalid cover, or no author", () => {
    const result = getBookSitemapEligibility({
      id: "../unsafe",
      title: "Thin Record",
      description: "Thin Record",
      author: "",
      cover_image_url: "http://not-secure.example/cover.jpg",
    });
    expect(result.eligible).toBe(false);
    expect(result.reasons).toEqual(expect.arrayContaining([
      "invalid_id", "thin_or_placeholder_description", "missing_or_invalid_cover", "missing_author",
    ]));
  });

  it("rejects placeholder descriptions and strips markup before evaluating content", () => {
    expect(getBookSitemapEligibility({
      id: "placeholder",
      title: "Placeholder Book",
      description: "<p>Coming soon</p>",
      author: "Writer",
      cover_image_url: "https://cdn.example.com/cover.jpg",
    }).eligible).toBe(false);
    expect(getBookSitemapEligibility({
      id: "book-html",
      title: "HTML Book",
      description: "<p>A detailed description with enough meaningful information about this book to pass the minimum content length requirement.</p>",
      author: "Writer",
      cover_image_url: "https://cdn.example.com/cover.jpg",
    }).eligible).toBe(true);
  });
});

describe("author sitemap entries", () => {
  it("ignores blank/invalid names and deduplicates slug collisions while retaining Unicode slugs", () => {
    const entries = getUniqueAuthorSitemapEntries([
      { name: "Munshi Premchand" },
      { name: "  " },
      { name: "Munshi  Premchand " },
      { name: "मुनशी प्रेमचंद" },
      { name: "***" },
    ], slugify);
    expect(entries).toEqual([
      { name: "Munshi Premchand", slug: "munshi-premchand" },
      { name: "मुनशी प्रेमचंद", slug: "मुनशी-प्रेमचंद" },
    ]);
  });
});
