import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const reminder = readFileSync(resolve(process.cwd(), 'supabase/migrations/20261111174500_defer_group_event_reminders_after_quiet_hours.sql'), 'utf8');
const digest = readFileSync(resolve(process.cwd(), 'supabase/migrations/20261111174600_group_digest_respect_quiet_hours.sql'), 'utf8');

describe('Reading Group quiet-hours delivery safeguards', () => {
  it('keeps overdue event reminders eligible after quiet hours end while event is upcoming', () => {
    expect(reminder).toMatch(/now\(\)\s*-\s*interval\s*'24 hours'/i);
    expect(reminder).toMatch(/e\.starts_at\s*>\s*now\(\)/i);
    expect(reminder).toMatch(/group_event_reminder_deliveries/i);
    expect(reminder).toMatch(/ON CONFLICT DO NOTHING/i);
  });

  it('blocks daily digest during quiet hours and retries hourly', () => {
    expect(digest).toMatch(/quiet_hours_enabled/i);
    expect(digest).toMatch(/quiet_hours_start/i);
    expect(digest).toMatch(/quiet_hours_end/i);
    expect(digest).toMatch(/AT TIME ZONE/i);
    expect(digest).toMatch(/cron\.schedule\('reading-group-daily-digest','0 \* \* \* \*'/i);
  });

  it('preserves per-local-day digest idempotency and opt-in', () => {
    expect(digest).toMatch(/digest_enabled,false/i);
    expect(digest).toMatch(/reading_group_digest_deliveries/i);
    expect(digest).toMatch(/ON CONFLICT DO NOTHING/i);
    expect(digest).toMatch(/digest_date/i);
  });
});
