import { describe, expect, it } from "vitest";
import { createHash } from "@/ai/utils/hash";

describe("createHash", () => {
  it("returns a stable cache-key string", () => {
    expect(createHash("sahadhyayi")).toBe(createHash("sahadhyayi"));
    expect(createHash("sahadhyayi")).toMatch(/^h[0-9a-z]+$/);
  });

  it("handles empty and different inputs", () => {
    expect(createHash("")).toBe("h0");
    expect(createHash("book one")).not.toBe(createHash("book two"));
  });
});
