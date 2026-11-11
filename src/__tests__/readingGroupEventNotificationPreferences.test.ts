import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20261112160000_respect_group_event_notification_preferences.sql'),
  'utf8',
);

describe('Reading Group event notification preferences', () => {
  it('filters event announcements by global enablement, membership activity, and group mute', () => {
    expect(migration).toMatch(/coalesce\(pref\.enabled, true\)/);
    expect(migration).toMatch(/coalesce\(pref\.membership_activity, true\)/);
    expect(migration).toMatch(/reading_group_notifications_muted\(member\.user_id, v_group\)/);
  });

  it('filters RSVP notifications by organizer preferences and group mute', () => {
    expect(migration).toMatch(/pref\.enabled AND pref\.membership_activity/);
    expect(migration).toMatch(/reading_group_notifications_muted\(v_recipient, v_group\)/);
    expect(migration).toMatch(/reading_group_event_rsvp/);
  });

  it('does not expose the trigger function to client roles', () => {
    expect(migration).toMatch(/REVOKE ALL ON FUNCTION public\.notify_reading_group_event_activity\(\) FROM PUBLIC, anon, authenticated/);
  });
});
