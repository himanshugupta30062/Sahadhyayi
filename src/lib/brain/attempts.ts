import { supabase } from "@/integrations/supabase/client-universal";
import type { Json } from "@/integrations/supabase/types";

export type BrainDomainScore = { correct: number; total: number };
export type BrainAssessmentMode = "general" | "practice" | "daily" | "visual" | "classical" | "cognitive";

export type BrainAssessmentAttemptInput = {
  mode: BrainAssessmentMode;
  difficulty: "Easy" | "Medium" | "Hard" | null;
  questionCount: number;
  correctCount: number;
  durationSeconds: number;
  domainScores: Record<string, BrainDomainScore>;
  questionSetVersion?: string;
  completedAt?: string;
};

export type BrainAssessmentAttemptRow = {
  id: string;
  user_id: string;
  mode: BrainAssessmentMode;
  difficulty: string | null;
  question_count: number;
  correct_count: number;
  duration_seconds: number;
  domain_scores: Record<string, BrainDomainScore>;
  question_set_version: string;
  completed_at: string;
};

export type BrainAttemptHistoryEntry = {
  date: string;
  score: number;
  total: number;
  mode: string;
  domains: Record<string, BrainDomainScore>;
  durationSeconds: number;
};

function validateAttempt(input: BrainAssessmentAttemptInput) {
  if (!Number.isInteger(input.questionCount) || input.questionCount < 1 || input.questionCount > 200) {
    throw new Error("Assessment question count is invalid.");
  }
  if (!Number.isInteger(input.correctCount) || input.correctCount < 0 || input.correctCount > input.questionCount) {
    throw new Error("Assessment score is invalid.");
  }
  if (!Number.isInteger(input.durationSeconds) || input.durationSeconds < 0 || input.durationSeconds > 14400) {
    throw new Error("Assessment duration is invalid.");
  }
  for (const score of Object.values(input.domainScores)) {
    if (!Number.isInteger(score.correct) || !Number.isInteger(score.total) || score.total < 0 || score.correct < 0 || score.correct > score.total) {
      throw new Error("Assessment domain scores are invalid.");
    }
  }
}

export function toBrainAttemptHistory(row: BrainAssessmentAttemptRow): BrainAttemptHistoryEntry {
  return {
    date: row.completed_at,
    score: row.correct_count,
    total: row.question_count,
    mode: row.mode === "practice" ? "Practice" : row.mode === "daily" ? "Daily" : row.mode === "general" ? "Test" : row.mode,
    domains: row.domain_scores ?? {},
    durationSeconds: row.duration_seconds,
  };
}

export async function listBrainAssessmentAttempts(limit = 50): Promise<BrainAttemptHistoryEntry[] | null> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) return null;

  const { data, error } = await supabase
    .from("brain_assessment_attempts")
    .select("*")
    .eq("user_id", authData.user.id)
    .order("completed_at", { ascending: false })
    .limit(Math.min(Math.max(Math.floor(limit), 1), 100));

  if (error) throw error;
  return (data ?? []).map((row) => toBrainAttemptHistory(row as BrainAssessmentAttemptRow));
}

export async function saveBrainAssessmentAttempt(input: BrainAssessmentAttemptInput): Promise<BrainAssessmentAttemptHistoryEntry | null> {
  validateAttempt(input);
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) return null;

  const { data, error } = await supabase
    .from("brain_assessment_attempts")
    .insert({
      user_id: authData.user.id,
      mode: input.mode,
      difficulty: input.difficulty,
      question_count: input.questionCount,
      correct_count: input.correctCount,
      duration_seconds: input.durationSeconds,
      domain_scores: input.domainScores as unknown as Json,
      question_set_version: input.questionSetVersion ?? "v1",
      completed_at: input.completedAt ?? new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) throw error;
  return toBrainAttemptHistory(data as BrainAssessmentAttemptRow);
}
