import {
  ArrowRight,
  Brain,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Compass,
  Grid3X3,
  Lightbulb,
  LockKeyhole,
  Puzzle,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const activities = [
  {
    eyebrow: "START HERE",
    title: "Full reasoning assessment",
    description: "A timed mix of visual, numerical, logical and verbal questions. Review every answer when you finish.",
    detail: "20 minutes · Choose your difficulty",
    icon: BrainCircuit,
    href: "/brain/iq-test",
    action: "Start assessment",
    status: "Available",
    featured: true,
  },
  {
    eyebrow: "VISUAL THINKING",
    title: "Matrix reasoning",
    description: "Study changing shapes and discover the rule that completes each 3 × 3 visual pattern.",
    detail: "Fresh generated puzzles · 3 levels",
    icon: Grid3X3,
    href: "/brain/matrices",
    action: "Solve puzzles",
    status: "Available",
  },
  {
    eyebrow: "BUILD A SKILL",
    title: "Focused practice",
    description: "Spend a session on one reasoning area, or mix all four domains to keep your thinking flexible.",
    detail: "Visual · Logic · Numbers · Verbal",
    icon: Target,
    href: "/brain/iq-test?mode=practice",
    action: "Choose a skill",
    status: "Available",
  },
  {
    eyebrow: "A LITTLE EVERY DAY",
    title: "Daily brain challenge",
    description: "Take on a short set of questions and build a steady habit of curious, deliberate thinking.",
    detail: "3 questions · Untimed",
    icon: Sparkles,
    href: "/brain/iq-test?mode=daily",
    action: "Take today's challenge",
    status: "Available",
  },
];

const domains = [
  { name: "Visual patterns", description: "Shapes, sequences and spatial relationships", icon: Puzzle },
  { name: "Numerical reasoning", description: "Sequences, relationships and number logic", icon: Zap },
  { name: "Logical reasoning", description: "Deduction, conditions and conclusions", icon: Lightbulb },
  { name: "Verbal reasoning", description: "Analogies, meaning and word relationships", icon: Compass },
];

export default function BrainLab() {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-background text-foreground">
      <SEO
        title="IQ Test & Brain Lab | Sahadhyayi"
        description="Explore original reasoning assessments, visual matrix puzzles, focused practice and daily brain challenges on Sahadhyayi."
        canonical="https://sahadhyayi.com/brain"
      />

      <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10 lg:py-14">
        <section className="relative isolate overflow-hidden rounded-[2rem] border border-violet-500/20 bg-gradient-to-br from-violet-500/12 via-background to-indigo-500/10 px-5 py-8 sm:px-9 sm:py-11">
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="relative grid gap-8 md:grid-cols-[1.15fr_.85fr] md:items-center">
            <div>
              <Badge variant="secondary" className="mb-4 gap-1.5 px-3 py-1">
                <Brain className="h-3.5 w-3.5" /> SAHADHYAYI BRAIN LAB
              </Badge>
              <h1 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-5xl">
                Think deeper. Notice patterns. Stay curious.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
                Explore a growing collection of reasoning tests and original brain puzzles. Practise at your own pace, understand your answers and discover the ways you solve problems.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild size="lg" className="gap-2">
                  <Link to="/brain/iq-test">Start a test <ArrowRight className="h-4 w-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/brain/matrices">Try a visual puzzle</Link>
                </Button>
              </div>
              <p className="mt-4 text-xs leading-5 text-muted-foreground">
                A learning and practice experience—not a standardized IQ examination or a source of certified IQ scores.
              </p>
            </div>

            <div className="relative mx-auto w-full max-w-[330px]">
              <div className="rounded-3xl border border-violet-500/20 bg-background/75 p-4 shadow-xl shadow-violet-950/5 backdrop-blur">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Find the pattern</span>
                  <Badge variant="outline">3 × 3</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {["circle", "triangle", "square", "triangle", "square", "diamond", "square", "diamond", "missing"].map((shape, index) => (
                    <div key={index} className={`flex aspect-square items-center justify-center rounded-xl border ${shape === "missing" ? "border-dashed border-violet-500 bg-violet-500/10 text-violet-500" : "border-border bg-muted/40"}`}>
                      {shape === "missing" ? (
                        <span className="text-2xl font-semibold">?</span>
                      ) : (
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
                  Every puzzle is an invitation to think differently.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-500">Choose your session</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Explore the Brain Lab</h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Start with a complete assessment, practise one skill or solve a quick daily challenge.</p>
            </div>
            <Badge variant="outline" className="gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> 4 activities available</Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {activities.map(({ eyebrow, title, description, detail, icon: Icon, href, action, featured }) => (
              <Card key={title} className={`group relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${featured ? "border-violet-500/40 bg-gradient-to-br from-violet-500/10 via-card to-indigo-500/5" : "bg-card"}`}>
                {featured && <div className="absolute right-0 top-0 rounded-bl-xl bg-violet-600 px-3 py-1.5 text-[10px] font-semibold tracking-wide text-white">RECOMMENDED</div>}
                <CardHeader className="pb-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-background text-violet-500">
                      <Icon className="h-5 w-5" />
                    </span>
                    <Badge variant="secondary">Available</Badge>
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-500">{eyebrow}</p>
                  <CardTitle className="text-xl">{title}</CardTitle>
                  <CardDescription className="min-h-[3rem] text-sm leading-6">{description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock3 className="h-3.5 w-3.5" /> {detail}
                  </span>
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
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-500">What you can practise</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">Four ways to challenge your thinking</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {domains.map(({ name, description, icon: Icon }) => (
              <div key={name} className="rounded-2xl border border-border bg-card p-4">
                <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500"><Icon className="h-4 w-4" /></span>
                <h3 className="text-sm font-semibold">{name}</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-[1fr_auto] md:items-center rounded-2xl border border-border bg-muted/30 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <Trophy className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
            <div>
              <h2 className="font-semibold">Your progress, in one place</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Your assessment history, practice streak and performance trends are available from the reasoning assessment. History is currently stored on this device.</p>
            </div>
          </div>
          <Button asChild variant="outline" className="w-full md:w-auto">
            <Link to="/brain/iq-test">View my progress <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </section>

        <section className="mt-5 rounded-2xl border border-border/70 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-violet-500" />
            <div>
              <h2 className="font-semibold">A note about your results</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Sahadhyayi Brain Lab provides original practice questions and feedback on your performance in those activities. It does not diagnose, certify intelligence, or produce a professionally normed IQ or population percentile. Results can be affected by language, familiarity, accessibility and test conditions.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
