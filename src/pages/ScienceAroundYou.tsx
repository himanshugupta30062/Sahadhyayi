import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Atom,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Lightbulb,
  Loader2,
  Microscope,
  RotateCcw,
  Sparkles,
  Trophy,
  Youtube,
} from "lucide-react";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client-universal";
import {
  listEverydayScienceAttempts,
  saveEverydayScienceAttempt,
  type ScienceAssessmentEvaluation,
  type ScienceAttemptHistory,
  type ScienceQuestionEvaluation,
} from "@/lib/science/attempts";
import {
  getScienceQuestionsForDifficulty,
  shuffleScienceQuestions,
  type ScienceQuestion,
  type ScienceDifficulty,
} from "@/lib/science/questionBank";

type Phase = "intro" | "test" | "results";

const DIMENSION_LABELS: Array<{ key: keyof ScienceQuestionEvaluation["dimensions"]; label: string }> = [
  { key: "accuracy", label: "Scientific accuracy" },
  { key: "conceptualUnderstanding", label: "Conceptual understanding" },
  { key: "reasoning", label: "Reasoning" },
  { key: "completeness", label: "Completeness" },
  { key: "clarity", label: "Clarity" },
];

function scoreLabel(score: number): string {
  if (score >= 85) return "Strong understanding";
  if (score >= 70) return "Good foundation";
  if (score >= 50) return "Developing understanding";
  if (score >= 30) return "Early understanding";
  return "A place to begin";
}

function resourceSearchUrl(query: string): string {
  return "https://www.youtube.com/results?search_query=" + encodeURIComponent(query);
}

