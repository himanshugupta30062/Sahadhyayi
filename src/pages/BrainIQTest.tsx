import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, BrainCircuit, CheckCircle2, Clock3, RotateCcw, Sparkles } from "lucide-react";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { scoreBrainAssessment } from "@/lib/brain/scoring";

type Domain = "Visual patterns" | "Logic" | "Number patterns" | "Verbal reasoning";
type Question = { id: string; domain: Domain; prompt: string; options: string[]; answer: number; explanation: string; visual?: string[]; visualOptions?: string[] };

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
  const questions = attemptQuestions ?? baseQuestions;
  const current = questions[index];
  const score = questions.reduce((sum, question) => sum + (answers[question.id] === question.answer ? 1 : 0), 0);
  const domainScores = useMemo(() => questions.reduce<Record<string, { correct: number; total: number }>>((acc, q) => {
    const item = acc[q.domain] ?? { correct: 0, total: 0 };
    item.total += 1;
    if (answers[q.id] === q.answer) item.correct += 1;
    acc[q.domain] = item;
    return acc;
  }, {}), [questions, answers]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("sahadhyayi-iq-test-history");
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) setAttemptHistory(parsed.filter((item): item is AttemptHistoryEntry => item && typeof item.date === "string" && Number.isFinite(item.score) && Number.isFinite(item.total) && item.total > 0 && typeof item.mode === "string").slice(0, 90));
      }
    } catch { setAttemptHistory([]); }
  }, []);

  useEffect(() => {
    if (!finished || !attemptQuestions) return;
    const entry: AttemptHistoryEntry = { date: new Date().toISOString(), score, total: questions.length, mode: dailyMode ? "Daily" : practiceMode ? `Practice · ${selectedDomain} · ${selectedDifficulty}` : `Test · ${selectedDifficulty}`, domains: domainScores };
    setAttemptHistory((previous) => {
      const next = [entry, ...previous].slice(0, 90);
      try { window.localStorage.setItem("sahadhyayi-iq-test-history", JSON.stringify(next)); } catch { /* storage may be unavailable */ }
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  useEffect(() => {
    if (!started || finished || dailyMode) return;
    const timer = window.setInterval(() => setSeconds((value) => {
      if (value <= 1) { window.clearInterval(timer); setFinished(true); return 0; }
      return value - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [started, finished, dailyMode]);

  const beginAssessment = () => {
    // Daily challenge stays repeatable; other attempts receive a shuffled order.
    setAttemptQuestions(dailyMode ? baseQuestions : createAttempt(baseQuestions));
    setStarted(true);
  };
  const reset = () => { setStarted(false); setFinished(false); setIndex(0); setAnswers({}); setSeconds(TEST_SECONDS); setAttemptQuestions(null); };

  return <main className="min-h-[calc(100vh-4rem)] bg-background text-foreground"><SEO title="IQ Test Practice | Sahadhyayi" description="Practice original logic, visual pattern, number and verbal reasoning questions with explanations." /><div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
    <Link to="/brain" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to IQ Test</Link>
    <div className="mt-5 flex items-center gap-3"><div className="rounded-xl bg-violet-500/10 p-3 text-violet-500"><BrainCircuit className="h-6 w-6" /></div><div><Badge variant="secondary">PRACTICE ASSESSMENT</Badge><h1 className="mt-1 text-2xl font-bold sm:text-3xl">{dailyMode ? "Daily brain challenge" : practiceMode ? "Skill practice" : "Reasoning test"}</h1></div></div>
    {!started && !finished && <Card className="mt-6"><CardHeader><CardTitle>Before you begin</CardTitle><CardDescription>This practice assessment uses original sample questions across visual patterns, logic, number patterns and verbal reasoning.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-muted/50 p-3"><Clock3 className="mb-2 h-4 w-4 text-violet-500"/><p className="font-medium">{dailyMode ? "3 questions" : `${baseQuestions.length} questions`}</p><p className="text-xs text-muted-foreground">{dailyMode ? "Quick challenge" : `${selectedDifficulty} level`}</p></div><div className="rounded-xl bg-muted/50 p-3"><Sparkles className="mb-2 h-4 w-4 text-violet-500"/><p className="font-medium">{dailyMode ? "Untimed" : "20 minutes"}</p><p className="text-xs text-muted-foreground">No penalty for skips</p></div><div className="rounded-xl bg-muted/50 p-3"><CheckCircle2 className="mb-2 h-4 w-4 text-violet-500"/><p className="font-medium">Answer review</p><p className="text-xs text-muted-foreground">Explanations at the end</p></div></div>{practiceMode && <div className="space-y-2"><p className="text-sm font-medium">Focus area</p><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{(["All areas", "Visual patterns", "Logic", "Number patterns", "Verbal reasoning"] as const).map((domain) => <Button key={domain} type="button" variant={selectedDomain === domain ? "default" : "outline"} size="sm" onClick={() => setSelectedDomain(domain)} className="w-full whitespace-normal">{domain}</Button>)}</div><p className="text-xs text-muted-foreground">Choose one reasoning area to practise, or keep all areas selected.</p></div>}{!dailyMode && <div className="space-y-2"><p className="text-sm font-medium">Choose difficulty</p><div className="grid grid-cols-3 gap-2">{(["Easy", "Medium", "Hard"] as const).map((level) => <Button key={level} type="button" variant={selectedDifficulty === level ? "default" : "outline"} onClick={() => setSelectedDifficulty(level)} className="w-full">{level}<span className="ml-1 text-xs opacity-75">({QUESTIONS.filter((question) => DIFFICULTY_BY_ID[question.id] === level).length})</span></Button>)}</div><p className="text-xs text-muted-foreground">{selectedDifficulty === "Easy" ? "Build confidence with direct patterns and foundational reasoning." : selectedDifficulty === "Medium" ? "Mix multi-step patterns, deductions and verbal relationships." : "Try more demanding sequences, deductions and less familiar patterns."}</p></div>}<p className="text-sm leading-6 text-muted-foreground">This is a learning and puzzle experience—not a standardized, professionally normed IQ test. Your score reflects only this question set.</p><Button size="lg" onClick={beginAssessment} className="w-full">Begin assessment <ArrowRight className="ml-2 h-4 w-4"/></Button></CardContent></Card>}
    {started && !finished && current && <Card className="mt-6"><CardHeader><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Badge variant="outline">{current.domain}</Badge>{!dailyMode && <Badge variant="secondary">{selectedDifficulty}</Badge>}</div>{!dailyMode && <span className="inline-flex items-center gap-1.5 text-sm tabular-nums text-muted-foreground"><Clock3 className="h-4 w-4"/>{formatTime(seconds)}</span>}</div><div className="mt-3 flex items-center justify-between text-xs text-muted-foreground"><span>Question progress</span><span>{Object.keys(answers).length} of {questions.length} answered</span></div><Progress value={Object.keys(answers).length / questions.length * 100} className="mt-2"/><CardDescription>Question {index + 1} of {questions.length} · {questions.length - Object.keys(answers).length} unanswered</CardDescription><CardTitle className="pt-2 text-xl leading-7">{current.prompt}</CardTitle></CardHeader><CardContent className="space-y-3">{current.visual && <div aria-label={current.visual.join(" ")} className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-muted/20 p-3 sm:gap-3 sm:p-5">{current.visual.map((tile, tileIndex) => <div key={tileIndex} className="flex aspect-square items-center justify-center rounded-lg border border-border bg-card text-2xl font-semibold sm:text-4xl">{tileIndex === 8 ? "?" : tile}</div>)}</div>}{current.options.map((option, optionIndex) => <button key={option} type="button" onClick={() => setAnswers((prev) => ({ ...prev, [current.id]: optionIndex }))} className={`flex min-h-14 w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors ${answers[current.id] === optionIndex ? "border-violet-500 bg-violet-500/10 ring-1 ring-violet-500" : "border-border hover:bg-muted/60"}`}><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold">{String.fromCharCode(65 + optionIndex)}</span><span>{option}</span></button>)}<div className="rounded-xl border border-border p-3"><div className="mb-2 flex items-center justify-between gap-2"><p className="text-sm font-medium">Question navigator</p><p className="text-xs text-muted-foreground">{Object.keys(answers).length}/{questions.length} answered</p></div><div className="grid grid-cols-5 gap-2 sm:grid-cols-8">{questions.map((question, questionIndex) => { const answered = answers[question.id] !== undefined; const active = questionIndex === index; return <button key={question.id} type="button" onClick={() => setIndex(questionIndex)} aria-label={`Go to question ${questionIndex + 1}${answered ? ", answered" : ", unanswered"}${active ? ", current question" : ""}`} aria-current={active ? "step" : undefined} className={`flex h-9 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${active ? "border-violet-500 bg-violet-500 text-white" : answered ? "border-emerald-500/40 bg-emerald-500/10 text-foreground" : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"}`}>{questionIndex + 1}</button>; })}</div><div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground"><span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-violet-500"/>Current</span><span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500"/>Answered</span><span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-muted-foreground"/>Unanswered</span></div></div><div className="flex flex-wrap justify-between gap-3 pt-3"><Button variant="outline" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}><ArrowLeft className="mr-2 h-4 w-4"/>Previous</Button><Button onClick={() => index === questions.length - 1 ? setFinished(true) : setIndex((i) => i + 1)}>{index === questions.length - 1 ? "Finish test" : "Next question"}<ArrowRight className="ml-2 h-4 w-4"/></Button></div><Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => setFinished(true)}>End assessment early</Button></CardContent></Card>}
    {finished && <Card className="mt-6"><CardHeader className="text-center"><div className="mx-auto rounded-full bg-emerald-500/10 p-4 text-emerald-600"><CheckCircle2 className="h-9 w-9"/></div><CardTitle className="text-2xl">Your practice results</CardTitle><CardDescription>Here is how you did on this question set.</CardDescription></CardHeader><CardContent><div className="rounded-2xl bg-muted/50 p-6 text-center"><p className="text-sm text-muted-foreground">Correct answers</p><p className="mt-1 text-4xl font-bold tabular-nums">{score}<span className="text-xl text-muted-foreground"> / {questions.length}</span></p><Progress value={score / questions.length * 100} className="mt-4"/></div>{attemptHistory.length > 0 && <div className="mt-5 space-y-5 rounded-xl border border-border p-4"><div><h3 className="font-semibold">Progress over time</h3><p className="mt-1 text-xs text-muted-foreground">Your latest {Math.min(attemptHistory.length, 8)} saved attempts · stored privately on this device</p><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3"><div className="rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Average</p><p className="mt-1 text-xl font-semibold tabular-nums">{Math.round(attemptHistory.slice(0, 8).reduce((sum, item) => sum + item.score / item.total, 0) / Math.min(attemptHistory.length, 8) * 100)}%</p></div><div className="rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Best attempt</p><p className="mt-1 text-xl font-semibold tabular-nums">{Math.round(Math.max(...attemptHistory.slice(0, 8).map((item) => item.score / item.total)) * 100)}%</p></div><div className="col-span-2 rounded-lg bg-muted/50 p-3 sm:col-span-1"><p className="text-xs text-muted-foreground">Attempts saved</p><p className="mt-1 text-xl font-semibold tabular-nums">{attemptHistory.length}</p></div></div><div className="mt-4 flex h-32 items-end gap-2" role="img" aria-label="Score percentage trend across recent attempts, newest first">{[...attemptHistory].slice(0, 8).reverse().map((attempt, attemptIndex) => { const percentage = Math.round(attempt.score / attempt.total * 100); return <div key={attempt.date + attemptIndex} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"><span className="text-[10px] tabular-nums text-muted-foreground">{percentage}%</span><div className="w-full max-w-10 rounded-t-md bg-violet-500/80" style={{ height: `${Math.max(percentage, 4)}%` }} /><span className="text-[10px] text-muted-foreground">{new Date(attempt.date).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span></div>; })}</div><p className="text-[11px] text-muted-foreground">Bars are shown oldest to newest. Percentages compare only the questions in each attempt.</p></div><div><h3 className="font-semibold">Reasoning area progress</h3><p className="mt-1 text-xs text-muted-foreground">Combined accuracy from saved attempts that include area-level results.</p><div className="mt-3 space-y-3">{Object.entries(attemptHistory.slice(0, 8).reduce<Record<string, { correct: number; total: number }>>((totals, attempt) => { Object.entries(attempt.domains ?? {}).forEach(([domain, result]) => { const current = totals[domain] ?? { correct: 0, total: 0 }; current.correct += result.correct; current.total += result.total; totals[domain] = current; }); return totals; }, {})).map(([domain, result]) => <div key={domain}><div className="mb-1 flex items-center justify-between gap-3 text-sm"><span>{domain}</span><span className="tabular-nums text-muted-foreground">{result.correct}/{result.total} · {Math.round(result.correct / result.total * 100)}%</span></div><Progress value={result.total ? result.correct / result.total * 100 : 0} /></div>)}</div></div></div>}{attemptHistory.length > 1 && <div className="mt-5 rounded-xl border border-border p-4"><h3 className="font-semibold">Recent attempts</h3><p className="mt-1 text-xs text-muted-foreground">Saved privately on this device · latest 90 attempts</p><div className="mt-3 space-y-2">{attemptHistory.slice(1, 6).map((attempt, attemptIndex) => <div key={attempt.date + attemptIndex} className="flex items-center justify-between gap-3 text-sm"><span className="text-muted-foreground">{new Date(attempt.date).toLocaleDateString()} · {attempt.mode}</span><Badge variant="secondary">{attempt.score}/{attempt.total} · {Math.round(attempt.score / attempt.total * 100)}%</Badge></div>)}</div></div>}<div className="mt-5 space-y-3"><h3 className="font-semibold">By reasoning area</h3>{Object.entries(domainScores).map(([domain, value])=><div key={domain} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"><span>{domain}</span><Badge variant="secondary">{value.correct}/{value.total} · {Math.round(value.correct / value.total * 100)}%</Badge></div>)}</div><div className="mt-6 space-y-4"><h3 className="font-semibold">Answer explanations</h3>{questions.map((q,i)=><div key={q.id} className="rounded-xl border border-border p-4"><div className="flex items-start justify-between gap-3"><p className="font-medium">{i+1}. {q.prompt}</p><Badge variant={answers[q.id]===q.answer?"default":"destructive"}>{answers[q.id]===q.answer?"Correct":"Review"}</Badge></div><p className="mt-2 text-sm text-muted-foreground">{q.explanation}</p><p className="mt-2 text-sm"><span className="text-muted-foreground">Your answer: </span>{answers[q.id] === undefined ? <span className="font-medium">Skipped</span> : <span className="font-medium">{q.options[answers[q.id]]}</span>}</p><p className="mt-1 text-sm"><span className="text-muted-foreground">Correct answer: </span><span className="font-medium">{q.options[q.answer]}</span></p></div>)}</div><p className="mt-5 text-xs leading-5 text-muted-foreground">This is not a certified IQ score, percentile or clinical assessment. No population norm has been applied.</p><div className="mt-6 flex flex-col gap-3 sm:flex-row"><Button onClick={reset} className="flex-1"><RotateCcw className="mr-2 h-4 w-4"/>Try again</Button><Button asChild variant="outline" className="flex-1"><Link to="/brain">Back to IQ Test</Link></Button></div></CardContent></Card>}
  </div></main>;
}
