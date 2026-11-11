import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  fileURLToPath(new URL('../../supabase/migrations/20261112100000_reading_group_event_notifications.sql', import.meta.url)),
  'utf8',
);

describe('Reading Group event notification migration', () => {
  it('notifies active members transactionally and excludes organizer', () => {
    expect(migration).toMatch(/AFTER INSERT ON public\.group_events/i);
    expect(migration).toMatch(/member\.status = 'active'/i);
    expect(migration).toMatch(/member\.user_id <> NEW\.organizer_id/i);
    expect(migration).toMatch(/INSERT INTO public\.notifications/i);
    expect(migration).toMatch(/'reading_group_event'/i);
  });

  it('honors global preference, category setting and group mute expiry', () => {
    expect(migration).toMatch(/coalesce\(pref\.enabled, true\)/i);
    expect(migration).toMatch(/coalesce\(pref\.membership_activity, true\)/i);
    expect(migration).toMatch(/mute\.muted_until IS NOT NULL AND mute\.muted_until <= now\(\)/i);
  });

  it('keeps delivery in-app only and revokes direct function execution', () => {
    expect(migration).toMatch(/REVOKE ALL ON FUNCTION public\.notify_reading_group_event_created\(\) FROM PUBLIC, anon, authenticated/i);
    expect(migration).not.toMatch(/send_email|webpush|push_notification/i);
  });
});
