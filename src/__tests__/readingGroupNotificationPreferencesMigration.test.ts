import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20261111190000_reading_group_notification_preferences.sql'),
  'utf8',
);

describe('Reading Groups notification preference migration', () => {
  it('creates owner-scoped preferences with conservative defaults', () => {
    expect(migration).toMatch(/user_id uuid PRIMARY KEY REFERENCES auth\.users\(id\) ON DELETE CASCADE/i);
    expect(migration).toMatch(/enabled boolean NOT NULL DEFAULT true/i);
    expect(migration).toMatch(/digest_enabled boolean NOT NULL DEFAULT false/i);
    expect(migration).toMatch(/quiet_hours_enabled boolean NOT NULL DEFAULT false/i);
    expect(migration).toMatch(/timezone text NOT NULL DEFAULT 'Asia\/Kolkata'/i);
    expect(migration).toMatch(/ALTER TABLE public\.reading_group_notification_preferences ENABLE ROW LEVEL SECURITY/i);
    expect(migration).toMatch(/USING \(user_id = \(SELECT auth\.uid\(\)\)\)[\s\S]*WITH CHECK \(user_id = \(SELECT auth\.uid\(\)\)\)/i);
  });

  it('restricts per-group mutes to the owner and active group membership', () => {
    expect(migration).toMatch(/PRIMARY KEY \(user_id, group_id\)/i);
    expect(migration).toMatch(/REFERENCES public\.group_chats\(id\) ON DELETE CASCADE/i);
    expect(migration).toMatch(/m\.user_id = \(SELECT auth\.uid\(\)\)[\s\S]*m\.status = 'active'/i);
    expect(migration).toMatch(/ALTER TABLE public\.reading_group_notification_mutes ENABLE ROW LEVEL SECURITY/i);
    expect(migration).toMatch(/REVOKE ALL ON public\.reading_group_notification_mutes FROM anon/i);
  });

  it('does not pretend storage enables notification delivery', () => {
    expect(migration).not.toMatch(/CREATE (OR REPLACE )?FUNCTION public\..*(send|deliver|notify)/i);
    expect(migration).toMatch(/No delivery is performed by this table/i);
  });
});
