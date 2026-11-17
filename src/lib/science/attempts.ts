import { supabase } from "@/integrations/supabase/client-universal";
import type { Json } from "@/integrations/supabase/types";

export type ScienceDimensionScores = {
  accuracy: number;
  conceptualUnderstanding: number;
  reasoning: number;
  completeness: number;
  clarity: number;
};

export type ScienceQuestionEvaluation = {
  questionId: string;
  score: number;
  dimensions: ScienceDimensionScores;
  strengths: string[];
  improvements: string[];
  feedback: string;
  misconceptionCorrection: string | null;
  correctExplanation: string;
};

export type ScienceAssessmentEvaluation = {
  questionSetVersion: string;
  overallScore: number;
  categoryScores: Record<string, number>;
  results: ScienceQuestionEvaluation[];
};

export type ScienceAttemptHistory = {
  id: string;
  overall_score: number;
  question_count: number;
  category_scores: Record<string, number>;
  created_at: string;
};

export async function saveEverydayScienceAttempt(
  answers: Array<{ questionId: string; answer: string }>,
  evaluation: ScienceAssessmentEvaluation,
): Promise<boolean> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) return false;

  const { error } = await supabase.from("everyday_science_attempts").insert({
    user_id: authData.user.id,
    question_count: answers.length,
    overall_score: evaluation.overallScore,
    category_scores: evaluation.categoryScores as unknown as Json,
    answers: answers as unknown as Json,
    evaluation: evaluation as unknown as Json,
    question_set_version: evaluation.questionSetVersion,
  });

  if (error) throw error;
  return true;
}

export async function listEverydayScienceAttempts(limit = 5): Promise<ScienceAttemptHistory[] | null> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) return null;

  const { data, error } = await supabase
    .from("everyday_science_attempts")
    .select("id,overall_score,question_count,category_scores,created_at")
    .eq("user_id", authData.user.id)
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(Math.floor(limit), 1), 20));

  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...row,
    category_scores: (row.category_scores ?? {}) as Record<string, number>,
  }));
}
