import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/authHelpers';
import { computeReadingStreak, emptyStreak, localDayKey } from '@/lib/readingStreak';

export type { ReadingStreak } from '@/lib/readingStreak';

export const useReadingStreak = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['reading-streak', user?.id],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!user) return emptyStreak;
      const since = new Date();
      since.setDate(since.getDate() - 365);
      const { data, error } = await supabase
        .from('reading_activity_days')
        .select('activity_date,last_activity_at')
        .eq('user_id', user.id)
        .gte('activity_date', localDayKey(since))
        .order('activity_date', { ascending: false })
        .limit(1000);
      if (error) throw error;
      const rows = data ?? [];
      const dates = rows.map((row) => String(row.activity_date));
      const lastActiveAt = rows
        .map((row) => row.last_activity_at as string | null)
        .filter((value): value is string => Boolean(value))
        .sort((a, b) => b.localeCompare(a))[0] ?? null;
      return computeReadingStreak(dates, lastActiveAt);
    },
  });
};
