import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20261112110000_reading_group_event_reminders.sql'),
  'utf8',
);

describe('Reading Group event reminder migration', () => {
  it('uses unique delivery keys and schedules a guarded cron job', () => {
    expect(migration).toMatch(/PRIMARY KEY \(event_id, user_id, reminder_kind\)/i);
    expect(migration).toMatch(/extname='pg_cron'/i);
    expect(migration).toMatch(/'reading-group-event-reminders'/i);
    expect(migration).toMatch(/'\*\/5 \* \* \* \*'/i);
  });

  it('targets going RSVPs and applies user notification controls', () => {
    expect(migration).toMatch(/p\.response = 'going'/i);
    expect(migration).toMatch(/m\.status = 'active'/i);
    expect(migration).toMatch(/coalesce\(pref\.event_reminders, true\)/i);
    expect(migration).toMatch(/coalesce\(pref\.enabled, true\)/i);
    expect(migration).toMatch(/quiet_hours_enabled/i);
    expect(migration).toMatch(/muted_until/i);
  });

  it('limits reminder windows and emits inbox-only reminder notifications', () => {
    expect(migration).toMatch(/interval '24 hours'/i);
    expect(migration).toMatch(/interval '1 hour'/i);
    expect(migration).toMatch(/interval '10 minutes'/i);
    expect(migration).toMatch(/'reading_group_event_reminder'/i);
    expect(migration).toMatch(/INSERT INTO public\.notifications/i);
    expect(migration).not.toMatch(/send_email|webpush|push_notification/i);
  });
});
