import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  fileURLToPath(new URL('../../supabase/migrations/20261117230000_align_post_comment_visibility.sql', import.meta.url)),
  'utf8',
);

describe('post comment audience RLS migration', () => {
  it('replaces the legacy friends-only comment policy', () => {
    expect(migration).toContain('DROP POLICY IF EXISTS "Users can view comments on friends posts"');
    expect(migration).toContain('CREATE POLICY "Readers can view comments allowed by parent post audience"');
  });

  it('keeps authors able to read their own comments', () => {
    expect(migration).toContain('user_id = (SELECT auth.uid())');
  });

  it('matches public, friends, and followers parent-post audiences', () => {
    expect(migration).toContain("p.audience = 'public'");
    expect(migration).toContain("p.audience = 'friends'");
    expect(migration).toContain("p.audience = 'followers'");
    expect(migration).toContain('public.friends AS f');
    expect(migration).toContain('public.user_follows AS uf');
  });
});
