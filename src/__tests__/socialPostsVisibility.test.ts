import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const audienceMigration = readFileSync(
  new URL('../../supabase/migrations/20261020130000_add_post_audiences.sql', import.meta.url),
  'utf8'
);
const cleanupMigration = readFileSync(
  new URL('../../supabase/migrations/20261022090000_remove_legacy_permissive_posts_policy.sql', import.meta.url),
  'utf8'
);

describe('social post feed visibility policy', () => {
  it('uses audience-scoped visibility and removes legacy permissive SELECT policies', () => {
    expect(audienceMigration).toMatch(
      /CREATE POLICY "Readers can view posts allowed by audience"[\s\S]*FOR SELECT[\s\S]*TO authenticated/i
    );
    expect(audienceMigration).toMatch(/OR audience = 'public'/);
    expect(audienceMigration).toMatch(/audience = 'friends'[\s\S]*FROM public\.friends/);
    expect(audienceMigration).toMatch(/audience = 'followers'[\s\S]*FROM public\.user_follows/);
    expect(audienceMigration).not.toMatch(
      /CREATE POLICY "Authenticated users can view social feed posts"\s+ON public\.posts/i
    );

    expect(cleanupMigration).toMatch(
      /DROP POLICY IF EXISTS "Authenticated users can view social feed posts" ON public\.posts/i
    );
    expect(cleanupMigration).toMatch(
      /DROP POLICY IF EXISTS "Anyone can view posts" ON public\.posts/i
    );
    expect(cleanupMigration).toMatch(
      /DROP POLICY IF EXISTS "Users can view their own posts and friends' posts" ON public\.posts/i
    );
    expect(cleanupMigration).not.toMatch(/CREATE POLICY[\s\S]*USING \(true\)/i);
    expect(cleanupMigration).not.toMatch(/\bTO\s+(public|anon)\b/i);
  });
});
