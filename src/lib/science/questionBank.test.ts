import { describe, expect, it } from "vitest";
import { SCIENCE_QUESTIONS, getScienceQuestionsForDifficulty, shuffleScienceQuestions } from "./questionBank";

describe("everyday science question bank", () => {
  it("contains ten distinct open-ended questions across real-world science domains", () => {
    expect(SCIENCE_QUESTIONS).toHaveLength(10);
    expect(new Set(SCIENCE_QUESTIONS.map((question) => question.id)).size).toBe(10);
    expect(new Set(SCIENCE_QUESTIONS.map((question) => question.domain)).size).toBeGreaterThanOrEqual(3);
    for (const question of SCIENCE_QUESTIONS) {
      expect(question.prompt.trim().length).toBeGreaterThan(25);
      expect(question.context.trim().length).toBeGreaterThan(10);
      expect(question.youtubeSearch.trim().length).toBeGreaterThan(0);
      expect(question.book.title.trim().length).toBeGreaterThan(0);
    }
  });

  it("provides progressively deeper challenge prompts without changing the stable question IDs", () => {
    const beginner = getScienceQuestionsForDifficulty("beginner");
    const intermediate = getScienceQuestionsForDifficulty("intermediate");
    const advanced = getScienceQuestionsForDifficulty("advanced");
    expect(beginner.map((question) => question.id)).toEqual(SCIENCE_QUESTIONS.map((question) => question.id));
    expect(intermediate[0].prompt).toContain("cause-and-effect sequence");
    expect(advanced[0].prompt).toContain("interacting factors");
    expect(advanced[0].prompt).not.toEqual(beginner[0].prompt);
  });

  it("shuffles without mutating the canonical question bank", () => {
    const originalIds = SCIENCE_QUESTIONS.map((question) => question.id);
    const shuffled = shuffleScienceQuestions(SCIENCE_QUESTIONS, () => 0);
    expect(SCIENCE_QUESTIONS.map((question) => question.id)).toEqual(originalIds);
    expect(new Set(shuffled.map((question) => question.id))).toEqual(new Set(originalIds));
    expect(shuffled).toHaveLength(originalIds.length);
    expect(shuffled.map((question) => question.id)).not.toEqual(originalIds);
  });

  it("returns a copy for a one-question set", () => {
    const single = [SCIENCE_QUESTIONS[0]];
    const shuffled = shuffleScienceQuestions(single);
    expect(shuffled).toEqual(single);
    expect(shuffled).not.toBe(single);
  });
});
