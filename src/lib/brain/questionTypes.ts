export type BrainDomain = "Visual patterns" | "Logic" | "Number patterns" | "Verbal reasoning" | "Spatial reasoning";
export type BrainDifficulty = "Easy" | "Medium" | "Hard";
export type BrainQuestion = {
  id: string;
  domain: BrainDomain;
  skill: string;
  difficulty: BrainDifficulty;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
};
