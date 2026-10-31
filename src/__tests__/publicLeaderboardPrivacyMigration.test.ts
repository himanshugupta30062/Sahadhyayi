import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  new URL('../../supabase/migrations/20261031100000_harden_public_leaderboard_identity.sql', import.meta.url),
  'utf8',
);

describe('public game leaderboard privacy migration', () => {
  it('uses a fixed empty search path and schema-qualified relations', () => {
    expect(migration).toContain("SET search_path = ''");
    expect(migration).toContain('public.user_game_stats');
    expect(migration).toContain('public.profiles');
  });

  it('does not expose profile full names or photos', () => {
    expect(migration).toContain("COALESCE(NULLIF(btrim(p.username), ''), 'Reader') AS full_name");
    expect(migration).toContain('NULL::text AS profile_photo_url');
    expect(migration).not.toMatch(/p\.full_name|p\.profile_photo_url/);
  });

  it('keeps the public leaderboard bounded and explicitly grants only intended roles', () => {
    expect(migration).toContain('LEAST(GREATEST(COALESCE(limit_count, 10), 1), 100)');
    expect(migration).toContain('REVOKE ALL ON FUNCTION public.get_game_leaderboard(integer) FROM PUBLIC');
    expect(migration).toContain('TO anon, authenticated, service_role');
  });
});
