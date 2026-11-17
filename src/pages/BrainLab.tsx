import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight, BrainCircuit, CheckCircle2, Clock3, Compass, Grid3X3,
  Lightbulb, Puzzle, Sparkles, Target, Trophy, Zap, Shapes, ChartNoAxesCombined,
} from "lucide-react";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listBrainAssessmentAttempts, type BrainAttemptHistoryEntry } from "@/lib/brain/attempts";

const activities = [
  {
    eyebrow: "FULL ASSESSMENT",
    title: "Reasoning assessment",
    description: "A timed mix of original visual, numerical, logical, verbal and spatial reasoning questions.",
    detail: "20 minutes · Select your difficulty",
    icon: BrainCircuit,
    href: "/brain/iq-test",
    action: "Start assessment",
    featured: true,
  },
  {
    eyebrow: "VISUAL THINKING",
    title: "Matrix reasoning",
    description: "Find the hidden rule in 3 × 3 visual patterns, with fresh generated puzzles.",
    detail: "Three difficulty levels · Six choices",
    icon: Grid3X3,
    href: "/brain/matrices",
    action: "Solve matrices",
  },
  {
    eyebrow: "BUILD A SKILL",
    title: "Focused practice",
    description: "Choose one reasoning area or practise across all five domains.",
    detail: "Five reasoning domains",
    icon: Target,
    href: "/brain/iq-test?mode=practice",
    action: "Choose a skill",
  },
  {
    eyebrow: "A LITTLE EVERY DAY",
    title: "Daily brain challenge",
    description: "A short, untimed challenge to build a consistent habit of deliberate thinking.",
    detail: "3 questions · Untimed",
    icon: Sparkles,
    href: "/brain/iq-test?mode=daily",
    action: "Take today's challenge",
  },
];

const domains = [
  { name: "Visual patterns", description: "Shapes, sequences and matrix relationships", icon: Shapes },
  { name: "Numerical reasoning", description: "Sequences, operations and number logic", icon: Zap },
  { name: "Logical reasoning", description: "Deduction, conditions and conclusions", icon: Lightbulb },
  { name: "Verbal reasoning", description: "Analogies, meaning and inference", icon: Compass },
  { name: "Spatial reasoning", description: "Rotation, folding and 3D relationships", icon: Puzzle },
];

