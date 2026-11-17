import { describe, expect, it } from "vitest";
import { EXPANDED_QUESTIONS } from "./questionBank";

describe("expanded brain question bank", () => {
  it("contains 50 uniquely identified questions, balanced across five domains", () => {
    expect(EXPANDED_QUESTIONS).toHaveLength(50);
    expect(new Set(EXPANDED_QUESTIONS.map((q) => q.id)).size).toBe(50);
    const counts = EXPANDED_QUESTIONS.reduce<Record<string, number>>((all, q) => {
      all[q.domain] = (all[q.domain] ?? 0) + 1;
      return all;
    }, {});
    expect(Object.keys(counts)).toHaveLength(5);
    expect(Object.values(counts)).toEqual([10, 10, 10, 10, 10]);
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

  it("has no duplicate prompts across both batches", () => {
    const prompts = EXPANDED_QUESTIONS.map((q) => q.prompt.trim().toLowerCase());
    expect(new Set(prompts).size).toBe(prompts.length);
  });
});
