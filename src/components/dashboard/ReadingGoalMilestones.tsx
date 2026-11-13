import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Target, Sparkles } from 'lucide-react';
import ReadingGoalDialog from '@/components/dashboard/ReadingGoalDialog';

interface ReadingGoalMilestonesProps {
  completedBooks: number;
  goal: number;
  year: number;
}

const milestones = [
  { percent: 25, label: 'Quarter way', icon: '🌱' },
  { percent: 50, label: 'Halfway', icon: '📚' },
  { percent: 75, label: 'Almost there', icon: '🔥' },
  { percent: 100, label: 'Goal reached', icon: '🏆' },
];

export default function ReadingGoalMilestones({ completedBooks, goal, year }: ReadingGoalMilestonesProps) {
  const progress = Math.min(100, Math.round((completedBooks / Math.max(1, goal)) * 100));
  const next = milestones.find((milestone) => progress < milestone.percent);
  const remaining = Math.max(0, goal - completedBooks);

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle as="h2" className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4 text-[hsl(var(--brand-primary))]" />
          {year} Reading Goal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div
            role="img"
            aria-label={`${progress}% of reading goal completed`}
            className="relative grid h-24 w-24 shrink-0 place-items-center rounded-full"
            style={{ background: `conic-gradient(hsl(var(--brand-primary)) ${progress}%, hsl(var(--muted)) ${progress}% 100%)` }}
          >
            <div className="grid h-[76px] w-[76px] place-items-center rounded-full bg-card">
              <span className="text-xl font-bold tabular-nums">{progress}%</span>
            </div>
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-2xl font-bold tabular-nums">{completedBooks}<span className="text-sm font-normal text-muted-foreground"> / {goal} books</span></p>
            <p className="text-sm text-muted-foreground">
              {remaining === 0 ? 'You did it—goal achieved!' : `${remaining} more ${remaining === 1 ? 'book' : 'books'} to reach your goal`}
            </p>
            {next && <p className="text-xs text-[hsl(var(--brand-primary))]">Next: {next.label} · {Math.max(0, Math.ceil((goal * next.percent) / 100) - completedBooks)} books away</p>}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {milestones.map((milestone) => {
            const unlocked = progress >= milestone.percent;
            return (
              <div key={milestone.percent} className={`rounded-lg border p-2 text-center ${unlocked ? 'border-[hsl(var(--brand-primary)/0.35)] bg-[hsl(var(--brand-primary)/0.06)]' : 'border-border opacity-55'}`}>
                <div className="text-lg" aria-hidden="true">{unlocked ? milestone.icon : '🔒'}</div>
                <p className="mt-1 text-[10px] leading-tight text-muted-foreground">{milestone.percent}%</p>
                <p className="text-[10px] font-medium leading-tight">{milestone.label}</p>
              </div>
            );
          })}
        </div>
        {progress >= 100 && (
          <p className="flex items-center gap-2 rounded-md bg-amber-500/10 p-2 text-sm text-amber-700 dark:text-amber-300">
            <Trophy className="h-4 w-4 shrink-0" /> <Sparkles className="h-4 w-4 shrink-0" /> Annual reading goal complete!
          </p>
        )}
        <ReadingGoalDialog />
      </CardContent>
    </Card>
  );
}
