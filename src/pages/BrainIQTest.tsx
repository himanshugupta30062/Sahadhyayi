import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, BrainCircuit, CheckCircle2, Clock3, RotateCcw, Sparkles } from "lucide-react";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { scoreBrainAssessment } from "@/lib/brain/scoring";
import { generateMatrixPuzzle, type MatrixDifficulty, type MatrixPuzzle } from "@/lib/brain/matrixGenerator";
import MatrixTile from "@/components/brain/MatrixTile";

type Domain = "Visual patterns" | "Logic" | "Number patterns" | "Verbal reasoning";
type Question = { id: string; domain: Domain; prompt: string; options: string[]; answer: number; explanation: string; visual?: string[]; visualOptions?: string[]; matrixPuzzle?: MatrixPuzzle };

const QUESTIONS: Question[] = [
  { id: "m1", domain: "Visual patterns", prompt: "Which symbol completes the sequence?", visual: ["○", "△", "□", "△", "□", "◇", "□", "◇", "?"], options: ["○", "△", "□", "◇"], answer: 3, explanation: "Each row shifts the sequence forward; the final symbol is a diamond." },
  { id: "m2", domain: "Visual patterns", prompt: "Choose the missing tile. Each row adds one dot.", visual: ["•", "••", "•••", "••", "•••", "••••", "•••", "••••", "?"], options: ["••", "•••", "••••", "•••••"], answer: 3, explanation: "The number of dots increases by one across each row." },
  { id: "m3", domain: "Visual patterns", prompt: "What comes next in the rotation?", visual: ["↑", "→", "↓", "→", "↓", "←", "↓", "←", "?"], options: ["↑", "→", "↓", "←"], answer: 3, explanation: "The direction turns clockwise one step at a time; the final direction is left." },
  { id: "m4", domain: "Visual patterns", prompt: "Find the missing shape in this pattern.", visual: ["●", "○", "●", "○", "●", "○", "●", "○", "?"], options: ["●", "○", "▲", "□"], answer: 0, explanation: "Filled and empty circles alternate; the next is a filled circle." },

  { id: "n1", domain: "Number patterns", prompt: "What number comes next? 2, 6, 12, 20, 30, …", options: ["36", "40", "42", "44"], answer: 2, explanation: "The differences are +4, +6, +8, +10; next is +12, giving 42." },
  { id: "n2", domain: "Number patterns", prompt: "Complete the sequence: 81, 27, 9, 3, …", options: ["0", "1", "2", "6"], answer: 1, explanation: "Each term is divided by 3." },
  { id: "n3", domain: "Number patterns", prompt: "Find the missing number: 5, 11, 23, 47, __", options: ["89", "93", "95", "97"], answer: 2, explanation: "Multiply by 2 and add 1 each time." },
  { id: "l1", domain: "Logic", prompt: "All glims are norks. No nork is a vep. Which statement must be true?", options: ["Some glims are veps", "No glim is a vep", "All veps are glims", "Some norks are glims"], answer: 1, explanation: "If every glim is a nork and no nork is a vep, a glim cannot be a vep." },
  { id: "l2", domain: "Logic", prompt: "A is taller than B. B is taller than C. D is taller than A. Who is shortest?", options: ["A", "B", "C", "D"], answer: 2, explanation: "The order is D > A > B > C." },
  { id: "l3", domain: "Logic", prompt: "If today is not Monday, the library is open. The library is closed. What follows?", options: ["Today is Monday", "Today is Sunday", "The library is open tomorrow", "Nothing can be concluded"], answer: 0, explanation: "The contrapositive is: if the library is closed, today must be Monday." },
  { id: "v1", domain: "Verbal reasoning", prompt: "Book is to reading as fork is to …", options: ["Drawing", "Eating", "Writing", "Cutting"], answer: 1, explanation: "A book is a tool used for reading; a fork is a tool used for eating." },
  { id: "v2", domain: "Verbal reasoning", prompt: "Choose the word that does not belong.", options: ["Triangle", "Square", "Circle", "Cube"], answer: 3, explanation: "Cube is a three-dimensional solid; the others are two-dimensional shapes." },
  { id: "v3", domain: "Verbal reasoning", prompt: "Transparent is to opaque as scarce is to …", options: ["Rare", "Limited", "Abundant", "Precious"], answer: 2, explanation: "Opaque is the opposite of transparent; abundant is the opposite of scarce." },
  { id: "n4", domain: "Number patterns", prompt: "What comes next? 1, 1, 2, 3, 5, 8, …", options: ["11", "12", "13", "15"], answer: 2, explanation: "Each term is the sum of the two preceding terms (Fibonacci pattern)." },
  { id: "n5", domain: "Number patterns", prompt: "What comes next? 4, 9, 16, 25, …", options: ["30", "32", "36", "49"], answer: 2, explanation: "These are consecutive squares: 2², 3², 4², 5²; next is 6² = 36." },
  { id: "n6", domain: "Number patterns", prompt: "Complete the sequence: 3, 8, 15, 24, 35, …", options: ["42", "46", "48", "50"], answer: 2, explanation: "The differences are +5, +7, +9, +11; next is +13, giving 48." },
  { id: "l4", domain: "Logic", prompt: "Mira is older than Dev. Dev is older than Asha. Which statement is certainly true?", options: ["Asha is older than Mira", "Mira is older than Asha", "Dev is oldest", "Asha and Mira are the same age"], answer: 1, explanation: "The order is Mira > Dev > Asha, so Mira is older than Asha." },
  { id: "l5", domain: "Logic", prompt: "Every red card is numbered. This card is red. What must be true?", options: ["It is numbered", "It is blue", "It is unnumbered", "No conclusion follows"], answer: 0, explanation: "The rule applies to every red card, including this one." },
  { id: "v4", domain: "Verbal reasoning", prompt: "Seed is to plant as egg is to …", options: ["Nest", "Bird", "Shell", "Feather"], answer: 1, explanation: "A seed can grow into a plant; an egg can develop into a bird." },
  { id: "v5", domain: "Verbal reasoning", prompt: "Choose the closest meaning of 'concise'.", options: ["Brief", "Confusing", "Detailed", "Uncertain"], answer: 0, explanation: "Concise means expressing something clearly in few words." },
  { id: "m5", domain: "Visual patterns", prompt: "Which symbol comes next? ★, ☆, ★, ☆, ★, …", options: ["★", "☆", "○", "△"], answer: 1, explanation: "Filled and outline stars alternate; the next is an outline star." },
  { id: "m6", domain: "Visual patterns", prompt: "Complete the sequence: ↗, ↘, ↙, ↖, …", options: ["↗", "↘", "↙", "↖"], answer: 0, explanation: "The arrow rotates 90° clockwise each step, returning to ↗." },
];


