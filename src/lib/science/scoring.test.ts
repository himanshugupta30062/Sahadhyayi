import { describe, expect, it } from "vitest";
import {
  calculateScienceAnswerScore,
  calculateScienceOverallScore,
  clampScienceDimension,
  SCIENCE_SCORE_WEIGHTS,
} from "./scoring";

describe("everyday science scoring", () => {
  it("uses a weighted rubric that totals 100%", () => {
    expect(
      Object.values(SCIENCE_SCORE_WEIGHTS).reduce((total, weight) => total + weight, 0),
    ).toBeCloseTo(1);
  });

  it("clamps model dimensions to the 0–100 range and rejects non-finite values", () => {
    expect(clampScienceDimension(-5)).toBe(0);
    expect(clampScienceDimension(135)).toBe(100);
    expect(clampScienceDimension(72.4)).toBe(72);
    expect(clampScienceDimension(Number.NaN)).toBe(0);
    expect(clampScienceDimension("90")).toBe(0);
  });

  it("calculates a perfect and a zero answer score deterministically", () => {
    const perfect = {
      accuracy: 100,
      conceptualUnderstanding: 100,
      reasoning: 100,
      completeness: 100,
      clarity: 100,
    };
    const empty = {
      accuracy: 0,
      conceptualUnderstanding: 0,
      reasoning: 0,
      completeness: 0,
      clarity: 0,
    };
    expect(calculateScienceAnswerScore(perfect)).toBe(100);
    expect(calculateScienceAnswerScore(empty)).toBe(0);
  });

  it("applies the published answer weights", () => {
    expect(calculateScienceAnswerScore({
      accuracy: 100,
      conceptualUnderstanding: 80,
      reasoning: 60,
      completeness: 40,
      clarity: 20,
    })).toBe(74);
  });

  it("averages per-question scores without allowing out-of-range scores", () => {
    expect(calculateScienceOverallScore([100, 80, 60])).toBe(80);
    expect(calculateScienceOverallScore([120, -20])).toBe(50);
    expect(calculateScienceOverallScore([])).toBe(0);
  });
});
