import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ChevronLeft, ChevronRight, Flame, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client-universal";
import { useAuth } from "@/contexts/authHelpers";

type ActivityDay = { activity_date: string; source?: string | null };
const milestones = [7, 30, 100, 365];
const monthLabel = (date: Date) => date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
const keyOf = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const shiftDay = (key: string, amount: number) => {
  const date = new Date(`${key}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return keyOf(date);
};
const streakMetrics = (dates: Set<string>) => {
  const sorted = [...dates].sort();
  let longest = 0;
  let run = 0;
  let previous: string | undefined;
  for (const date of sorted) {
    run = previous && shiftDay(previous, 1) === date ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = date;
  }
  const today = keyOf(new Date());
  let cursor = dates.has(today) ? today : shiftDay(today, -1);
  let current = 0;
  while (dates.has(cursor)) {
    current += 1;
    cursor = shiftDay(cursor, -1);
  }
  return { current, longest };
};

export const ReadingActivityCalendar: React.FC = () => {
  const { user } = useAuth();
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const { data: days = [], isLoading } = useQuery({
    queryKey: ["reading-activity-days", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("reading_activity_days").select("activity_date,source").eq("user_id", user!.id).order("activity_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ActivityDay[];
    },
  });
  const activeDates = useMemo(() => new Set(days.map((day) => day.activity_date)), [days]);
  const streaks = useMemo(() => streakMetrics(activeDates), [activeDates]);
  const nextMilestone = milestones.find((value) => value > streaks.current) ?? null;
  const milestoneBase = milestones.filter((value) => value <= streaks.current).at(-1) ?? 0;
  const milestoneProgress = nextMilestone ? Math.min(100, ((streaks.current - milestoneBase) / (nextMilestone - milestoneBase)) * 100) : 100;
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (firstDay.getDay() + 6) % 7;
  const totalDays = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((offset + totalDays) / 7) * 7 }, (_, i) => {
    const day = i - offset + 1;
    return day > 0 && day <= totalDays ? new Date(month.getFullYear(), month.getMonth(), day) : null;
  });
  const monthCount = cells.reduce((count, date) => count + (date && activeDates.has(keyOf(date)) ? 1 : 0), 0);

  return (
    <Card className="border-border/70">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base"><CalendarDays className="h-4 w-4 text-[hsl(var(--brand-primary))]" /> Reading activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-muted/50 px-3 py-2">
            <span className="flex items-center gap-2 text-xs text-muted-foreground"><Flame className="h-4 w-4 text-orange-500" /> Current streak</span>
            <p className="mt-1 text-lg font-semibold">{isLoading ? "…" : `${streaks.current} ${streaks.current === 1 ? "day" : "days"}`}</p>
          </div>
          <div className="rounded-lg bg-muted/50 px-3 py-2">
            <span className="flex items-center gap-2 text-xs text-muted-foreground"><Trophy className="h-4 w-4 text-amber-500" /> Longest streak</span>
            <p className="mt-1 text-lg font-semibold">{isLoading ? "…" : `${streaks.longest} ${streaks.longest === 1 ? "day" : "days"}`}</p>
          </div>
        </div>
        {!isLoading && <div className="space-y-1.5 rounded-lg border border-border/60 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-medium">{nextMilestone ? `${nextMilestone}-day streak milestone` : "All streak milestones reached!"}</span>
            <span className="text-muted-foreground">{nextMilestone ? `${streaks.current}/${nextMilestone}` : "🏆"}</span>
          </div>
          <Progress value={milestoneProgress} className="h-1.5" />
          <p className="text-xs text-muted-foreground">{nextMilestone ? `${nextMilestone - streaks.current} more ${nextMilestone - streaks.current === 1 ? "day" : "days"} to your next milestone` : "You have completed the 7, 30, 100 and 365-day streak milestones."}</p>
        </div>}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm font-medium">{monthLabel(month)}</span>
          <Button variant="ghost" size="icon" aria-label="Next month" disabled={month.getFullYear() === new Date().getFullYear() && month.getMonth() >= new Date().getMonth()} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight className="h-4 w-4" /></Button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => <span key={i} className="py-1 text-xs text-muted-foreground">{day}</span>)}
          {cells.map((date, i) => {
            const active = !!date && activeDates.has(keyOf(date));
            const isToday = !!date && keyOf(date) === keyOf(new Date());
            return <div key={i} aria-label={date ? `${keyOf(date)}${active ? ", reading activity" : ""}` : undefined} className={`relative flex h-9 items-center justify-center rounded-md text-xs ${active ? "bg-[hsl(var(--brand-primary)/0.16)] font-semibold text-foreground" : "text-muted-foreground"} ${isToday ? "ring-1 ring-[hsl(var(--brand-primary))]" : ""}`}>
              {date?.getDate() ?? ""}
              {active && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[hsl(var(--brand-primary))]" />}
            </div>;
          })}
        </div>
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{isLoading ? "Loading activity…" : `${monthCount} active ${monthCount === 1 ? "day" : "days"} this month`}</span>
          <span>● Reading day</span>
        </div>
        <p className="text-xs text-muted-foreground">Activity is recorded when you save reading progress or complete a chapter. Read a little every day to build your streak.</p>
      </CardContent>
    </Card>
  );
};
export default ReadingActivityCalendar;
