import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { upsert, from } = vi.hoisted(() => {
  const upsert = vi.fn();
  const from = vi.fn(() => ({ upsert }));
  return { upsert, from };
});

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: { from },
}));

import {
  DEBOUNCE_WINDOW_MS,
  getLocalActivityDate,
  recordReadingActivity,
  resetActivityDebounceCache,
} from '@/lib/readingActivity';

describe('recordReadingActivity', () => {
  const origDTF = Intl.DateTimeFormat;

  beforeEach(() => {
    vi.clearAllMocks();
    resetActivityDebounceCache();
    upsert.mockResolvedValue({ error: null });
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-12T18:30:00.000Z'));

    class MockDateTimeFormat extends origDTF {
      override resolvedOptions(): Intl.ResolvedDateTimeFormatOptions {
        return {
          locale: 'en-US',
          calendar: 'gregory',
          numberingSystem: 'latn',
          timeZone: 'Asia/Kolkata',
        } as Intl.ResolvedDateTimeFormatOptions;
      }
    }
    Intl.DateTimeFormat = MockDateTimeFormat as unknown as typeof Intl.DateTimeFormat;
  });

  afterEach(() => {
    Intl.DateTimeFormat = origDTF;
    vi.useRealTimers();
  });

  it('upserts the activity under the explicitly formatted local date', async () => {
    await recordReadingActivity('user-1', 'progress_save');

    expect(from).toHaveBeenCalledWith('reading_activity_days');
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        activity_date: '2026-11-13',
        timezone: 'Asia/Kolkata',
        last_activity_at: '2026-11-12T18:30:00.000Z',
        source: 'progress_save',
        book_id: null,
      }),
      { onConflict: 'user_id,activity_date', ignoreDuplicates: false },
    );
  });

  it('debounces rapid repeated actions on the same calendar day', async () => {
    await recordReadingActivity('user-1', 'progress_save');
    expect(upsert).toHaveBeenCalledTimes(1);

    // Second action 2 seconds later on the same day should be debounced
    vi.advanceTimersByTime(2000);
    await recordReadingActivity('user-1', 'chapter_complete');
    expect(upsert).toHaveBeenCalledTimes(1);

    // After debounce window elapses, action is recorded
    vi.advanceTimersByTime(DEBOUNCE_WINDOW_MS + 1000);
    await recordReadingActivity('user-1', 'chapter_complete');
    expect(upsert).toHaveBeenCalledTimes(2);
  });

  it('supports passing optional bookId, custom timezone, and explicit timestamp', async () => {
    await recordReadingActivity('user-2', 'chapter_complete', {
      bookId: 'book-abc-123',
      timezone: 'America/New_York',
      timestamp: new Date('2026-11-12T12:00:00.000Z'),
    });

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-2',
        activity_date: '2026-11-12',
        timezone: 'America/New_York',
        last_activity_at: '2026-11-12T12:00:00.000Z',
        source: 'chapter_complete',
        book_id: 'book-abc-123',
      }),
      expect.any(Object),
    );
  });

  it('ignores calls with empty userId without error', async () => {
    await recordReadingActivity('', 'progress_save');
    expect(from).not.toHaveBeenCalled();
  });

  it('does not throw when the activity upsert returns an error', async () => {
    upsert.mockResolvedValue({ error: new Error('offline') });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await expect(recordReadingActivity('user-1', 'chapter_complete')).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();

    warn.mockRestore();
  });

  it('does not throw when the activity upsert rejects', async () => {
    upsert.mockRejectedValue(new Error('network failure'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await expect(recordReadingActivity('user-1', 'chapter_complete')).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();

    warn.mockRestore();
  });

  describe('getLocalActivityDate', () => {
    it('formats date in requested timezone correctly across day boundaries', () => {
      const dt = new Date('2026-11-12T23:30:00Z');
      expect(getLocalActivityDate(dt, 'UTC')).toBe('2026-11-12');
      expect(getLocalActivityDate(dt, 'Asia/Kolkata')).toBe('2026-11-13');
      expect(getLocalActivityDate(dt, 'America/New_York')).toBe('2026-11-12');
    });
  });
});
