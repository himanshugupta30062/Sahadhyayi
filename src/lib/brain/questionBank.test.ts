import { describe, expect, it } from "vitest";
import { EXPANDED_QUESTIONS } from "./questionBank";

describe("expanded brain question bank", () => {
  it("contains 25 uniquely identified questions across five domains", () => {
    expect(EXPANDED_QUESTIONS).toHaveLength(25);
    expect(new Set(EXPANDED_QUESTIONS.map((q) => q.id)).size).toBe(25);
    expect(new Set(EXPANDED_QUESTIONS.map((q) => q.domain)).size).toBe(5);
  });
  it("validates options, answer indexes, difficulty, skill and explanations", () => {
    for (const q of EXPANDED_QUESTIONS) {
      expect(q.id.trim()).not.toBe("");
      expect(q.prompt.trim()).not.toBe("");
      expect(q.skill.trim()).not.toBe("");
      expect(q.explanation.trim()).not.toBe("");
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options.map((o) => o.trim().toLowerCase())).size).toBe(4);
      expect(Number.isInteger(q.answer)).toBe(true);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(["Easy", "Medium", "Hard"]).toContain(q.difficulty);
    }
  });
  it("has no duplicate prompts in this batch", () => {
    const prompts = EXPANDED_QUESTIONS.map((q) => q.prompt.trim().toLowerCase());
    expect(new Set(prompts).size).toBe(prompts.length);
  });
});
