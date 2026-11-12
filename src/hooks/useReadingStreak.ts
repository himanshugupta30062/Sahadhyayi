import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/authHelpers';

export interface ReadingStreak {
  current: number;
  best: number;
  daysThisWeek: number;
  activeDays: string[];
  lastActiveAt: string | null;
}

const emptyStreak: ReadingStreak = {
  current: 0,
  best: 0,
  daysThisWeek: 0,
  activeDays: [],
  lastActiveAt: null,
};

const dayKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const parseDayKey = (key: string): Date => {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const computeStreak = (activityDates: string[], lastActiveAt: string | null): ReadingStreak => {
  const daySet = new Set(activityDates);
  if (daySet.size === 0) return emptyStreak;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = dayKey(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let current = 0;
  const cursor = new Date(daySet.has(todayKey) ? today : yesterday);
  while (daySet.has(dayKey(cursor))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const sortedDays = [...daySet].sort();
  let best = 1;
  let run = 1;
  for (let index = 1; index < sortedDays.length; index += 1) {
    const previous = parseDayKey(sortedDays[index - 1]);
    const next = parseDayKey(sortedDays[index]);
    const difference = Math.round((next.getTime() - previous.getTime()) / 86400000);
    if (difference === 1) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }

  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 6);
  const daysThisWeek = sortedDays.filter((key) => parseDayKey(key) >= weekStart).length;
  const activeDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (6 - index));
    return dayKey(date);
  }).filter((key) => daySet.has(key));

  return { current, best: Math.max(best, current), daysThisWeek, activeDays, lastActiveAt };
};

export const useReadingStreak = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['reading-streak', user?.id],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<ReadingStreak> => {
      if (!user) return emptyStreak;

      const since = new Date();
      since.setDate(since.getDate() - 365);
      const { data, error } = await supabase
        .from('reading_activity_days')
        .select('activity_date,last_activity_at')
        .eq('user_id', user.id)
        .gte('activity_date', dayKey(since))
        .order('activity_date', { ascending: false })
        .limit(1000);

      if (error) throw error;
      const rows = data ?? [];
      const dates = rows.map((row) => String(row.activity_date));
      const lastActiveAt = rows
        .map((row) => row.last_activity_at as string | null)
        .filter((value): value is string => Boolean(value))
        .sort((a, b) => b.localeCompare(a))[0] ?? null;
      return computeStreak(dates, lastActiveAt);
    },
  });
};
