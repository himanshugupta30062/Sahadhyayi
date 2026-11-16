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
];

function shuffleAssessment(source: Question[]): Question[] {
  // Shuffle both question order and answer positions while preserving the correct key.
  const shuffled = [...source].sort(() => Math.random() - 0.5);
  return shuffled.map((question) => {
    const optionOrder = question.options.map((_, i) => i).sort(() => Math.random() - 0.5);
    return { ...question, options: optionOrder.map((i) => question.options[i]), answer: optionOrder.indexOf(question.answer) };
  });
}

const TEST_SECONDS = 20 * 60;
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
  const [selectedDomain, setSelectedDomain] = useState<Domain | "All">("All");\n  const [sessionQuestions, setSessionQuestions] = useState<Question[] | null>(null);
  const domains: Array<Domain | "All"> = ["All", "Visual patterns", "Logic", "Number patterns", "Verbal reasoning"];
  const questions = useMemo(() => dailyMode ? [QUESTIONS[0], QUESTIONS[4], QUESTIONS[8]] : practiceMode && selectedDomain !== "All" ? QUESTIONS.filter((question) => question.domain === selectedDomain) : QUESTIONS, [dailyMode, practiceMode, selectedDomain]);
  const activeQuestions = sessionQuestions ?? questions;
  const current = activeQuestions[index];
  const assessment = useMemo(() => scoreBrainAssessment(activeQuestions, answers), [activeQuestions, answers]);
  const score = assessment.correct;
  const domainScores = assessment.byDomain;

  useEffect(() => {
    if (!started || finished || dailyMode) return;
    const timer = window.setInterval(() => setSeconds((value) => {
      if (value <= 1) { window.clearInterval(timer); setFinished(true); return 0; }
      return value - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [started, finished, dailyMode]);

  const beginAssessment = () => { setSessionQuestions(dailyMode ? questions : shuffleAssessment(questions)); setIndex(0); setAnswers({}); setSeconds(TEST_SECONDS); setStarted(true); };\n  const reset = () => { setStarted(false); setFinished(false); setIndex(0); setAnswers({}); setSeconds(TEST_SECONDS); setSessionQuestions(null); };

  return <main className="min-h-[calc(100vh-4rem)] bg-background text-foreground"><SEO title="IQ-style Reasoning Test | Sahadhyayi Brain Lab" description="Try an original reasoning practice test in Sahadhyayi Brain Lab." /><div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
    <Link to="/brain" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to Brain Lab</Link>
    <div className="mt-5 flex items-center gap-3"><div className="rounded-xl bg-violet-500/10 p-3 text-violet-500"><BrainCircuit className="h-6 w-6" /></div><div><Badge variant="secondary">PRACTICE ASSESSMENT</Badge><h1 className="mt-1 text-2xl font-bold sm:text-3xl">{dailyMode ? "Daily brain challenge" : practiceMode ? "Skill practice" : "Reasoning test"}</h1></div></div>
    {!started && !finished && <Card className="mt-6"><CardHeader><CardTitle>Before you begin</CardTitle><CardDescription>This starter assessment uses original sample questions across logic, number patterns and verbal reasoning.</CardDescription></CardHeader><CardContent className="space-y-4">{practiceMode && <div><p className="mb-2 text-sm font-medium">Choose a skill</p><div className="flex flex-wrap gap-2">{domains.map((domain) => <Button key={domain} size="sm" variant={selectedDomain === domain ? "default" : "outline"} onClick={() => setSelectedDomain(domain)}>{domain}</Button>)}</div></div>}<div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-muted/50 p-3"><Clock3 className="mb-2 h-4 w-4 text-violet-500"/><p className="font-medium">{dailyMode ? "3 questions" : `${activeQuestions.length} questions`}</p><p className="text-xs text-muted-foreground">{dailyMode ? "Quick challenge" : practiceMode && selectedDomain !== "All" ? selectedDomain : "All skills"}</p></div><div className="rounded-xl bg-muted/50 p-3"><Sparkles className="mb-2 h-4 w-4 text-violet-500"/><p className="font-medium">{dailyMode ? "Untimed" : "20 minutes"}</p><p className="text-xs text-muted-foreground">No penalty for skips</p></div><div className="rounded-xl bg-muted/50 p-3"><CheckCircle2 className="mb-2 h-4 w-4 text-violet-500"/><p className="font-medium">Answer review</p><p className="text-xs text-muted-foreground">Explanations at the end</p></div></div><p className="text-sm leading-6 text-muted-foreground">This is a learning and puzzle experience—not a standardized, professionally normed IQ test. Your score reflects only this question set.</p><Button size="lg" onClick={beginAssessment} className="w-full">Begin assessment <ArrowRight className="ml-2 h-4 w-4"/></Button></CardContent></Card>}
    {started && !finished && current && <Card className="mt-6"><CardHeader><div className="flex items-center justify-between gap-3"><Badge variant="outline">{current.domain}</Badge>{!dailyMode && <span className="inline-flex items-center gap-1.5 text-sm tabular-nums text-muted-foreground"><Clock3 className="h-4 w-4"/>{formatTime(seconds)}</span>}</div><Progress value={(index + 1) / activeQuestions.length * 100} className="mt-3"/><CardDescription>Question {index + 1} of {questions.length}</CardDescription><CardTitle className="pt-2 text-xl leading-7">{current.prompt}</CardTitle></CardHeader><CardContent className="space-y-3">{current.visual && <div aria-label={current.visual.join(" ")} className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-muted/20 p-3 sm:gap-3 sm:p-5">{current.visual.map((tile, tileIndex) => <div key={tileIndex} className="flex aspect-square items-center justify-center rounded-lg border border-border bg-card text-2xl font-semibold sm:text-4xl">{tileIndex === 8 ? "?" : tile}</div>)}</div>}{current.options.map((option, optionIndex) => <button key={option} type="button" onClick={() => setAnswers((prev) => ({ ...prev, [current.id]: optionIndex }))} className={`flex min-h-14 w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors ${answers[current.id] === optionIndex ? "border-violet-500 bg-violet-500/10 ring-1 ring-violet-500" : "border-border hover:bg-muted/60"}`}><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold">{String.fromCharCode(65 + optionIndex)}</span><span>{option}</span></button>)}<div className="flex flex-wrap justify-between gap-3 pt-3"><Button variant="outline" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}><ArrowLeft className="mr-2 h-4 w-4"/>Previous</Button><Button onClick={() => index === questions.length - 1 ? setFinished(true) : setIndex((i) => i + 1)}>{index === questions.length - 1 ? "Finish test" : "Next question"}<ArrowRight className="ml-2 h-4 w-4"/></Button></div><Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => setFinished(true)}>End assessment early</Button></CardContent></Card>}
    {finished && <Card className="mt-6"><CardHeader className="text-center"><div className="mx-auto rounded-full bg-emerald-500/10 p-4 text-emerald-600"><CheckCircle2 className="h-9 w-9"/></div><CardTitle className="text-2xl">Your practice results</CardTitle><CardDescription>Here is how you did on this question set.</CardDescription></CardHeader><CardContent><div className="rounded-2xl bg-muted/50 p-6 text-center"><p className="text-sm text-muted-foreground">Correct answers</p><p className="mt-1 text-4xl font-bold tabular-nums">{score}<span className="text-xl text-muted-foreground"> / {questions.length}</span></p><Progress value={assessment.percentage} className="mt-4"/><p className="mt-2 text-sm font-medium">{assessment.percentage}% accuracy · {questions.length - Object.keys(answers).length} skipped</p></div><div className="mt-5 space-y-3"><h3 className="font-semibold">By reasoning area</h3>{Object.entries(domainScores).map(([domain, value])=><div key={domain} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"><span>{domain}</span><Badge variant="secondary">{value.correct}/{value.total}</Badge></div>)}</div><div className="mt-6 space-y-4"><h3 className="font-semibold">Answer explanations</h3>{activeQuestions.map((q,i)=><div key={q.id} className="rounded-xl border border-border p-4"><div className="flex items-start justify-between gap-3"><p className="font-medium">{i+1}. {q.prompt}</p><Badge variant={answers[q.id]===q.answer?"default":"destructive"}>{answers[q.id]===q.answer?"Correct":"Review"}</Badge></div><p className="mt-2 text-sm text-muted-foreground">{q.explanation}</p><p className="mt-2 text-sm"><span className="font-medium">Your answer:</span> {answers[q.id] === undefined ? "Not answered" : q.options[answers[q.id]]}</p><p className="mt-1 text-sm"><span className="font-medium">Correct answer:</span> {q.options[q.answer]}</p></div>)}</div><p className="mt-5 text-xs leading-5 text-muted-foreground">This is not a certified IQ score, percentile or clinical assessment. No population norm has been applied.</p><div className="mt-6 flex flex-col gap-3 sm:flex-row"><Button onClick={reset} className="flex-1"><RotateCcw className="mr-2 h-4 w-4"/>Try again</Button><Button asChild variant="outline" className="flex-1"><Link to="/brain">Back to Brain Lab</Link></Button></div></CardContent></Card>}
  </div></main>;
}
