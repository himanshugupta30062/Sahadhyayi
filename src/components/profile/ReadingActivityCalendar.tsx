import React, { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useReadingProgress } from "@/hooks/useReadingProgress";

const monthLabel = (date: Date) => date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
const keyOf = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export const ReadingActivityCalendar: React.FC = () => {
  const { data: progress = [], isLoading } = useReadingProgress();
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const activity = useMemo(() => {
    const dates = new Map<string, { started: number; completed: number }>();
    progress.forEach((book) => {
      if (book.started_at) {
        const key = keyOf(new Date(book.started_at));
        const item = dates.get(key) ?? { started: 0, completed: 0 };
        item.started += 1;
        dates.set(key, item);
      }
      if (book.completed_at) {
        const key = keyOf(new Date(book.completed_at));
        const item = dates.get(key) ?? { started: 0, completed: 0 };
        item.completed += 1;
        dates.set(key, item);
      }
    });
    return dates;
  }, [progress]);

  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (firstDay.getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((offset + days) / 7) * 7 }, (_, i) => {
    const day = i - offset + 1;
    return day > 0 && day <= days ? new Date(month.getFullYear(), month.getMonth(), day) : null;
  });
  const monthEvents = cells.reduce((count, date) => count + (date ? (activity.get(keyOf(date))?.started ?? 0) + (activity.get(keyOf(date))?.completed ?? 0) : 0), 0);

  return (
    <Card className="border-border/70">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base"><CalendarDays className="h-4 w-4 text-[hsl(var(--brand-primary))]" /> Reading activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm font-medium">{monthLabel(month)}</span>
          <Button variant="ghost" size="icon" aria-label="Next month" disabled={month.getFullYear() === new Date().getFullYear() && month.getMonth() >= new Date().getMonth()} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight className="h-4 w-4" /></Button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => <span key={i} className="py-1 text-xs text-muted-foreground">{day}</span>)}
          {cells.map((date, i) => {
            const event = date ? activity.get(keyOf(date)) : undefined;
            return <div key={i} className={`relative flex h-9 items-center justify-center rounded-md text-xs ${date ? "text-foreground" : ""} ${event ? "bg-[hsl(var(--brand-primary)/0.12)] font-semibold" : "text-muted-foreground"}`}>
              {date?.getDate() ?? ""}
              {event && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[hsl(var(--brand-primary))]" />}
            </div>;
          })}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{isLoading ? "Loading activity…" : `${monthEvents} reading milestones this month`}</span>
          <span className="flex items-center gap-3"><span>● Started</span><span>● Completed</span></span>
        </div>
        <p className="text-xs text-muted-foreground">Milestones are based on the dates you started tracking or completed a book.</p>
      </CardContent>
    </Card>
  );
};

export default ReadingActivityCalendar;
