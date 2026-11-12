import { beforeEach, describe, expect, it, vi } from 'vitest';

const upsert = vi.fn();
const from = vi.fn(() => ({ upsert }));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: { from },
}));

import { recordReadingActivity } from '@/lib/readingActivity';

describe('recordReadingActivity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    upsert.mockResolvedValue({ error: null });
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-12T18:30:00.000Z'));
    vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
      locale: 'en-US',
      calendar: 'gregory',
      numberingSystem: 'latn',
      timeZone: 'Asia/Kolkata',
    } as Intl.ResolvedDateTimeFormatOptions);
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
      }),
      { onConflict: 'user_id,activity_date', ignoreDuplicates: false },
    );
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
});
