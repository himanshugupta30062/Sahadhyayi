import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame } from 'lucide-react';
import { useReadingStreak } from '@/hooks/useReadingStreak';

const ReadingStreakCard = () => {
  const { data, isLoading } = useReadingStreak();
  const current = data?.current ?? 0;
  const best = data?.best ?? 0;

  const activeDays = useMemo(() => {
    if (data?.activeDays && data.activeDays.length > 0) {
      return new Set(data.activeDays);
    }
    if (data?.daysThisWeek && data.daysThisWeek > 0) {
      const set = new Set<string>();
      for (let i = 0; i < data.daysThisWeek; i++) {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - i);
        set.add(
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
        );
      }
      return set;
    }
    return new Set<string>();
  }, [data?.activeDays, data?.daysThisWeek]);

  // Build last-7-day dots: today is index 6
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastActive = data?.lastActiveAt ? new Date(data.lastActiveAt) : null;
  const activeToday = !!lastActive && lastActive >= today;

  return (
    <Card className="border-border overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle as="h2" className="text-base font-semibold flex items-center gap-2">
          <Flame className={`w-4 h-4 ${current > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
          Reading Streak
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-foreground">{isLoading ? '—' : current}</span>
          <span className="text-sm text-muted-foreground">
            {current === 1 ? 'day in a row' : 'days in a row'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-1">
          {Array.from({ length: 7 }, (_, idx) => {
            const date = new Date();
            date.setHours(0, 0, 0, 0);
            date.setDate(date.getDate() - (6 - idx));
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            const label = date.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 1);
            const filled = activeDays.has(key);
            return (
              <div key={`${label}-${idx}`} className="flex flex-col items-center gap-1">
                <div
                  className={`w-6 h-6 rounded-full text-[10px] flex items-center justify-center ${
                    filled
                      ? 'bg-orange-500/15 text-orange-600 border border-orange-500/40'
                      : 'bg-muted text-muted-foreground/60'
                  }`}
                >
                  {filled ? '✓' : ''}
                </div>
                <span className="text-[10px] text-muted-foreground">{label}</span>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between text-xs text-muted-foreground pt-1 border-t border-border">
          <span>Best: <span className="font-medium text-foreground">{best}</span></span>
          <span>{activeToday ? 'Active today' : 'Read today to keep it alive'}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReadingStreakCard;
