import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  new URL(
    '../../supabase/migrations/20261029190000_auto_join_default_reading_community.sql',
    import.meta.url,
  ),
  'utf8',
);

describe('default reading community signup migration', () => {
  it('creates an idempotent membership for each newly registered user', () => {
    expect(migration).toMatch(/CREATE UNIQUE INDEX IF NOT EXISTS group_members_group_user_unique/i);
    expect(migration).toMatch(/CREATE OR REPLACE FUNCTION public\.join_default_reading_community\(\)/i);
    expect(migration).toMatch(/AFTER INSERT ON auth\.users/i);
    expect(migration).toMatch(/ON CONFLICT \(group_id, user_id\) DO NOTHING/i);
    expect(migration).toMatch(/INSERT INTO public\.group_members[\s\S]*FROM auth\.users/i);
  });

  it('allows signed-in readers to discover the shared reading circle', () => {
    expect(migration).toMatch(
      /CREATE POLICY "Authenticated users can view reading groups"[\s\S]*ON public\.groups[\s\S]*FOR SELECT[\s\S]*TO authenticated[\s\S]*USING \(true\)/i,
    );
  });

  it('does not change margin-note visibility or expose private notes', () => {
    expect(migration).not.toMatch(/UPDATE public\.margin_notes/i);
    expect(migration).not.toMatch(/DROP POLICY.*margin_notes/i);
    expect(migration).not.toMatch(/visibility\s*=\s*'public'/i);
  });
});
