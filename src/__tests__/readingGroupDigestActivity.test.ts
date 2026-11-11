import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const migration = readFileSync(resolve(process.cwd(), 'supabase/migrations/20261111174900_exclude_digest_from_digest_activity.sql'), 'utf8');

describe('Reading Group digest activity filtering', () => {
  it('does not count generated digest notifications as fresh group activity', () => {
    expect(migration).toMatch(/n\.type LIKE 'reading_group%'/i);
    expect(migration).toMatch(/n\.type <> 'reading_group_digest'/i);
  });
  it('retains quiet-hours and same-local-day delivery safeguards', () => {
    expect(migration).toMatch(/quiet_hours_enabled/i);
    expect(migration).toMatch(/reading_group_digest_deliveries/i);
    expect(migration).toMatch(/ON CONFLICT DO NOTHING/i);
  });
});