type Difficulty = "Easy" | "Medium" | "Hard";
type PracticeDomain = "All areas" | Domain;
type AttemptHistoryEntry = { date: string; score: number; total: number; mode: string; domains?: Record<string, { correct: number; total: number }> };
const DIFFICULTY_BY_ID: Record<string, Difficulty> = {
  m1: "Easy", m2: "Easy", m4: "Easy", n2: "Easy", l2: "Easy", v1: "Easy", v2: "Easy",
  m3: "Medium", n1: "Medium", n4: "Medium", n6: "Medium", l1: "Medium", l4: "Medium", v3: "Medium", v4: "Medium",
  n3: "Hard", n5: "Hard", l3: "Hard", l5: "Hard", v5: "Hard", m5: "Hard", m6: "Hard",
};

const TEST_SECONDS = 20 * 60;

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function createAttempt(source: Question[]): Question[] {
  return shuffle(source).map((question) => {
    const options = shuffle(question.options.map((label, originalIndex) => ({ label, originalIndex })));
    return { ...question, options: options.map((option) => option.label), answer: options.findIndex((option) => option.originalIndex === question.answer) };
  });
}
const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
const localDayKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export default function BrainIQTest() {
  const [searchParams] = useSearchParams();
  const practiceMode = searchParams.get("mode") === "practice";
  const dailyMode = searchParams.get("mode") === "daily";
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [seconds, setSeconds] = useState(TEST_SECONDS);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("Medium");
  const [selectedDomain, setSelectedDomain] = useState<PracticeDomain>("All areas");
  const [attemptHistory, setAttemptHistory] = useState<AttemptHistoryEntry[]>([]);
  const baseQuestions = useMemo(() => dailyMode ? [QUESTIONS[0], QUESTIONS[4], QUESTIONS[8]] : QUESTIONS.filter((question) => DIFFICULTY_BY_ID[question.id] === selectedDifficulty && (!practiceMode || selectedDomain === "All areas" || question.domain === selectedDomain)), [dailyMode, practiceMode, selectedDifficulty, selectedDomain]);
  const [attemptQuestions, setAttemptQuestions] = useState<Question[] | null>(null);
  const plannedMatrixCount = !dailyMode && (!practiceMode || selectedDomain === "All areas" || selectedDomain === "Visual patterns") ? 3 : 0;\n  const questions = attemptQuestions ?? baseQuestions;
  const current = questions[index];
  const assessmentScore = useMemo(() => scoreBrainAssessment(questions, answers), [questions, answers]);
  const score = assessmentScore.correct;
  const domainScores = assessmentScore.byDomain;
