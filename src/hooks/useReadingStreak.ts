import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/authHelpers';
import {
  computeReadingStreak,
  emptyStreak,
  mergeLegacyActivityDates,
  READING_ACTIVITY_CUTOVER_DATE,
  type ReadingStreak,
} from '@/lib/readingStreak';

export type { ReadingStreak } from '@/lib/readingStreak';

export const useReadingStreak = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['reading-streak', user?.id],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<ReadingStreak> => {
      if (!user) return emptyStreak;

      const timezone =
        typeof Intl !== 'undefined'
          ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
          : 'UTC';

      // 1. Fetch durable activity days without an arbitrary 365-day query limit
      const { data: durableRows, error: durableError } = await supabase
        .from('reading_activity_days')
        .select('activity_date,last_activity_at')
        .eq('user_id', user.id)
        .order('activity_date', { ascending: false });

      if (durableError) throw durableError;

      const durableDates = (durableRows ?? []).map((row) => String(row.activity_date));
      let lastActiveAt =
        (durableRows ?? [])
          .map((row) => row.last_activity_at as string | null)
          .filter((v): v is string => Boolean(v))
          .sort((a, b) => b.localeCompare(a))[0] ?? null;

      // 2. Fallback to legacy progress timestamps strictly before cutover date
      let mergedDates = durableDates;
      let hasLegacyFallback = false;

      try {
        const { data: legacyRows, error: legacyError } = await supabase
          .from('detailed_reading_progress')
          .select('updated_at')
          .eq('user_id', user.id)
          .lt('updated_at', `${READING_ACTIVITY_CUTOVER_DATE}T00:00:00.000Z`)
          .order('updated_at', { ascending: false });

        if (!legacyError && legacyRows && legacyRows.length > 0) {
          const legacyTimestamps = legacyRows
            .map((row) => row.updated_at as string | null)
            .filter((v): v is string => Boolean(v));

          const merged = mergeLegacyActivityDates(durableDates, legacyTimestamps, {
            cutoverDate: READING_ACTIVITY_CUTOVER_DATE,
            timezone,
          });
          mergedDates = merged.mergedDates;
          hasLegacyFallback = merged.hasLegacyFallback;

          if (!lastActiveAt && legacyTimestamps.length > 0) {
            lastActiveAt = [...legacyTimestamps].sort((a, b) => b.localeCompare(a))[0] ?? null;
          }
        }
      } catch (err) {
        // Non-blocking fallback failure: durable records remain authoritative
        console.warn('[reading-streak] Legacy fallback query failed:', err);
      }

      const streak = computeReadingStreak(mergedDates, lastActiveAt, new Date(), timezone);
      return {
        ...streak,
        cutoverDate: READING_ACTIVITY_CUTOVER_DATE,
        hasLegacyFallback,
      };
    },
  });
};
