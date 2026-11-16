export type BrainQuestionKey = { id: string; domain: string; answer: number };
export type BrainAnswers = Record<string, number>;

export function scoreBrainAssessment(questions: BrainQuestionKey[], answers: BrainAnswers) {
  const byDomain: Record<string, { correct: number; total: number }> = {};
  let correct = 0;
  for (const question of questions) {
    const result = byDomain[question.domain] ?? { correct: 0, total: 0 };
    result.total += 1;
    if (Number.isInteger(answers[question.id]) && answers[question.id] === question.answer) {
      result.correct += 1;
      correct += 1;
    }
    byDomain[question.domain] = result;
  }
  return { correct, total: questions.length, percentage: questions.length ? Math.round((correct / questions.length) * 100) : 0, byDomain };
}