export default function BrainLab() {
  const [history, setHistory] = useState<BrainAttemptHistoryEntry[]>([]);
  const [historyStatus, setHistoryStatus] = useState<"loading" | "cloud" | "local">("loading");

  useEffect(() => {
    let active = true;
    void listBrainAssessmentAttempts(50).then((attempts) => {
      if (!active) return;
      if (attempts === null) {
        setHistoryStatus("local");
        return;
      }
      setHistory(attempts);
      setHistoryStatus("cloud");
    }).catch(() => {
      if (active) setHistoryStatus("local");
    });
    return () => { active = false; };
  }, []);

  const stats = useMemo(() => {
    const completed = history.length;
    const average = completed
      ? Math.round(history.reduce((sum, item) => sum + item.score / item.total, 0) / completed * 100)
      : 0;
    const best = completed
      ? Math.round(Math.max(...history.map((item) => item.score / item.total)) * 100)
      : 0;
    return { completed, average, best };
  }, [history]);

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-background text-foreground">
      <SEO
        title="IQ Test & Reasoning Practice | Sahadhyayi"
        description="Try original reasoning assessments, visual matrix puzzles, focused practice and daily brain challenges on Sahadhyayi."
        canonical="https://sahadhyayi.com/brain"
      />
      <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10 lg:py-14">
        <section className="relative isolate overflow-hidden rounded-[2rem] border border-violet-500/20 bg-gradient-to-br from-violet-500/12 via-background to-indigo-500/10 px-5 py-8 sm:px-9 sm:py-11">
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="relative grid gap-8 md:grid-cols-[1.1fr_.9fr] md:items-center">
            <div>
              <Badge variant="secondary" className="mb-4 gap-1.5 px-3 py-1">
                <BrainCircuit className="h-3.5 w-3.5" /> IQ TEST
              </Badge>
              <h1 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-5xl">
                Challenge the way you think.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
                Explore original reasoning questions, recognise patterns and practise different ways of solving problems. Learn from every attempt and follow your progress over time.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild size="lg" className="gap-2">
                  <Link to="/brain/iq-test">Start a test <ArrowRight className="h-4 w-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/brain/matrices">Try matrix puzzles</Link>
                </Button>
              </div>
              <p className="mt-4 text-xs leading-5 text-muted-foreground">
                A learning and practice experience—not a standardized IQ examination or a source of certified IQ scores.
              </p>
            </div>
            <div className="relative mx-auto w-full max-w-[360px]">
              <div className="rounded-3xl border border-violet-500/20 bg-background/85 p-4 shadow-xl shadow-violet-950/5 backdrop-blur">
                <div className="mb-3 flex items-center justify-between">
                  <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Visual reasoning</p><p className="mt-1 text-sm font-semibold">Find the missing tile</p></div>
                  <Badge variant="outline">3 × 3</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {["circle", "triangle", "square", "triangle", "square", "diamond", "square", "diamond", "missing"].map((shape, index) => (
                    <div key={index} className={`flex aspect-square items-center justify-center rounded-xl border ${shape === "missing" ? "border-dashed border-violet-500 bg-violet-500/10 text-violet-500" : "border-border bg-muted/40"}`}>
                      {shape === "missing" ? <span className="text-2xl font-semibold">?</span> : (
                        <svg viewBox="0 0 64 64" aria-hidden="true" className="h-10 w-10 text-violet-500 sm:h-12 sm:w-12">
                          {shape === "circle" && <circle cx="32" cy="32" r="19" fill="none" stroke="currentColor" strokeWidth="3.5" />}
                          {shape === "triangle" && <path d="M32 10 54 51H10Z" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinejoin="round" />}
                          {shape === "square" && <rect x="13" y="13" width="38" height="38" rx="2" fill="none" stroke="currentColor" strokeWidth="3.5" />}
                          {shape === "diamond" && <path d="M32 8 55 32 32 56 9 32Z" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinejoin="round" />}
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  Original puzzles designed for practice and learning.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-500">Choose your session</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Explore your reasoning skills</h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Start a timed assessment, focus on one skill or solve a quick daily challenge.</p>
            </div>
            <Badge variant="outline" className="gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> 4 activities</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {activities.map(({ eyebrow, title, description, detail, icon: Icon, href, action, featured }) => (
              <Card key={title} className={`group relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${featured ? "border-violet-500/40 bg-gradient-to-br from-violet-500/10 via-card to-indigo-500/5" : "bg-card"}`}>
                {featured && <div className="absolute right-0 top-0 rounded-bl-xl bg-violet-600 px-3 py-1.5 text-[10px] font-semibold tracking-wide text-white">START HERE</div>}
                <CardHeader className="pb-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-background text-violet-500"><Icon className="h-5 w-5" /></span>
                    <Badge variant="secondary">Ready</Badge>
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-500">{eyebrow}</p>
                  <CardTitle className="text-xl">{title}</CardTitle>
                  <CardDescription className="min-h-[3rem] text-sm leading-6">{description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Clock3 className="h-3.5 w-3.5" /> {detail}</span>
                  <Button asChild variant={featured ? "default" : "outline"} size="sm" className="gap-2">
                    <Link to={href}>{action}<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-11">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-500">Five reasoning domains</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">What you can practise</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {domains.map(({ name, description, icon: Icon }) => (
              <div key={name} className="rounded-2xl border border-border bg-card p-4 transition-colors hover:border-violet-500/40">
                <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500"><Icon className="h-4 w-4" /></span>
                <h3 className="text-sm font-semibold">{name}</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2"><ChartNoAxesCombined className="h-5 w-5 text-violet-500" /><CardTitle className="text-lg">Your progress</CardTitle></div>
              <CardDescription>{historyStatus === "cloud" ? "Your latest saved assessments from your account." : historyStatus === "loading" ? "Checking for saved assessment history." : "Sign in to sync your assessment history across devices. Guest attempts remain on this device."}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="rounded-xl bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Attempts</p><p className="mt-1 text-2xl font-semibold tabular-nums">{stats.completed}</p></div>
                <div className="rounded-xl bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Average</p><p className="mt-1 text-2xl font-semibold tabular-nums">{stats.average}%</p></div>
                <div className="rounded-xl bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Best</p><p className="mt-1 text-2xl font-semibold tabular-nums">{stats.best}%</p></div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Scores describe performance on your completed question sets; they are not IQ scores or population percentiles.</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2"><Trophy className="h-5 w-5 text-amber-500" /><CardTitle className="text-lg">Build a consistent habit</CardTitle></div>
              <CardDescription>Short, regular practice makes it easier to notice which skills need more attention.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">Review explanations after each attempt and revisit weaker areas.</div>
              <Button asChild variant="outline"><Link to="/brain/iq-test?mode=practice">Practise a skill <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            </CardContent>
          </Card>
        </section>

        <section className="mt-5 rounded-2xl border border-border/70 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-violet-500" />
            <div>
              <h2 className="font-semibold">Understand your results</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Sahadhyayi provides original practice questions and feedback on performance in those activities. It does not diagnose, certify intelligence, or produce a professionally normed IQ or population percentile.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
