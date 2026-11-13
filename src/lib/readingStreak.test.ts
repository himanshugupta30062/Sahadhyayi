import { describe, expect, it } from 'vitest';
import {
  computeReadingStreak,
  emptyStreak,
  localDayKey,
  mergeLegacyActivityDates,
  READING_ACTIVITY_CUTOVER_DATE,
  shiftDayKey,
} from '@/lib/readingStreak';

describe('computeReadingStreak', () => {
  const now = new Date('2026-11-12T15:30:00Z');

  it('returns empty stats without activity', () => {
    expect(computeReadingStreak([], null, now, 'UTC')).toEqual({
      current: 0,
      best: 0,
      daysThisWeek: 0,
      activeDays: [],
      lastActiveAt: null,
      cutoverDate: READING_ACTIVITY_CUTOVER_DATE,
      hasLegacyFallback: false,
    });
  });

  it('counts today and consecutive prior days', () => {
    const result = computeReadingStreak(
      ['2026-11-10', '2026-11-11', '2026-11-12'],
      '2026-11-12T10:00:00Z',
      now,
      'UTC',
    );
    expect(result.current).toBe(3);
    expect(result.best).toBe(3);
    expect(result.activeDays).toEqual(['2026-11-10', '2026-11-11', '2026-11-12']);
    expect(result.lastActiveAt).toBe('2026-11-12T10:00:00Z');
  });

  it('keeps streak alive through yesterday when today is inactive', () => {
    const result = computeReadingStreak(['2026-11-10', '2026-11-11'], null, now, 'UTC');
    expect(result.current).toBe(2);
    expect(result.best).toBe(2);
  });

  it('breaks current streak when yesterday is missed, but retains historic best', () => {
    const result = computeReadingStreak(
      ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-10', '2026-11-12'],
      null,
      now,
      'UTC',
    );
    // Active today (1), but skipped 11th so streak is 1. Best was Nov 1-3 (3).
    expect(result.current).toBe(1);
    expect(result.best).toBe(3);
  });

  it('deduplicates repeated dates: multiple actions in one day count as one day', () => {
    const result = computeReadingStreak(
      ['2026-11-12', '2026-11-12', '2026-11-12', '2026-11-11'],
      null,
      now,
      'UTC',
    );
    expect(result.current).toBe(2);
    expect(result.daysThisWeek).toBe(2);
  });

  it('reading on non-consecutive days marks only those calendar dates', () => {
    // Read on 2026-11-08 and 2026-11-10, skipped 2026-11-09, 2026-11-11, 2026-11-12
    const result = computeReadingStreak(['2026-11-08', '2026-11-10'], null, now, 'UTC');
    expect(result.current).toBe(0);
    expect(result.best).toBe(1);
    expect(result.activeDays).toEqual(['2026-11-08', '2026-11-10']);
  });

  it('best streak is not limited to an arbitrary 365-day window', () => {
    // Generate 400 consecutive active days
    const days: string[] = [];
    let day = '2025-10-09';
    for (let i = 0; i < 400; i++) {
      days.push(day);
      day = shiftDayKey(day, 1);
    }
    // Last day in sequence is 2026-11-12 (today)
    expect(days[days.length - 1]).toBe('2026-11-12');

    const result = computeReadingStreak(days, null, now, 'UTC');
    expect(result.current).toBe(400);
    expect(result.best).toBe(400);
  });

  it('counts rolling seven-day window correctly', () => {
    const result = computeReadingStreak(
      ['2026-11-06', '2026-11-08', '2026-11-12'],
      null,
      now,
      'UTC',
    );
    expect(result.daysThisWeek).toBe(3);
    expect(result.activeDays).toEqual(['2026-11-06', '2026-11-08', '2026-11-12']);
  });

  describe('timezone and day-boundary behavior', () => {
    it('computes correct day key for America/New_York vs Asia/Kolkata at day boundaries', () => {
      // 2026-11-13T01:30:00Z:
      // In UTC: 2026-11-13
      // In America/New_York (UTC-5): 2026-11-12 20:30 -> 2026-11-12
      // In Asia/Kolkata (UTC+5:30): 2026-11-13 07:00 -> 2026-11-13
      const boundaryDate = new Date('2026-11-13T01:30:00Z');

      expect(localDayKey(boundaryDate, 'UTC')).toBe('2026-11-13');
      expect(localDayKey(boundaryDate, 'America/New_York')).toBe('2026-11-12');
      expect(localDayKey(boundaryDate, 'Asia/Kolkata')).toBe('2026-11-13');
    });

    it('calculates streak relative to user local timezone today/yesterday', () => {
      // At 2026-11-13T01:30:00Z:
      // For a New York user, today is 2026-11-12. If they read on 2026-11-12, streak is 1.
      const timestamp = new Date('2026-11-13T01:30:00Z');
      const nyResult = computeReadingStreak(['2026-11-12'], null, timestamp, 'America/New_York');
      expect(nyResult.current).toBe(1);

      // For a Kolkata user, today is 2026-11-13.
      // If they read on 2026-11-12 (their yesterday), streak is still alive (1).
      const kolkataResult = computeReadingStreak(['2026-11-12'], null, timestamp, 'Asia/Kolkata');
      expect(kolkataResult.current).toBe(1);

      // If Kolkata user reads on 2026-11-13 (today), streak is also alive (1 or 2 if both).
      const kolkataResultBoth = computeReadingStreak(
        ['2026-11-12', '2026-11-13'],
        null,
        timestamp,
        'Asia/Kolkata',
      );
      expect(kolkataResultBoth.current).toBe(2);
    });
  });

  describe('shiftDayKey', () => {
    it('correctly shifts across month and year boundaries and leap years without DST issues', () => {
      expect(shiftDayKey('2026-10-31', 1)).toBe('2026-11-01');
      expect(shiftDayKey('2026-11-01', -1)).toBe('2026-10-31');
      expect(shiftDayKey('2026-12-31', 1)).toBe('2027-01-01');
      expect(shiftDayKey('2024-02-28', 1)).toBe('2024-02-29'); // Leap year
      expect(shiftDayKey('2024-02-29', 1)).toBe('2024-03-01');
    });
  });

  describe('mergeLegacyActivityDates', () => {
    it('merges legacy timestamps strictly before cutover date', () => {
      const durableDates = ['2026-11-12', '2026-11-13'];
      const legacyTimestamps = [
        '2026-11-10T14:00:00Z',
        '2026-11-11T16:00:00Z',
      ];

      const { mergedDates, hasLegacyFallback } = mergeLegacyActivityDates(
        durableDates,
        legacyTimestamps,
        { cutoverDate: '2026-11-12', timezone: 'UTC' },
      );

      expect(hasLegacyFallback).toBe(true);
      expect(mergedDates).toEqual(['2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13']);
    });

    it('ignores legacy timestamps on or after cutover date', () => {
      const durableDates = ['2026-11-12'];
      const legacyTimestamps = [
        '2026-11-12T14:00:00Z',
        '2026-11-13T16:00:00Z',
      ];

      const { mergedDates, hasLegacyFallback } = mergeLegacyActivityDates(
        durableDates,
        legacyTimestamps,
        { cutoverDate: '2026-11-12', timezone: 'UTC' },
      );

      // 12th and 13th from legacy are on or after cutover, so they are not merged
      expect(hasLegacyFallback).toBe(false);
      expect(mergedDates).toEqual(['2026-11-12']);
    });

    it('deduplicates multiple legacy updates on the same calendar day', () => {
      const durableDates: string[] = [];
      const legacyTimestamps = [
        '2026-11-05T08:00:00Z',
        '2026-11-05T12:00:00Z',
        '2026-11-05T20:00:00Z',
      ];

      const { mergedDates, hasLegacyFallback } = mergeLegacyActivityDates(
        durableDates,
        legacyTimestamps,
        { cutoverDate: '2026-11-12', timezone: 'UTC' },
      );

      expect(hasLegacyFallback).toBe(true);
      expect(mergedDates).toEqual(['2026-11-05']);
    });

    it('does not overwrite durable dates with legacy data', () => {
      const durableDates = ['2026-11-10'];
      const legacyTimestamps = ['2026-11-10T09:00:00Z'];

      const { mergedDates, hasLegacyFallback } = mergeLegacyActivityDates(
        durableDates,
        legacyTimestamps,
        { cutoverDate: '2026-11-12', timezone: 'UTC' },
      );

      expect(hasLegacyFallback).toBe(false);
      expect(mergedDates).toEqual(['2026-11-10']);
    });
  });
});
