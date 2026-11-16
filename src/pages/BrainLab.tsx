import { Brain, BrainCircuit, Clock3, Puzzle, Sparkles, Target, Trophy, ArrowRight, LockKeyhole } from "lucide-react";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const activities = [
  { title: "IQ-style reasoning test", description: "A timed practice assessment across logic, number patterns and verbal reasoning.", icon: BrainCircuit, href: "/brain/iq-test", badge: "Available", tone: "from-violet-500/15 to-indigo-500/5" },
  { title: "Visual matrix practice", description: "Solve fresh 3×3 shape matrices with difficulty levels and explanations.", icon: Puzzle, href: "/brain/matrices", badge: "Available", tone: "from-indigo-500/15 to-violet-500/5" },
  { title: "Practice by skill", description: "Build confidence with focused reasoning exercises and worked explanations.", icon: Target, href: "/brain/iq-test?mode=practice", badge: "Starter set", tone: "from-blue-500/15 to-cyan-500/5" },
  { title: "Daily brain challenge", description: "A small puzzle to keep curiosity and problem-solving habits alive.", icon: Sparkles, href: "/brain/iq-test?mode=daily", badge: "Coming next", tone: "from-amber-500/15 to-orange-500/5" },
  { title: "My progress", description: "Review attempts, skill trends and practice milestones in one place.", icon: Trophy, href: "/brain#progress", badge: "Coming next", tone: "from-emerald-500/15 to-teal-500/5" },
];

export default function BrainLab() {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-background text-foreground">
      <SEO title="IQ Test | Sahadhyayi" description="Explore original reasoning puzzles and IQ-style practice assessments in Sahadhyayi IQ Test." />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-16">
        <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-violet-500/10 via-background to-indigo-500/10 p-6 sm:p-10">
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="relative grid gap-8 md:grid-cols-[1.2fr_.8fr] md:items-center">
            <div>
              <Badge variant="secondary" className="mb-4 gap-1.5"><Brain className="h-3.5 w-3.5" /> SAHADHYAYI · BRAIN</Badge>
              <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">Curiosity is your superpower.</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">Welcome to IQ Test: a space for reasoning, visual matrices and thoughtful challenges. Practice for fun, learn how you solve problems, and keep your mind curious.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild size="lg"><Link to="/brain/iq-test">Start reasoning test <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                <Button asChild size="lg" variant="outline"><Link to="/games">Explore book quizzes</Link></Button>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">Practice experience only—not a clinical assessment or certified IQ score.</p>
            </div>
            <div className="mx-auto flex aspect-square w-full max-w-[260px] items-center justify-center rounded-full border border-violet-500/20 bg-violet-500/5">
              <div className="flex aspect-[.82] w-[72%] items-center justify-center rounded-[45%] border border-indigo-500/30 bg-gradient-to-br from-violet-500/15 to-indigo-500/10 shadow-inner">
                <BrainCircuit className="h-24 w-24 text-violet-500 sm:h-28 sm:w-28" strokeWidth={1.2} />
              </div>
            </div>
          </div>
        </section>
        <section className="mt-10">
          <div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-sm font-medium text-violet-500">EXPLORE</p><h2 className="mt-1 text-2xl font-semibold">Your cognitive playground</h2></div><span className="hidden text-sm text-muted-foreground sm:block">Small steps. Sharper thinking.</span></div>
          <div className="grid gap-4 sm:grid-cols-2">
            {activities.map(({ title, description, icon: Icon, href, badge, tone }) => {
              const ready = badge === "Available" || badge === "Starter set";
              return <Card key={title} className={`overflow-hidden border-border bg-gradient-to-br ${tone}`}>
                <CardHeader><div className="mb-2 flex items-center justify-between"><span className="rounded-xl border border-border bg-background/70 p-2.5"><Icon className="h-5 w-5" /></span><Badge variant={ready ? "default" : "secondary"}>{badge}</Badge></div><CardTitle>{title}</CardTitle><CardDescription className="min-h-10 leading-6">{description}</CardDescription></CardHeader>
                <CardContent>{ready ? <Button asChild variant="outline"><Link to={href}>Open activity <ArrowRight className="ml-2 h-4 w-4" /></Link></Button> : <Button disabled variant="outline"><LockKeyhole className="mr-2 h-4 w-4" /> In the roadmap</Button>}</CardContent>
              </Card>;
            })}
          </div>
        </section>
        <section className="mt-8 rounded-2xl border border-border bg-muted/30 p-5 sm:p-6"><div className="flex items-start gap-3"><Puzzle className="mt-1 h-5 w-5 text-violet-500" /><div><h3 className="font-semibold">What these tests mean</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">Our puzzles measure performance on this practice set only. They do not diagnose, certify intelligence, or produce a professionally normed IQ. Results depend on language, familiarity, accessibility and test conditions.</p></div></div></section>
      </div>
    </main>
  );
}
