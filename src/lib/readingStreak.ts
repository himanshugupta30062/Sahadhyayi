export interface ReadingStreak {
  current: number;
  best: number;
  daysThisWeek: number;
  activeDays: string[];
  lastActiveAt: string | null;
  cutoverDate?: string;
  hasLegacyFallback?: boolean;
}

export const READING_ACTIVITY_CUTOVER_DATE = '2026-11-12';

export const emptyStreak: ReadingStreak = {
  current: 0,
  best: 0,
  daysThisWeek: 0,
  activeDays: [],
  lastActiveAt: null,
  cutoverDate: READING_ACTIVITY_CUTOVER_DATE,
  hasLegacyFallback: false,
};

/**
 * Returns a `YYYY-MM-DD` string for the given Date in the specified timezone
 * (or system local time if timezone is omitted or invalid).
 */
export const localDayKey = (date: Date, timezone?: string): string => {
  if (timezone) {
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
      // Fallback to local time below
    }
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

/**
 * Shifts a `YYYY-MM-DD` day key by a given number of days in UTC,
 * completely avoiding daylight savings time (DST) shifts.
 */
export const shiftDayKey = (key: string, days: number): string => {
  const [year, month, day] = key.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
};

export interface MergeActivityOptions {
  cutoverDate?: string;
  timezone?: string;
}

/**
 * Merges durable activity days with legacy timestamps.
 *
 * Rules:
 * - Durable `reading_activity_days` are always authoritative.
 * - Legacy progress timestamps are ONLY accepted strictly before the cutover date (`< cutoverDate`).
 * - Post-cutover activity MUST be backed by durable `reading_activity_days`.
 * - Deduplicates repeated timestamps within the same local calendar day.
 */
export const mergeLegacyActivityDates = (
  durableDates: string[],
  legacyTimestamps: string[],
  options?: MergeActivityOptions,
): { mergedDates: string[]; hasLegacyFallback: boolean } => {
  const cutoverDate = options?.cutoverDate ?? READING_ACTIVITY_CUTOVER_DATE;
  const timezone = options?.timezone ?? 'UTC';

  const daySet = new Set(durableDates);
  let hasLegacyFallback = false;

  for (const timestamp of legacyTimestamps) {
    if (!timestamp) continue;
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) continue;

    const dayKey = localDayKey(date, timezone);
    if (dayKey < cutoverDate && !daySet.has(dayKey)) {
      daySet.add(dayKey);
      hasLegacyFallback = true;
    }
  }

  return {
    mergedDates: Array.from(daySet).sort(),
    hasLegacyFallback,
  };
};

/**
 * Computes reading streak metrics from unique activity calendar days.
 *
 * Acceptance guarantees:
 * - Repeated updates in one day count as one day.
 * - Non-consecutive days mark only those calendar dates (gaps break current streak).
 * - Best streak is not limited to an arbitrary 365-day window.
 * - Timezone-aware day boundaries for today, yesterday, and week window.
 */
export const computeReadingStreak = (
  activityDates: string[],
  lastActiveAt: string | null,
  now = new Date(),
  timezone?: string,
): ReadingStreak => {
  const daySet = new Set(activityDates);
  if (daySet.size === 0) {
    return {
      ...emptyStreak,
      lastActiveAt,
    };
  }

  const todayKey = localDayKey(now, timezone);
  const yesterdayKey = shiftDayKey(todayKey, -1);

  // 1. Current streak: walk backwards from today (or yesterday if inactive today)
  let current = 0;
  let cursor = daySet.has(todayKey) ? todayKey : yesterdayKey;
  while (daySet.has(cursor)) {
    current += 1;
    cursor = shiftDayKey(cursor, -1);
  }

  // 2. Best streak: scan sorted unique days for longest consecutive sequence (lifetime, no 365d cap)
  const sortedDays = Array.from(daySet).sort();
  let best = 1;
  let run = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    if (shiftDayKey(sortedDays[i - 1], 1) === sortedDays[i]) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }
  best = Math.max(best, current);

  // 3. Rolling 7-day window: [today - 6 days ... today]
  const weekStartKey = shiftDayKey(todayKey, -6);
  const daysThisWeek = sortedDays.filter((key) => key >= weekStartKey && key <= todayKey).length;
  const activeDays = Array.from({ length: 7 }, (_, i) => shiftDayKey(weekStartKey, i)).filter(
    (key) => daySet.has(key),
  );

  return {
    current,
    best,
    daysThisWeek,
    activeDays,
    lastActiveAt,
    cutoverDate: READING_ACTIVITY_CUTOVER_DATE,
    hasLegacyFallback: false,
  };
};
