import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const migration = readFileSync(resolve(process.cwd(), 'supabase/migrations/20261111174800_reading_group_membership_notifications.sql'), 'utf8');

describe('Reading Group membership notification migration', () => {
  it('only notifies admins when a member becomes active (not on repeated active updates)', () => {
    expect(migration).toMatch(/NEW\.status IS DISTINCT FROM 'active'/i);
    expect(migration).toMatch(/OLD\.status IS NOT DISTINCT FROM 'active'/i);
    expect(migration).toMatch(/admin_member\.role = 'admin'/i);
    expect(migration).toMatch(/admin_member\.user_id <> NEW\.user_id/i);
  });

  it('honors membership category, global preferences and group mute', () => {
    expect(migration).toMatch(/COALESCE\(pref\.enabled, true\)/i);
    expect(migration).toMatch(/COALESCE\(pref\.membership_activity, true\)/i);
    expect(migration).toMatch(/reading_group_notifications_muted/i);
    expect(migration).toMatch(/ON CONFLICT DO NOTHING/i);
  });

  it('uses in-app notifications and the group destination', () => {
    expect(migration).toMatch(/INSERT INTO public\.notifications/i);
    expect(migration).toMatch(/'reading_group_membership'/i);
    expect(migration).toMatch(/'reading_group', NEW\.group_id/i);
    expect(migration).toMatch(/'\/groups\/'/i);
  });
});
