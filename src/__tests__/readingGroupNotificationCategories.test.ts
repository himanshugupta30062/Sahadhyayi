import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const sql = readFileSync(resolve(process.cwd(), 'supabase/migrations/20261111174700_apply_group_notification_category_preferences.sql'), 'utf8');

describe('Reading Group category notification preferences', () => {
  it('filters post and reply notifications by global and discussion switches', () => {
    expect(sql).toMatch(/coalesce\(pref\.enabled,true\)/i);
    expect(sql).toMatch(/coalesce\(pref\.discussion_activity,true\)/i);
    expect(sql).toMatch(/reading_group_notifications_muted/i);
  });
  it('filters event creation and RSVP notifications by global and event switches', () => {
    expect(sql).toMatch(/coalesce\(pref\.event_reminders,true\)/i);
    expect(sql).toMatch(/FROM public\.reading_group_notification_preferences pref/i);
    expect(sql).toMatch(/ON CONFLICT DO NOTHING/i);
  });
});
