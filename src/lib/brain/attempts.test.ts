import { describe, expect, it } from "vitest";
import { scoreBrainAssessment } from "./scoring";
import { toBrainAttemptHistory, type BrainAssessmentAttemptRow } from "./attempts";

const row: BrainAssessmentAttemptRow = {
  id: "attempt-1",
  user_id: "user-1",
  mode: "practice",
  difficulty: "Medium",
  question_count: 10,
  correct_count: 7,
  duration_seconds: 315,
  domain_scores: { Logic: { correct: 3, total: 4 } },
  question_set_version: "v1",
  completed_at: "2026-11-17T10:00:00.000Z",
};

describe("toBrainAttemptHistory", () => {
  it("maps a persisted attempt into the existing history shape", () => {
    expect(toBrainAttemptHistory(row)).toEqual({
      date: row.completed_at,
      score: 7,
      total: 10,
      mode: "Practice",
      domains: { Logic: { correct: 3, total: 4 } },
      durationSeconds: 315,
    });
  });

  it("keeps daily and general assessment labels stable", () => {
    expect(toBrainAttemptHistory({ ...row, mode: "daily" }).mode).toBe("Daily");
    expect(toBrainAttemptHistory({ ...row, mode: "general" }).mode).toBe("Test");
  });
});


describe("scoreBrainAssessment", () => {
  it("scores correct, incorrect, skipped and out-of-range answers safely", () => {
    const questions = [
      { id: "q1", domain: "Logic", answer: 1 },
      { id: "q2", domain: "Logic", answer: 0 },
      { id: "q3", domain: "Visual patterns", answer: 2 },
    ];
    const result = scoreBrainAssessment(questions, { q1: 1, q2: 3, q3: 2, q4: 1 });
    expect(result).toEqual({
      correct: 2,
      total: 3,
      percentage: 67,
      byDomain: {
        Logic: { correct: 1, total: 2 },
        "Visual patterns": { correct: 1, total: 1 },
      },
    });
  });

  it("returns a safe zero result for an empty assessment", () => {
    expect(scoreBrainAssessment([], {})).toEqual({
      correct: 0,
      total: 0,
      percentage: 0,
      byDomain: {},
    });
  });

  it("does not count numeric strings as selected answers", () => {
    const result = scoreBrainAssessment(
      [{ id: "q1", domain: "Number patterns", answer: 2 }],
      { q1: "2" as unknown as number },
    );
    expect(result.correct).toBe(0);
    expect(result.byDomain["Number patterns"]).toEqual({ correct: 0, total: 1 });
  });
});
