import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/authHelpers';

export interface ReadingStreak {
  current: number;
  best: number;
  daysThisWeek: number;
  lastActiveAt: string | null;
}

const toDayKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

const computeStreak = (timestamps: string[]): ReadingStreak => {
  if (!timestamps.length) {
    return { current: 0, best: 0, daysThisWeek: 0, lastActiveAt: null };
  }

  const daySet = new Set(timestamps.map(toDayKey));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // current streak: walk backwards from today (or yesterday if no activity today)
  let current = 0;
  const cursor = new Date(today);
  if (!daySet.has(`${cursor.getFullYear()}-${cursor.getMonth() + 1}-${cursor.getDate()}`)) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (daySet.has(`${cursor.getFullYear()}-${cursor.getMonth() + 1}-${cursor.getDate()}`)) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  // best streak: scan sorted unique days
  const days = Array.from(daySet)
    .map((k) => {
      const [y, m, d] = k.split('-').map(Number);
      return new Date(y, m - 1, d).getTime();
    })
    .sort((a, b) => a - b);
  let best = 1;
  let run = 1;
  for (let i = 1; i < days.length; i += 1) {
    const diff = Math.round((days[i] - days[i - 1]) / 86400000);
    if (diff === 1) {
      run += 1;
      best = Math.max(best, run);
    } else if (diff > 1) {
      run = 1;
    }
  }
  if (days.length === 0) best = 0;
  best = Math.max(best, current);

  // days active in the last 7 days
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const daysThisWeek = days.filter((t) => t >= weekAgo.getTime()).length;

  const sortedIso = [...timestamps].sort();
  return {
    current,
    best,
    daysThisWeek,
    lastActiveAt: sortedIso[sortedIso.length - 1] ?? null,
  };
};

export const useReadingStreak = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['reading-streak', user?.id],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<ReadingStreak> => {
      if (!user) return { current: 0, best: 0, daysThisWeek: 0, lastActiveAt: null };
      // Pull recent activity timestamps; cap to last 365 days for safety.
      const since = new Date();
      since.setDate(since.getDate() - 365);
      const { data, error } = await supabase
        .from('detailed_reading_progress')
        .select('updated_at')
        .eq('user_id', user.id)
        .gte('updated_at', since.toISOString())
        .order('updated_at', { ascending: false })
        .limit(1000);

      if (error) throw error;
      return computeStreak((data ?? []).map((r) => r.updated_at as string));
    },
  });
};
