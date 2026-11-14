import React, { useMemo, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Flame,
  Trophy,
  BookOpen,
  Clock,
  CheckCircle2,
  Bookmark,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client-universal";
import { useAuth } from "@/contexts/authHelpers";
import { useReadingLogs } from "@/hooks/useReadingLogs";
import { useUserBookshelf } from "@/hooks/useUserBookshelf";

type ActivityDay = { activity_date: string; source?: string | null };
const milestones = [7, 30, 100, 365];

const monthLabel = (date: Date) =>
  date.toLocaleDateString(undefined, { month: "long", year: "numeric" });

const keyOf = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;

const shiftDay = (key: string, amount: number) => {
  const date = new Date(`${key}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return keyOf(date);
};

const streakMetrics = (dates: Set<string>) => {
  const sorted = [...dates].sort((a, b) => a.localeCompare(b));
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
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Fetch logged activity days
  const { data: days = [], isLoading: activityLoading, error: activityError } = useQuery({
    queryKey: ["reading-activity-days", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reading_activity_days")
        .select("activity_date,source")
        .eq("user_id", user!.id)
        .order("activity_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ActivityDay[];
    },
  });

  // Fetch detailed reading logs and bookshelf to enrich day details
  const { data: logs = [], isLoading: logsLoading } = useReadingLogs();
  const { data: shelf = [] } = useUserBookshelf();

  // Map book IDs to titles
  const bookTitlesById = useMemo(() => {
    const map = new Map<string, string>();
    shelf.forEach((item) => {
      if (item.book_id && item.books_library?.title) {
        map.set(item.book_id, item.books_library.title);
      }
    });
    return map;
  }, [shelf]);

  // Aggregate logs per date
  const dayLogsMap = useMemo(() => {
    const map: Record<
      string,
      {
        sessions: number;
        pages: number;
        minutes: number;
        books: string[];
        notes: string[];
      }
    > = {};

    for (const log of logs) {
      if (!log.logged_at) continue;
      const key = keyOf(new Date(log.logged_at));
      if (!map[key]) {
        map[key] = { sessions: 0, pages: 0, minutes: 0, books: [], notes: [] };
      }
      map[key].sessions += 1;
      if (log.pages_read) map[key].pages += log.pages_read;
      if (log.minutes_read) map[key].minutes += log.minutes_read;
      if (log.book_id) {
        const title = bookTitlesById.get(log.book_id);
        if (title && !map[key].books.includes(title)) {
          map[key].books.push(title);
        }
      }
      if (log.journal_note && !map[key].notes.includes(log.journal_note)) {
        map[key].notes.push(log.journal_note);
      }
    }
    return map;
  }, [logs, bookTitlesById]);

  // Combined set of all active reading dates
  const activeDates = useMemo(() => {
    const set = new Set(days.map((day) => day.activity_date));
    Object.keys(dayLogsMap).forEach((d) => set.add(d));
    return set;
  }, [days, dayLogsMap]);

  const selectedActivity = days.find((day) => day.activity_date === selectedDay);
  const selectedLogData = selectedDay ? dayLogsMap[selectedDay] : null;

  const streaks = useMemo(() => streakMetrics(activeDates), [activeDates]);
  const nextMilestone = milestones.find((value) => value > streaks.current) ?? null;
  const milestoneBase = milestones.filter((value) => value <= streaks.current).at(-1) ?? 0;
  const milestoneProgress = nextMilestone
    ? Math.min(
        100,
        ((streaks.current - milestoneBase) / (nextMilestone - milestoneBase)) * 100
      )
    : 100;

  // Calendar matrix calculation
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (firstDay.getDay() + 6) % 7; // Monday-first
  const totalDays = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from(
    { length: Math.ceil((offset + totalDays) / 7) * 7 },
    (_, i) => {
      const day = i - offset + 1;
      return day > 0 && day <= totalDays
        ? new Date(month.getFullYear(), month.getMonth(), day)
        : null;
    }
  );

  const monthCount = cells.reduce(
    (count, date) => count + (date && activeDates.has(keyOf(date)) ? 1 : 0),
    0
  );

  const todayKey = keyOf(new Date());
  const recentDays = Array.from({ length: 30 }, (_, index) => shiftDay(todayKey, -index));
  const last30Count = recentDays.filter((date) => activeDates.has(date)).length;
  const yearPrefix = `${new Date().getFullYear()}-`;
  const yearCount = [...activeDates].filter((date) => date.startsWith(yearPrefix)).length;
  const consistency = Math.round((last30Count / 30) * 100);

  const monthlyTrend = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(new Date().getFullYear(), new Date().getMonth() - 11 + index, 1);
    const count = [...activeDates].filter((key) =>
      key.startsWith(
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-`
      )
    ).length;
    return {
      label: date.toLocaleDateString(undefined, { month: "short" }),
      count,
    };
  });
  const trendMax = Math.max(1, ...monthlyTrend.map((item) => item.count));

  // Keyboard navigation within the day grid
  const handleCellKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    let targetIndex: number | null = null;
    if (e.key === "ArrowLeft") {
      targetIndex = index > 0 ? index - 1 : null;
    } else if (e.key === "ArrowRight") {
      targetIndex = index < cells.length - 1 ? index + 1 : null;
    } else if (e.key === "ArrowUp") {
      targetIndex = index - 7 >= 0 ? index - 7 : null;
    } else if (e.key === "ArrowDown") {
      targetIndex = index + 7 < cells.length ? index + 7 : null;
    }

    if (targetIndex !== null && cellRefs.current[targetIndex]) {
      e.preventDefault();
      cellRefs.current[targetIndex]?.focus();
    }
  };

  const isLoading = activityLoading || logsLoading;

  return (
    <Card className="border-border/70">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays className="h-4 w-4 text-[hsl(var(--brand-primary))]" /> Reading activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Streak Overview Cards */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-muted/50 px-3 py-2">
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <Flame className="h-4 w-4 text-orange-500" /> Current streak
            </span>
            <p className="mt-1 text-lg font-semibold">
              {isLoading ? "…" : `${streaks.current} ${streaks.current === 1 ? "day" : "days"}`}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 px-3 py-2">
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <Trophy className="h-4 w-4 text-amber-500" /> Longest streak
            </span>
            <p className="mt-1 text-lg font-semibold">
              {isLoading ? "…" : `${streaks.longest} ${streaks.longest === 1 ? "day" : "days"}`}
            </p>
          </div>
        </div>

        {/* Milestone Progress Banner */}
        {!isLoading && (
          <div className="space-y-1.5 rounded-lg border border-border/60 px-3 py-2.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-medium">
                {nextMilestone
                  ? `${nextMilestone}-day streak milestone`
                  : "All streak milestones reached!"}
              </span>
              <span className="text-muted-foreground">
                {nextMilestone ? `${streaks.current}/${nextMilestone}` : "🏆"}
              </span>
            </div>
            <Progress value={milestoneProgress} className="h-1.5" />
            <p className="text-xs text-muted-foreground">
              {nextMilestone
                ? `${nextMilestone - streaks.current} more ${
                    nextMilestone - streaks.current === 1 ? "day" : "days"
                  } to your next milestone`
                : "You have completed the 7, 30, 100, and 365-day streak milestones."}
            </p>
          </div>
        )}

        {/* 30-Day and Yearly Metrics */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-lg bg-muted/50 p-2">
            <p className="text-muted-foreground">Last 30 days</p>
            <p className="font-semibold">{last30Count}/30</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2">
            <p className="text-muted-foreground">Consistency</p>
            <p className="font-semibold">{consistency}%</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2">
            <p className="text-muted-foreground">This year</p>
            <p className="font-semibold">{yearCount} days</p>
          </div>
        </div>

        {/* 12-Month Mini Spark Trend */}
        <div className="rounded-lg border border-border/60 p-3">
          <p className="mb-2 text-xs font-medium">Monthly activity · last 12 months</p>
          <div className="grid grid-cols-12 items-end gap-1" style={{ height: 72 }}>
            {monthlyTrend.map((item, index) => (
              <div key={index} className="flex h-full flex-col justify-end gap-1">
                <div
                  title={`${item.label}: ${item.count} days`}
                  className="min-h-1 rounded-t bg-[hsl(var(--brand-primary))]"
                  style={{ height: `${Math.max(4, (item.count / trendMax) * 56)}px` }}
                />
                <span className="text-center text-[9px] text-muted-foreground">
                  {item.label.slice(0, 1)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Month Switcher Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Previous month"
            onClick={() =>
              setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
            }
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">{monthLabel(month)}</span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Next month"
            disabled={
              month.getFullYear() === new Date().getFullYear() &&
              month.getMonth() >= new Date().getMonth()
            }
            onClick={() =>
              setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
            }
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Calendar Day Grid */}
        <div
          role="grid"
          aria-label={`Reading calendar for ${monthLabel(month)}`}
          className="grid grid-cols-7 gap-1 text-center"
        >
          {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
            <span key={i} className="py-1 text-xs text-muted-foreground font-medium">
              {day}
            </span>
          ))}
          {cells.map((date, i) => {
            const dateKey = date ? keyOf(date) : "";
            const active = !!date && activeDates.has(dateKey);
            const isToday = !!date && dateKey === todayKey;
            const dateLogs = date ? dayLogsMap[dateKey] : null;

            const ariaLabel = date
              ? `${dateKey}${
                  active
                    ? `, reading day${
                        dateLogs
                          ? `: ${dateLogs.sessions} sessions, ${dateLogs.pages} pages`
                          : ""
                      }`
                    : ", no activity recorded"
                }`
              : undefined;

            const hoverTitle = date
              ? `${dateKey}${
                  dateLogs && (dateLogs.pages > 0 || dateLogs.minutes > 0)
                    ? ` · ${dateLogs.pages} pgs, ${dateLogs.minutes} mins`
                    : active
                    ? " · Reading day"
                    : " · No activity"
                }`
              : undefined;

            return (
              <button
                ref={(el) => {
                  cellRefs.current[i] = el;
                }}
                type="button"
                key={i}
                disabled={!date}
                onClick={() => date && setSelectedDay(dateKey)}
                onKeyDown={(e) => handleCellKeyDown(e, i)}
                aria-pressed={!!date && selectedDay === dateKey}
                aria-label={ariaLabel}
                title={hoverTitle}
                className={`relative flex h-9 w-full items-center justify-center rounded-md text-xs transition-colors ${
                  active
                    ? "bg-[hsl(var(--brand-primary)/0.16)] font-semibold text-foreground hover:bg-[hsl(var(--brand-primary)/0.24)]"
                    : "text-muted-foreground hover:bg-muted/40"
                } ${isToday ? "ring-1 ring-[hsl(var(--brand-primary))]" : ""} ${
                  selectedDay === dateKey
                    ? "outline outline-2 outline-[hsl(var(--brand-primary))] z-10"
                    : ""
                }`}
              >
                {date?.getDate() ?? ""}
                {active && (
                  <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[hsl(var(--brand-primary))]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Day Details Panel */}
        {selectedDay && (
          <div
            className="rounded-xl border border-border/80 bg-muted/40 p-3 space-y-2 text-xs animate-in fade-in-50 duration-200"
            aria-live="polite"
          >
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-primary" />
                {new Date(`${selectedDay}T12:00:00`).toLocaleDateString(undefined, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground underline"
                onClick={() => setSelectedDay(null)}
              >
                Clear
              </button>
            </div>

            {selectedLogData || selectedActivity ? (
              <div className="space-y-2 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="gap-1 font-mono text-[11px]">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    {selectedLogData?.sessions
                      ? `${selectedLogData.sessions} ${
                          selectedLogData.sessions === 1 ? "session" : "sessions"
                        }`
                      : "Activity logged"}
                  </Badge>

                  {selectedLogData && selectedLogData.pages > 0 && (
                    <Badge variant="outline" className="gap-1 text-[11px]">
                      <BookOpen className="h-3 w-3 text-primary" />
                      {selectedLogData.pages} pages read
                    </Badge>
                  )}

                  {selectedLogData && selectedLogData.minutes > 0 && (
                    <Badge variant="outline" className="gap-1 text-[11px]">
                      <Clock className="h-3 w-3 text-amber-500" />
                      {selectedLogData.minutes} mins
                    </Badge>
                  )}

                  {selectedActivity?.source && (
                    <span className="text-[10px] text-muted-foreground capitalize">
                      Source: {selectedActivity.source.replace(/_/g, " ")}
                    </span>
                  )}
                </div>

                {selectedLogData?.books && selectedLogData.books.length > 0 && (
                  <div className="text-muted-foreground">
                    <span className="font-medium text-foreground">Books: </span>
                    {selectedLogData.books.join(", ")}
                  </div>
                )}

                {selectedLogData?.notes && selectedLogData.notes.length > 0 && (
                  <div className="rounded-lg bg-background/60 p-2 border border-border/50 italic text-muted-foreground">
                    “{selectedLogData.notes[0]}”
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground pt-1">
                No reading activity recorded for this date. Read a few pages to add to your streak!
              </p>
            )}
          </div>
        )}

        {/* Footer info */}
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {isLoading
              ? "Loading activity…"
              : `${monthCount} active ${monthCount === 1 ? "day" : "days"} this month`}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--brand-primary))]" />
            Reading day
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Activity is recorded when you save reading progress or complete a reading session. Read
          every day to build your streak.
        </p>
      </CardContent>
    </Card>
  );
};

export default ReadingActivityCalendar;
