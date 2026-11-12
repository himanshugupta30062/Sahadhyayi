export interface ReadingStreak {
  current: number;
  best: number;
  daysThisWeek: number;
  activeDays: string[];
  lastActiveAt: string | null;
}

export const emptyStreak: ReadingStreak = {
  current: 0, best: 0, daysThisWeek: 0, activeDays: [], lastActiveAt: null,
};

export const localDayKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const parseDayKey = (key: string): Date => {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/** Pure calculation; dates are YYYY-MM-DD in the user's local calendar. */
export const computeReadingStreak = (
  activityDates: string[],
  lastActiveAt: string | null,
  now = new Date(),
): ReadingStreak => {
  const daySet = new Set(activityDates);
  if (!daySet.size) return emptyStreak;

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  let current = 0;
  const cursor = new Date(daySet.has(localDayKey(today)) ? today : yesterday);
  while (daySet.has(localDayKey(cursor))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const sortedDays = [...daySet].sort();
  let best = 1;
  let run = 1;
  for (let i = 1; i < sortedDays.length; i += 1) {
    const diff = Math.round((parseDayKey(sortedDays[i]).getTime() - parseDayKey(sortedDays[i - 1]).getTime()) / 86400000);
    run = diff === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }

  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 6);
  const daysThisWeek = sortedDays.filter((key) => parseDayKey(key) >= weekStart).length;
  const activeDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (6 - i));
    return localDayKey(date);
  }).filter((key) => daySet.has(key));

  return { current, best: Math.max(best, current), daysThisWeek, activeDays, lastActiveAt };
};
