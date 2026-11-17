import { describe, expect, it } from "vitest";
import { auditBookSeoQuality, summarizeBookSeoAudit } from "../../scripts/bookSeoQualityAudit.mjs";

describe("book SEO catalogue quality audit", () => {
  it("recognizes a complete record and validates ISBN checksums", () => {
    const [record] = auditBookSeoQuality([{
      id: "book-1",
      title: "A Useful Book",
      description: "A sufficiently detailed description of this book for a useful search result.",
      cover_image_url: "https://images.example/cover.jpg",
      author_id: "author-1",
      author: "Writer",
      isbn: "978-0-306-40615-7",
      genre: "History",
      language: "English",
      pages: 240,
      publication_year: 1998,
    }], [{ id: "author-1", name: "Writer" }], 2026);
    expect(record.score).toBe(100);
    expect(record.grade).toBe("A");
    expect(record.issues).toEqual([]);
  });

  it("flags missing assets, weak descriptions, broken author links and invalid metadata", () => {
    const [record] = auditBookSeoQuality([{
      id: "book-2",
      title: "Short",
      description: "N/A",
      cover_image_url: "http://insecure.example/cover.jpg",
      author: "Unknown Writer",
      isbn: "123",
      genre: "",
      language: "",
      pages: -1,
      publication_year: 1200,
    }], [], 2026);
    const codes = record.issues.map((issue) => issue.code);
    expect(codes).toEqual(expect.arrayContaining([
      "weak_description", "invalid_cover_url", "unlinked_author", "invalid_isbn",
      "missing_genre", "missing_language", "invalid_publication_year", "invalid_page_count",
    ]));
    expect(record.score).toBeLessThan(80);
  });

  it("proposes only reversible whitespace cleanup and leaves factual corrections for review", () => {
    const [record] = auditBookSeoQuality([{
      id: "book-review",
      title: "  A Book  ",
      author: " Writer ",
      genre: " History ",
      language: " English ",
      description: "A useful, sufficiently long description for this particular book.",
      cover_image_url: "https://images.example/cover.jpg",
      isbn: "9780306406157",
    }], [{ id: "author-1", name: "Writer" }], 2026);
    expect(record.suggestedChanges.map((change) => change.field)).toEqual(["title", "author", "genre", "language"]);
    expect(record.suggestedChanges.every((change) => change.requiresHumanApproval)).toBe(true);
    expect(record.reviewStatus).toBe("pending_review");
    expect(record.reviewActions).toEqual([]);
  });

  it("reports missing book assets and summarizes catalogue-wide issue counts", () => {
    const records = auditBookSeoQuality([{ id: "book-3", title: "Bare Record" }], []);
    const summary = summarizeBookSeoAudit(records);
    expect(records[0].issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      "missing_description", "missing_cover", "missing_author", "missing_isbn",
    ]));
    expect(summary.total).toBe(1);
    expect(summary.needsAttention).toBe(1);
    expect(summary.issueCounts.missing_cover).toBe(1);
  });
});
