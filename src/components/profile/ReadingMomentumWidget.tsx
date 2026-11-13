import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Target, BookCheck, TrendingUp, Calendar } from 'lucide-react';
import { BookshelfItem } from '@/hooks/useUserBookshelf';
import { ReadingLog } from '@/hooks/useReadingLogs';
import { Link } from 'react-router-dom';

interface ReadingMomentumWidgetProps {
  currentStreakDays: number;
  completedThisYear: number;
  annualTarget: number;
  recentCompleted: BookshelfItem[];
  readingLogs: ReadingLog[];
}

export const ReadingMomentumWidget: React.FC<ReadingMomentumWidgetProps> = ({
  currentStreakDays,
  completedThisYear,
  annualTarget,
  recentCompleted,
  readingLogs,
}) => {
  // Last 7 days active dots
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toDateString();
    const hasLog = readingLogs.some(
      (log) => new Date(log.logged_at).toDateString() === dateStr
    );
    const dayName = d.toLocaleDateString(undefined, { weekday: 'narrow' });
    return { dayName, hasLog, isToday: i === 6 };
  });

  const activeDaysThisWeek = last7Days.filter((d) => d.hasLog).length;
  const goalPercent = Math.min(
    100,
    Math.round((completedThisYear / Math.max(1, annualTarget)) * 100)
  );

  return (
    <Card className="border-border bg-gradient-to-br from-card via-primary/5 to-transparent shadow-xs">
      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Reading Momentum</h3>
              <p className="text-[11px] text-muted-foreground">Habit rhythm and yearly progress</p>
            </div>
          </div>
          <Link
            to="/stats"
            className="text-xs font-medium text-primary hover:underline"
          >
            Full Analytics →
          </Link>
        </div>

        {/* Momentum Metric Pills */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-border bg-card p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-amber-500 mb-0.5">
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span className="text-xs font-bold text-foreground">{currentStreakDays}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">Day Streak</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-primary mb-0.5">
              <Calendar className="w-3.5 h-3.5" />
              <span className="text-xs font-bold text-foreground">{activeDaysThisWeek}/7</span>
            </div>
            <p className="text-[10px] text-muted-foreground">Days This Week</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-emerald-500 mb-0.5">
              <Target className="w-3.5 h-3.5" />
              <span className="text-xs font-bold text-foreground">{goalPercent}%</span>
            </div>
            <p className="text-[10px] text-muted-foreground">Goal Progress</p>
          </div>
        </div>

        {/* 7-day sparkline dots */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border/60">
          <span className="text-[11px] font-medium text-muted-foreground">Past 7 Days:</span>
          <div className="flex items-center gap-2">
            {last7Days.map((day, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <span className="text-[9px] text-muted-foreground">{day.dayName}</span>
                <span
                  title={day.hasLog ? 'Reading session logged' : 'No activity logged'}
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all ${
                    day.hasLog
                      ? 'bg-primary ring-2 ring-primary/20'
                      : 'bg-muted border border-border'
                  }`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Goal bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookCheck className="w-3 h-3 text-emerald-500" />
              Annual Target
            </span>
            <span className="font-semibold text-foreground">
              {completedThisYear} / {annualTarget} books
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${goalPercent}%` }}
            />
          </div>
        </div>

        {/* Recent finished books row */}
        {recentCompleted.length > 0 && (
          <div className="pt-2 border-t border-border/50">
            <p className="text-[11px] font-medium text-muted-foreground mb-2">
              Recently Completed:
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {recentCompleted.slice(0, 4).map((item) => (
                <Link
                  key={item.id}
                  to={`/book/${item.book_id}`}
                  className="shrink-0 w-12 group"
                  title={item.books_library?.title || 'Book'}
                >
                  <div className="aspect-[2/3] rounded bg-muted overflow-hidden border border-border shadow-2xs group-hover:border-primary transition-colors">
                    {item.books_library?.cover_image_url ? (
                      <img
                        src={item.books_library.cover_image_url}
                        alt={item.books_library.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary p-1 text-center">
                        {item.books_library?.title?.slice(0, 10)}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReadingMomentumWidget;
