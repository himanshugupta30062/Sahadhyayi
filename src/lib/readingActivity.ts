import { supabase } from '@/integrations/supabase/client-universal';

export type ReadingActivitySource = 'progress_save' | 'chapter_complete';

const getLocalActivityDate = (date: Date, timezone: string): string => {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
};

/**
 * Records one activity per user's local calendar day. This is intentionally
 * best-effort: activity telemetry must not turn a successful progress save
 * into a failed reader action.
 */
export const recordReadingActivity = async (
  userId: string,
  source: ReadingActivitySource,
): Promise<void> => {
  const now = new Date();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  try {
    const activityDate = getLocalActivityDate(now, timezone);
    const activityDb = supabase as unknown as {
      from: (table: string) => {
        upsert: (values: unknown, options: unknown) => Promise<{ error: unknown | null }>;
      };
    };
    const { error } = await activityDb.from('reading_activity_days').upsert(
      {
        user_id: userId,
        activity_date: activityDate,
        timezone,
        last_activity_at: now.toISOString(),
        source,
      },
      {
        onConflict: 'user_id,activity_date',
        ignoreDuplicates: false,
      },
    );
    if (error) console.warn('[reading-activity] Daily activity sync failed:', error);
  } catch (error) {
    console.warn('[reading-activity] Daily activity sync failed:', error);
  }
};
