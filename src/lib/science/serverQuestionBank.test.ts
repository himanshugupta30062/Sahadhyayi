import { describe, expect, it } from "vitest";
import { SERVER_SCIENCE_QUESTIONS } from "../../../supabase/functions/_shared/scienceQuestionBank";

describe("private server science question banks", () => {
  it.each(["beginner", "intermediate", "advanced"] as const)(
    "contains ten fully-rubriced %s questions",
    (difficulty) => {
      const questions = SERVER_SCIENCE_QUESTIONS.filter((question) => question.difficulty === difficulty);
      expect(questions).toHaveLength(10);
      expect(new Set(questions.map((question) => question.id)).size).toBe(10);
      for (const question of questions) {
        expect(question.referenceAnswer.trim().length).toBeGreaterThan(80);
        expect(question.correctExplanation.trim().length).toBeGreaterThan(80);
        expect(question.keyConcepts.length).toBeGreaterThanOrEqual(4);
      }
    },
  );

  it("keeps all question IDs unique across levels", () => {
    expect(new Set(SERVER_SCIENCE_QUESTIONS.map((question) => question.id)).size).toBe(30);
  });
});
