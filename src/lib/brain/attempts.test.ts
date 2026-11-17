import { describe, expect, it } from "vitest";
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
