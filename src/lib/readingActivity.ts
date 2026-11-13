import { supabase } from '@/integrations/supabase/client-universal';

export type ReadingActivitySource =
  | 'progress_save'
  | 'chapter_complete'
  | 'reading_log'
  | 'bookshelf_status'
  | 'legacy_backfill';

export interface RecordReadingActivityOptions {
  bookId?: string | null;
  timezone?: string;
  timestamp?: Date;
  force?: boolean;
}

// In-memory debounce cache to avoid duplicate network calls when rapid actions happen on the same day.
// Map key: `${userId}:${activityDate}` -> timestamp of last network record
const activityDebounceMap = new Map<string, number>();
export const DEBOUNCE_WINDOW_MS = 10_000;

export const resetActivityDebounceCache = (): void => {
  activityDebounceMap.clear();
};

export const getLocalActivityDate = (date: Date, timezone = 'UTC'): string => {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return `${values.year}-${values.month}-${values.day}`;
  } catch {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
};

export const resolveTimezone = (customTimezone?: string): string => {
  if (customTimezone) return customTimezone;
  try {
    return new Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

/**
 * Records one activity per user's local calendar day. This is append-oriented
 * and deduplicated both in-memory (debounced) and at the database primary key level.
 * It is intentionally best-effort: activity telemetry must not turn a successful
 * progress save into a failed reader action.
 */
export const recordReadingActivity = async (
  userId: string,
  source: ReadingActivitySource,
  options?: RecordReadingActivityOptions | string,
): Promise<void> => {
  if (!userId) return;

  const resolvedOptions: RecordReadingActivityOptions =
    typeof options === 'string' ? { bookId: options } : (options ?? {});

  const now = resolvedOptions.timestamp ?? new Date();
  const timezone = resolveTimezone(resolvedOptions.timezone);
  const activityDate = getLocalActivityDate(now, timezone);

  const debounceKey = `${userId}:${activityDate}`;
  const lastRecorded = activityDebounceMap.get(debounceKey);
  const currentTime = Date.now();

  if (!resolvedOptions.force && lastRecorded && currentTime - lastRecorded < DEBOUNCE_WINDOW_MS) {
    return;
  }

  try {
    const { error } = await supabase.from('reading_activity_days').upsert(
      {
        user_id: userId,
        activity_date: activityDate,
        timezone,
        last_activity_at: now.toISOString(),
        source,
        book_id: resolvedOptions.bookId ?? null,
      },
      {
        onConflict: 'user_id,activity_date',
        ignoreDuplicates: false,
      },
    );

    if (error) {
      console.warn('[reading-activity] Daily activity sync failed:', error);
    } else {
      activityDebounceMap.set(debounceKey, currentTime);
    }
  } catch (error) {
    console.warn('[reading-activity] Daily activity sync failed:', error);
  }
};
