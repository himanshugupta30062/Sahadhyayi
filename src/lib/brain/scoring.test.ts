import { describe, expect, it } from "vitest";
import { scoreBrainAssessment } from "./scoring";

const questions = [
  { id: "a", domain: "Logic", answer: 1 },
  { id: "b", domain: "Logic", answer: 0 },
  { id: "c", domain: "Visual", answer: 2 },
];

describe("scoreBrainAssessment", () => {
  it("scores correct, incorrect and unanswered questions by domain", () => {
    expect(scoreBrainAssessment(questions, { a: 1, b: 3 })).toEqual({
      correct: 1, total: 3, percentage: 33,
      byDomain: { Logic: { correct: 1, total: 2 }, Visual: { correct: 0, total: 1 } },
    });
  });
  it("returns a zero percentage for an empty assessment", () => {
    expect(scoreBrainAssessment([], {})).toEqual({ correct: 0, total: 0, percentage: 0, byDomain: {} });
  });
  it("does not count non-integer answers as correct", () => {
    expect(scoreBrainAssessment([questions[0]], { a: 1.5 })).toMatchObject({ correct: 0, percentage: 0 });
  });
});
