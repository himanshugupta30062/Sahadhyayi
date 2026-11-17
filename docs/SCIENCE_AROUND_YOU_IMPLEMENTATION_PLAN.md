# Explain Science Around You — implementation plan

## Product boundary

**Explain Science Around You is a standalone Sahadhyayi learning assessment.** It is separate from Brain Lab and the IQ Test. It has its own route, question bank, evaluator, scoring rubric, history table, and progress model. It must not change IQ questions, IQ scoring, IQ history, or the existing `brain_assessment_attempts` table.

It measures demonstrated explanations of everyday science. It is not an IQ test, a certified examination, or a validated measure of intelligence.

## MVP being implemented in this branch

1. A dedicated `/science-around-you` experience and separate navigation entry.
2. Ten open-ended questions about fans, air conditioners, bus braking, pressure cookers, refrigerators, airplane lift, microwaves, condensation, rust, and seasons.
3. One question at a time, free-text answers, progress, question navigation, answer-length limits, and skipped-question handling.
4. Gemini evaluation through a Supabase Edge Function. The browser sends answers and question IDs only; canonical answers and key concepts remain in the server-only shared question bank.
5. A weighted score per answer:
   - Scientific accuracy: 35%
   - Conceptual understanding: 25%
   - Reasoning: 20%
   - Completeness: 15%
   - Clarity: 5%
6. A report with an overall Everyday Science Understanding Score, category averages, strengths, improvement tips, misconception correction, and a concise scientific explanation for each question.
7. Learning links: related scientists/inventors, book discovery via Google Books search, YouTube topic searches, and Sahadhyayi Library entry point.
8. Private signed-in attempt history in a new `everyday_science_attempts` table with owner-scoped RLS. Guest users can take the assessment but do not get cloud history.
9. Unit tests for the question bank and scoring functions.

## Architecture

- Frontend: React + TypeScript, lazy route loading, Sahadhyayi UI components.
- Question metadata: `src/lib/science/questionBank.ts` (no reference answers).
- Scoring utilities: `src/lib/science/scoring.ts`.
- Attempt persistence: `src/lib/science/attempts.ts`.
- Canonical answers and key concepts: `supabase/functions/_shared/scienceQuestionBank.ts`.
- Gemini endpoint: `supabase/functions/everyday-science-evaluate/index.ts`, using the existing server-side `GEMINI_API_KEY` secret.
- Persistence: `public.everyday_science_attempts`, separate from all IQ tables.

## Evaluation and safety requirements

- Evaluate scientific meaning, not keyword overlap or textbook phrasing.
- Score dimensions independently and calculate the weighted score in trusted server code.
- Treat user answer text as untrusted data and explicitly ignore instructions embedded in answers.
- Validate exact question IDs, unique submissions, payload size, answer length, model JSON shape, finite score values, and score boundaries.
- Keep API secrets and answer keys out of the browser bundle.
- Do not invent direct video URLs. Use a targeted YouTube search link and clearly label it as a search.
- Present the percentage as performance on this question set only; never describe it as IQ or a population percentile.
- Use RLS for private history; do not expose one user's answers or evaluation to another user.

## Rollout plan

### Phase 1 — MVP (this branch)
- Implement the independent page and navigation.
- Add the server-only reference bank and Gemini evaluator.
- Add the separate attempt table, generated types, and persistence helper.
- Add scoring/question-bank unit tests and run repository checks.
- Review deployment configuration before enabling the feature in production.

### Phase 2 — Quality and personalisation
- Expand the bank with reviewed questions in physics, biology, chemistry, engineering, environment, and technology.
- Add Beginner, Intermediate, and Advanced packs with calibrated expected concepts.
- Retrieve actually available Sahadhyayi books by title/subject and prefer verified editions with accessible reading links.
- Add age-appropriate wording and accessibility/language options without changing what the score measures.
- Build progress charts showing improvement by domain across attempts.

### Phase 3 — Learning ecosystem
- Add short diagrams or interactive explainers for selected topics.
- Add curated, quality-checked video and reference collections rather than unreviewed generated links.
- Add an admin workflow to author, review, version, and retire questions and answer rubrics.
- Replace best-effort in-memory invocation throttling with a shared, persistent rate limiter and monitor model cost/latency.
- Add optional shareable completion cards that disclose no private written answers.

## Release gates

- Verify frontend build, lint, unit tests, and route rendering.
- Verify the migration on a non-production Supabase environment before production rollout.
- Deploy the Edge Function and confirm `GEMINI_API_KEY` is configured in Supabase function secrets.
- Run an authenticated and anonymous end-to-end test; verify RLS prevents cross-user history access.
- Compare Gemini evaluations against a reviewed set of strong, partial, incorrect, and adversarial answers before treating scores as reliable.
