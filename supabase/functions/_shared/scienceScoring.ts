export type ScienceScoreDimensions = {
  accuracy: number;
  conceptualUnderstanding: number;
  reasoning: number;
  completeness: number;
  clarity: number;
};

export const SCIENCE_SCORE_WEIGHTS = {
  accuracy: 0.35,
  conceptualUnderstanding: 0.25,
  reasoning: 0.2,
  completeness: 0.15,
  clarity: 0.05,
} as const;

export function clampScienceDimension(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.round(Math.min(100, Math.max(0, value)));
}

export function calculateScienceAnswerScore(dimensions: ScienceScoreDimensions): number {
  return Math.round(
    clampScienceDimension(dimensions.accuracy) * SCIENCE_SCORE_WEIGHTS.accuracy +
    clampScienceDimension(dimensions.conceptualUnderstanding) * SCIENCE_SCORE_WEIGHTS.conceptualUnderstanding +
    clampScienceDimension(dimensions.reasoning) * SCIENCE_SCORE_WEIGHTS.reasoning +
    clampScienceDimension(dimensions.completeness) * SCIENCE_SCORE_WEIGHTS.completeness +
    clampScienceDimension(dimensions.clarity) * SCIENCE_SCORE_WEIGHTS.clarity,
  );
}

export function calculateScienceOverallScore(scores: number[]): number {
  if (scores.length === 0) return 0;
  const safeScores = scores.map(clampScienceDimension);
  return Math.round(safeScores.reduce((sum, score) => sum + score, 0) / safeScores.length);
}
