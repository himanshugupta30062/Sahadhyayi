import { describe, expect, it } from "vitest";
import {
  SCIENCE_BENCHMARK_SCORE_BANDS,
  SCIENCE_EVALUATION_CALIBRATION_GUIDANCE,
  SCIENCE_EVALUATION_CALIBRATION_VERSION,
} from "../../../supabase/functions/_shared/scienceEvaluationGuidance";

describe("everyday science evaluation calibration", () => {
  it("defines ordered target bands for the five benchmark answer archetypes", () => {
    const bands = Object.values(SCIENCE_BENCHMARK_SCORE_BANDS);
    expect(bands).toHaveLength(5);
    for (const band of bands) {
      expect(band.min).toBeGreaterThanOrEqual(0);
      expect(band.max).toBeLessThanOrEqual(100);
      expect(band.min).toBeLessThanOrEqual(band.max);
    }
    expect(SCIENCE_BENCHMARK_SCORE_BANDS.irrelevant.max).toBeLessThan(
      SCIENCE_BENCHMARK_SCORE_BANDS.majorMisconception.max,
    );
    expect(SCIENCE_BENCHMARK_SCORE_BANDS.partiallyCorrect.max).toBeLessThan(
      SCIENCE_BENCHMARK_SCORE_BANDS.conciseButCorrect.min,
    );
    expect(SCIENCE_BENCHMARK_SCORE_BANDS.conciseButCorrect.min).toBeLessThan(
      SCIENCE_BENCHMARK_SCORE_BANDS.excellent.min,
    );
  });

  it("explicitly protects concise, scientifically correct answers from verbosity bias", () => {
    expect(SCIENCE_EVALUATION_CALIBRATION_GUIDANCE).toContain(
      "Do not lower accuracy, conceptual understanding or reasoning merely because the answer is short.",
    );
    expect(SCIENCE_EVALUATION_CALIBRATION_GUIDANCE).toContain(
      "Do not count keywords, reward length",
    );
  });

  it("distinguishes partial understanding, misconceptions and irrelevant answers", () => {
    for (const archetype of [
      "Excellent:",
      "Concise but correct:",
      "Partially correct:",
      "Major misconception:",
      "Irrelevant or empty:",
    ]) {
      expect(SCIENCE_EVALUATION_CALIBRATION_GUIDANCE).toContain(archetype);
    }
  });

  it("versions evaluation calibration independently from the question bank", () => {
    expect(SCIENCE_EVALUATION_CALIBRATION_VERSION).toBe("evaluation-calibration-v1");
  });
});
