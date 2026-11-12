import { describe, expect, it } from 'vitest';
import { computeReadingStreak } from '@/lib/readingStreak';

describe('computeReadingStreak', () => {
  const now = new Date(2026, 10, 12, 15, 30);

  it('returns zero values for no activity', () => {
    expect(computeReadingStreak([], null, now)).toEqual({
      current: 0, best: 0, daysThisWeek: 0, activeDays: [], lastActiveAt: null,
    });
  });

  it('counts today and consecutive previous days as current streak', () => {
    const result = computeReadingStreak(['2026-11-10', '2026-11-11', '2026-11-12'], '2026-11-12T10:00:00Z', now);
    expect(result.current).toBe(3);
    expect(result.best).toBe(3);
    expect(result.activeDays).toEqual(['2026-11-06', '2026-11-10', '2026-11-11', '2026-11-12'].filter((d) => ['2026-11-10','2026-11-11','2026-11-12'].includes(d)));
  });

  it('keeps yesterday streak alive when today has no activity', () => {
    expect(computeReadingStreak(['2026-11-10', '2026-11-11'], null, now).current).toBe(2);
  });

  it('breaks current streak after a missed day but retains best historical run', () => {
    const result = computeReadingStreak(['2026-11-01','2026-11-02','2026-11-03','2026-11-10','2026-11-12'], null, now);
    expect(result.current).toBe(1);
    expect(result.best).toBe(3);
  });

  it('deduplicates multiple activity rows on the same date', () => {
    const result = computeReadingStreak(['2026-11-12','2026-11-12','2026-11-11'], null, now);
    expect(result.current).toBe(2);
    expect(result.daysThisWeek).toBe(2);
  });

  it('counts the rolling seven-day window including today', () => {
    const result = computeReadingStreak(['2026-11-06','2026-11-08','2026-11-12'], null, now);
    expect(result.daysThisWeek).toBe(3);
    expect(result.activeDays).toEqual(['2026-11-06','2026-11-08','2026-11-12']);
  });
});
