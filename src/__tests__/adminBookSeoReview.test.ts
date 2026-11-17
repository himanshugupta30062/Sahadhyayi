import { describe, expect, it } from "vitest";
import { parseBookSeoReviewQueue } from "@/pages/AdminBookSeoReview";

describe("parseBookSeoReviewQueue", () => {
  it("accepts the generated review queue format and ignores malformed items", () => {
    const queue = parseBookSeoReviewQueue({
      generatedAt: "2026-11-17T12:00:00.000Z",
      instructions: "Verify every item.",
      items: [
        { bookId: "book-1", title: "A Book", issues: [{ code: "missing_cover" }] },
        { bookId: "", title: "Invalid" },
        { title: "Missing ID" },
      ],
    });
    expect(queue.items).toHaveLength(1);
    expect(queue.items[0].bookId).toBe("book-1");
    expect(queue.generatedAt).toBe("2026-11-17T12:00:00.000Z");
  });

  it("rejects non-object and unsupported queue files", () => {
    expect(() => parseBookSeoReviewQueue(null)).toThrow("not a valid review queue");
    expect(() => parseBookSeoReviewQueue({ items: [] })).toThrow("generatedAt and items");
    expect(() => parseBookSeoReviewQueue({ generatedAt: "today", items: [] })).toThrow("No valid book review items");
  });
});