function AnswerResultCard({
  question,
  result,
  index,
}: {
  question: ScienceQuestion;
  result: ScienceQuestionEvaluation;
  index: number;
}) {
  const [expanded, setExpanded] = useState(index === 0);

  return (
    <Card className="overflow-hidden border-border/80">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between gap-4 p-4 text-left sm:p-5"
        aria-expanded={expanded}
      >
        <span className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
            {index + 1}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-foreground sm:text-base">{question.title}</span>
            <span className="mt-1 block text-xs text-muted-foreground">{question.domain}</span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <Badge variant={result.score >= 70 ? "default" : "secondary"}>{result.score}%</Badge>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </span>
      </button>

      {expanded && (
        <CardContent className="space-y-5 border-t border-border/70 px-4 pb-5 pt-4 sm:px-5">
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">Your understanding</p>
              <span className="text-sm font-bold tabular-nums">{result.score}%</span>
            </div>
            <Progress value={result.score} className="h-2" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {DIMENSION_LABELS.map(({ key, label }) => (
              <div key={key} className="space-y-1.5">
                <div className="flex justify-between gap-2 text-xs">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-semibold tabular-nums">{result.dimensions[key]}%</span>
                </div>
                <Progress value={result.dimensions[key]} className="h-1.5" />
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-muted/60 p-3.5">
            <p className="text-sm font-semibold">AI feedback</p>
            <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{result.feedback}</p>
          </div>

          {result.strengths.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> What you understood
              </p>
              <ul className="space-y-1.5 pl-5 text-sm leading-6 text-muted-foreground">
                {result.strengths.map((item, itemIndex) => <li key={itemIndex} className="list-disc">{item}</li>)}
              </ul>
            </div>
          )}

          {result.improvements.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
                <Lightbulb className="h-4 w-4" /> What to improve
              </p>
              <ul className="space-y-1.5 pl-5 text-sm leading-6 text-muted-foreground">
                {result.improvements.map((item, itemIndex) => <li key={itemIndex} className="list-disc">{item}</li>)}
              </ul>
            </div>
          )}

          {result.misconceptionCorrection && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5">
              <p className="text-sm font-semibold">A misconception to correct</p>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{result.misconceptionCorrection}</p>
            </div>
          )}

          <div className="border-t border-border/70 pt-4">
            <p className="text-sm font-semibold">The science, explained</p>
            <p className="mt-1.5 text-sm leading-7 text-muted-foreground">{result.correctExplanation}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {question.scientist && (
              <a
                href={question.scientist.href}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-border/70 p-3 transition-colors hover:bg-muted/50"
              >
                <Microscope className="h-4 w-4 text-primary" />
                <span className="mt-2 block text-xs font-semibold">Related scientist / inventor</span>
                <span className="mt-1 block text-sm font-medium">{question.scientist.name}</span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">{question.scientist.contribution}</span>
              </a>
            )}
            <a
              href={"https://books.google.com/books?q=" + encodeURIComponent(question.book.searchQuery)}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-border/70 p-3 transition-colors hover:bg-muted/50"
            >
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="mt-2 block text-xs font-semibold">Related reading</span>
              <span className="mt-1 block text-sm font-medium">{question.book.title}</span>
              <span className="mt-1 block text-xs text-muted-foreground">by {question.book.author} · Find book details</span>
            </a>
            <a
              href={resourceSearchUrl(question.youtubeSearch)}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-border/70 p-3 transition-colors hover:bg-muted/50"
            >
              <Youtube className="h-4 w-4 text-red-600" />
              <span className="mt-2 block text-xs font-semibold">Watch and explore</span>
              <span className="mt-1 block text-sm font-medium">Related science videos</span>
              <span className="mt-1 block text-xs text-muted-foreground">Open a YouTube search for this topic</span>
            </a>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function ScienceAroundYou() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [difficulty, setDifficulty] = useState<ScienceDifficulty>("beginner");
  const [questions, setQuestions] = useState<ScienceQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<ScienceAssessmentEvaluation | null>(null);
  const [savedToProfile, setSavedToProfile] = useState<boolean | null>(null);
  const [lastAttempt, setLastAttempt] = useState<ScienceAttemptHistory | null>(null);

  useEffect(() => {
    let active = true;
    void listEverydayScienceAttempts(1)
      .then((attempts) => {
        if (active && attempts?.length) setLastAttempt(attempts[0]);
      })
      .catch(() => {
        // History is optional; the assessment itself remains available.
      });
    return () => { active = false; };
  }, []);

  const currentQuestion = questions[currentIndex];
  const answeredCount = useMemo(
    () => questions.filter((question) => (answers[question.id] ?? "").trim().length >= 8).length,
    [answers, questions],
  );
  const progress = questions.length ? ((currentIndex + 1) / questions.length) * 100 : 0;

  const startAssessment = () => {
    setQuestions(shuffleScienceQuestions(getScienceQuestionsForDifficulty(difficulty)));
    setAnswers({});
    setCurrentIndex(0);
    setEvaluation(null);
    setEvaluationError(null);
    setSavedToProfile(null);
    setPhase("test");
  };

  const updateAnswer = (value: string) => {
    if (!currentQuestion) return;
    setAnswers((previous) => ({ ...previous, [currentQuestion.id]: value.slice(0, 2000) }));
  };

  const evaluateAssessment = async () => {
    if (isEvaluating || !questions.length || answeredCount === 0) return;
    setIsEvaluating(true);
    setEvaluationError(null);

    const submission = questions.map((question) => ({
      questionId: question.id,
      answer: (answers[question.id] ?? "").trim(),
    }));

    try {
      const { data, error } = await supabase.functions.invoke<ScienceAssessmentEvaluation>(
        "everyday-science-evaluate",
        { body: { difficulty, answers: submission } },
      );
      if (error) throw error;
      const expectedIds = new Set(questions.map((question) => question.id));
      const resultIds = new Set(Array.isArray(data?.results) ? data.results.map((item) => item?.questionId) : []);
      if (
        !data ||
        data.difficulty !== difficulty ||
        !Array.isArray(data.results) ||
        data.results.length !== questions.length ||
        resultIds.size !== questions.length ||
        [...expectedIds].some((id) => !resultIds.has(id)) ||
        typeof data.overallScore !== "number" ||
        !Number.isFinite(data.overallScore) ||
        data.overallScore < 0 ||
        data.overallScore > 100 ||
        !data.categoryScores ||
        typeof data.categoryScores !== "object" ||
        Object.values(data.categoryScores).some((score) => typeof score !== "number" || !Number.isFinite(score) || score < 0 || score > 100)
      ) {
        throw new Error("The evaluator returned an incomplete result. Please try again.");
      }

      setEvaluation(data);
      setPhase("results");

      try {
        const saved = await saveEverydayScienceAttempt(submission, data);
        setSavedToProfile(saved);
        if (saved) {
          void listEverydayScienceAttempts(1)
            .then((attempts) => { if (attempts?.length) setLastAttempt(attempts[0]); })
            .catch(() => undefined);
        }
      } catch {
        setSavedToProfile(false);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "The science evaluation failed. Please try again.";
      setEvaluationError(message.slice(0, 240));
    } finally {
      setIsEvaluating(false);
    }
  };

  const scoreSummary = useMemo(() => {
    if (!evaluation) return null;
    const sorted = Object.entries(evaluation.categoryScores).sort((a, b) => b[1] - a[1]);
    return { strongest: sorted[0], weakest: sorted[sorted.length - 1] };
  }, [evaluation]);

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-background text-foreground">
      <SEO
        title="Explain Science Around You | Sahadhyayi"
        description="Explain the science behind everyday machines, nature and technology. Get personalised AI feedback, learn the correct concepts and discover related books and scientists."
        canonical="https://sahadhyayi.com/science-around-you"
      />

      <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-10 lg:py-14">
        {phase === "intro" && (
          <>
            <section className="relative isolate overflow-hidden rounded-[2rem] border border-sky-500/20 bg-gradient-to-br from-sky-500/10 via-background to-cyan-500/10 px-5 py-8 sm:px-9 sm:py-11">
              <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-sky-500/15 blur-3xl" />
              <div className="relative grid gap-8 md:grid-cols-[1.2fr_.8fr] md:items-center">
                <div>
                  <Badge variant="secondary" className="mb-4 gap-1.5 px-3 py-1">
                    <Atom className="h-3.5 w-3.5" /> EVERYDAY SCIENCE
                  </Badge>
                  <h1 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-5xl">
                    Explain the science around you.
                  </h1>
                  <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
                    Why does a fan cool you? How does an AC move heat? Why does a bus jerk when it brakes?
                    Explain everyday phenomena in your own words and discover how well you understand the world.
                  </p>
                  <div className="mt-6 space-y-3">
                    <p className="text-sm font-semibold">Choose your challenge level</p>
                    <div className="grid gap-2 sm:grid-cols-3" role="group" aria-label="Science assessment difficulty">
                      {([
                        { value: "beginner", title: "Beginner", detail: "Core ideas and everyday explanations" },
                        { value: "intermediate", title: "Intermediate", detail: "Cause, effect and connected concepts" },
                        { value: "advanced", title: "Advanced", detail: "Deeper mechanisms and nuanced reasoning" },
                      ] as const).map((level) => (
                        <button
                          key={level.value}
                          type="button"
                          aria-pressed={difficulty === level.value}
                          onClick={() => setDifficulty(level.value)}
                          className={"rounded-xl border p-3 text-left transition-colors " + (difficulty === level.value ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border bg-background hover:bg-muted/60")}
                        >
                          <span className="block text-sm font-semibold">{level.title}</span>
                          <span className="mt-1 block text-xs leading-5 text-muted-foreground">{level.detail}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button size="lg" onClick={startAssessment} className="gap-2">
                      Start the science test <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button asChild size="lg" variant="outline">
                      <Link to="/library">Explore the library</Link>
                    </Button>
                  </div>
                  <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock3 className="h-3.5 w-3.5" /> 10 real-world questions · About 10–15 minutes · No multiple-choice guessing
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { emoji: "🌀", label: "Machines", note: "Fans, ACs and engines" },
                    { emoji: "🚌", label: "Transport", note: "Motion and forces" },
                    { emoji: "🌦️", label: "Nature", note: "Weather and Earth" },
                    { emoji: "⚡", label: "Technology", note: "How things work" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm backdrop-blur">
                      <span className="text-3xl" aria-hidden="true">{item.emoji}</span>
                      <p className="mt-3 text-sm font-semibold">{item.label}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {lastAttempt && (
              <Card className="mt-5 border-sky-500/20">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="text-sm font-semibold">Your last science assessment</p>
                    <p className="mt-1 text-xs text-muted-foreground">{lastAttempt.difficulty ?? "beginner"} level</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(lastAttempt.created_at).toLocaleDateString()} · {lastAttempt.question_count} questions
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold tabular-nums">{lastAttempt.overall_score}%</p>
                    <p className="text-xs text-muted-foreground">Understanding score</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <section className="mt-8 grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <Microscope className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Explain, don't guess</CardTitle>
                  <CardDescription>Write an explanation in your own words. A short, correct answer can score well.</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <Sparkles className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Get thoughtful feedback</CardTitle>
                  <CardDescription>Gemini evaluates accuracy, concepts, reasoning, completeness and clarity.</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <BookOpen className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Keep learning</CardTitle>
                  <CardDescription>Each result connects you to a clear explanation, related scientists, books and videos.</CardDescription>
                </CardHeader>
              </Card>
            </section>

            <section className="mt-8 rounded-2xl border border-border/70 bg-muted/30 p-5 sm:p-6">
              <h2 className="text-lg font-semibold">How your score works</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                Your Everyday Science Understanding Score summarises how well you explained these ten topics.
                It is a learning measure—not an IQ score, a school grade or a scientific measure of intelligence.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {DIMENSION_LABELS.map(({ key, label }) => {
                  const weights = { accuracy: "35%", conceptualUnderstanding: "25%", reasoning: "20%", completeness: "15%", clarity: "5%" };
                  return (
                    <div key={key} className="rounded-xl border border-border/70 bg-background p-3">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="mt-1 text-lg font-bold">{weights[key]}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {phase === "test" && currentQuestion && (
          <section className="mx-auto max-w-3xl">
            <div className="mb-6 flex items-center justify-between gap-4">
              <Button asChild variant="ghost" size="sm" className="-ml-2">
                <Link to="/activity"><ArrowLeft className="mr-2 h-4 w-4" /> Exit assessment</Link>
              </Button>
              <Badge variant="outline">Everyday Science · {difficulty[0].toUpperCase() + difficulty.slice(1)}</Badge>
            </div>

            <div className="mb-5 space-y-2">
              <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>Question {currentIndex + 1} of {questions.length}</span>
                <span>{answeredCount} of {questions.length} answered</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <Card className="overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-sky-500 via-cyan-500 to-teal-400" />
              <CardHeader className="pb-3">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{currentQuestion.domain}</Badge>
                  <Badge variant="outline">Open-ended question</Badge>
                </div>
                <CardTitle className="text-xl leading-snug sm:text-2xl">{currentQuestion.title}</CardTitle>
                <CardDescription className="pt-1 text-sm leading-6">{currentQuestion.prompt}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl bg-muted/50 p-3.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Think about</p>
                  <p className="mt-1.5 text-sm leading-6">{currentQuestion.context}</p>
                </div>
                <label htmlFor="science-answer" className="block text-sm font-semibold">Your explanation</label>
                <textarea
                  id="science-answer"
                  value={answers[currentQuestion.id] ?? ""}
                  onChange={(event) => updateAnswer(event.target.value)}
                  maxLength={2000}
                  rows={7}
                  placeholder="Explain what happens and why, in your own words..."
                  className="w-full resize-y rounded-xl border border-input bg-background px-4 py-3 text-sm leading-7 text-foreground shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                />
                <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span>Your answer is evaluated for scientific meaning, not textbook wording.</span>
                  <span className="shrink-0 tabular-nums">{(answers[currentQuestion.id] ?? "").length}/2000</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
                    disabled={currentIndex === 0 || isEvaluating}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                  </Button>
                  {currentIndex < questions.length - 1 ? (
                    <Button type="button" onClick={() => setCurrentIndex((index) => Math.min(questions.length - 1, index + 1))}>
                      {((answers[currentQuestion.id] ?? "").trim().length >= 8) ? "Save & continue" : "Skip for now"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button type="button" onClick={evaluateAssessment} disabled={isEvaluating || answeredCount === 0}>
                      {isEvaluating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Evaluating answers...</> : <>Evaluate my answers <Sparkles className="ml-2 h-4 w-4" /></>}
                    </Button>
                  )}
                </div>
                {evaluationError && (
                  <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                    {evaluationError}
                    <Button type="button" variant="link" className="ml-1 h-auto p-0" onClick={evaluateAssessment}>Try again</Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="mt-4 flex flex-wrap gap-2" aria-label="Question navigation">
              {questions.map((question, index) => {
                const answered = (answers[question.id] ?? "").trim().length >= 8;
                return (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => setCurrentIndex(index)}
                    aria-label={`Go to question ${index + 1}`}
                    aria-current={index === currentIndex ? "step" : undefined}
                    disabled={isEvaluating}
                    className={
                      "flex h-9 w-9 items-center justify-center rounded-lg border text-xs font-semibold transition-colors " +
                      (index === currentIndex
                        ? "border-primary bg-primary text-primary-foreground"
                        : answered
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : "border-border bg-background text-muted-foreground hover:bg-muted")
                    }
                  >
                    {answered ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">You can move between questions before submitting. Unanswered questions receive zero for that question.</p>
          </section>
        )}

        {phase === "results" && evaluation && (
          <section>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <Badge variant="secondary" className="mb-2 gap-1.5"><Trophy className="h-3.5 w-3.5" /> ASSESSMENT COMPLETE</Badge>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Your everyday science report</h1>
                <p className="mt-1 text-sm text-muted-foreground">A {difficulty} level learning snapshot of how you explained the world around you.</p>
              </div>
              <Button variant="outline" onClick={startAssessment}><RotateCcw className="mr-2 h-4 w-4" /> Try again</Button>
            </div>

            <div className="grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
              <Card className="border-sky-500/20 bg-gradient-to-br from-sky-500/10 via-background to-cyan-500/10">
                <CardContent className="p-5 sm:p-6">
                  <p className="text-sm font-semibold text-muted-foreground">Everyday Science Understanding Score</p>
                  <div className="mt-3 flex items-end gap-2">
                    <span className="text-6xl font-bold tracking-tight tabular-nums">{evaluation.overallScore}</span>
                    <span className="pb-2 text-2xl font-semibold text-muted-foreground">/100</span>
                  </div>
                  <div className="mt-4"><Progress value={evaluation.overallScore} className="h-3" /></div>
                  <p className="mt-3 text-lg font-semibold">{scoreLabel(evaluation.overallScore)}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Your score reflects this set of answers only. It is not an IQ score or a measure of your overall intelligence.
                  </p>
                  <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {answeredCount} answers evaluated · {questions.length} questions
                  </div>
                  {savedToProfile === true && (
                    <p className="mt-3 text-xs text-emerald-700 dark:text-emerald-400">Your result has been saved to your Sahadhyayi profile.</p>
                  )}
                  {savedToProfile === false && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      This result could not be saved to your profile. Sign in to enable personal history, then try another assessment to track your progress. <Link to="/signin" className="font-semibold text-primary underline underline-offset-4">Sign in</Link>
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Your topic breakdown</CardTitle>
                  <CardDescription>Scores are averages of your answers in each science area.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(evaluation.categoryScores).map(([category, score]) => (
                    <div key={category} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium">{category}</span>
                        <span className="font-semibold tabular-nums">{score}%</span>
                      </div>
                      <Progress value={score} className="h-2" />
                    </div>
                  ))}
                  {scoreSummary?.strongest && (
                    <div className="rounded-lg bg-muted/50 p-3 text-xs leading-5 text-muted-foreground">
                      Strongest area in this attempt: <strong className="text-foreground">{scoreSummary.strongest[0]}</strong>.
                      {scoreSummary.weakest && scoreSummary.weakest[0] !== scoreSummary.strongest[0] && (
                        <> A useful area to revisit: <strong className="text-foreground">{scoreSummary.weakest[0]}</strong>.</>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="mt-7 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Learn from each answer</h2>
            </div>
            <p className="mb-4 mt-1 text-sm text-muted-foreground">Open a question to see what you understood, what you missed and where to explore the topic further.</p>
            <div className="space-y-3">
              {evaluation.results.map((result, index) => {
                const question = getScienceQuestionsForDifficulty(evaluation.difficulty).find((item) => item.id === result.questionId);
                return question ? <AnswerResultCard key={result.questionId} question={question} result={result} index={index} /> : null;
              })}
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Button onClick={startAssessment}><RotateCcw className="mr-2 h-4 w-4" /> Take another assessment</Button>
              <Button asChild variant="outline"><Link to="/library">Explore related books</Link></Button>
              <Button asChild variant="ghost"><Link to="/brain">Visit IQ Test</Link></Button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
