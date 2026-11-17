/**
 * Server-side calibration contract for Gemini's science assessment scores.
 * Keep this file out of the browser bundle: it is evaluator guidance, not UI copy.
 */
export const SCIENCE_EVALUATION_CALIBRATION_VERSION = "evaluation-calibration-v1";

export const SCIENCE_BENCHMARK_SCORE_BANDS = {
  excellent: { min: 90, max: 100 },
  conciseButCorrect: { min: 82, max: 96 },
  partiallyCorrect: { min: 40, max: 69 },
  majorMisconception: { min: 0, max: 30 },
  irrelevant: { min: 0, max: 5 },
} as const;

/**
 * These are calibration targets for representative answer archetypes, not
 * deterministic labels. The question-specific rubric always takes priority.
 */
export const SCIENCE_EVALUATION_CALIBRATION_GUIDANCE = [
  "CALIBRATION ANCHORS — apply these consistently to each answer:",
  "- 0–20: no relevant scientific content, or almost entirely incorrect.",
  "- 21–40: a major misconception dominates; only isolated details are correct.",
  "- 41–60: mixed understanding; some relevant facts are correct but the main mechanism or causal link is missing or wrong.",
  "- 61–80: mostly correct core idea with a meaningful gap, missing causal step, or limited misconception.",
  "- 81–95: scientifically accurate and coherent explanation of the central mechanism; minor omissions are acceptable.",
  "- 96–100: exceptionally accurate, well-connected and appropriately complete for the selected difficulty, with no material misconception.",
  "BENCHMARK ARCHETYPES:",
  "- Excellent: a detailed answer that accurately explains the key mechanism and relevant conditions should generally land in 90–100.",
  "- Concise but correct: a short answer that correctly states the central mechanism and causal link should generally land in 82–96. Do not lower accuracy, conceptual understanding or reasoning merely because the answer is short. Completeness may be lower only for genuinely omitted required ideas.",
  "- Partially correct: an answer with a correct starting idea but a missing or incorrect central step should generally land in 40–69, depending on which dimensions are demonstrated.",
  "- Major misconception: an answer built around a scientifically false explanation should generally land in 0–30 even if it is fluent, confident or uses relevant terminology.",
  "- Irrelevant or empty: score zero across all dimensions; do not infer understanding from unrelated text.",
  "SCORING DISCIPLINE:",
  "- Score only what the learner demonstrates; do not infer unstated knowledge.",
  "- Judge each dimension independently. Accuracy measures factual correctness; conceptual understanding measures grasp of the mechanism; reasoning measures valid cause-and-effect links; completeness measures coverage of material ideas; clarity measures intelligibility.",
  "- Do not count keywords, reward length, penalize plain language, or require exact textbook terminology.",
  "- A correct alternative explanation is valid when it is consistent with established science and the supplied question-specific rubric.",
  "- Apply the selected difficulty's expectations. Do not demand advanced terminology or caveats from beginner answers.",
].join("\n");
