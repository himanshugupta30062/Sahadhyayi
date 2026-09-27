import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const visibilityMigration = readFileSync(
  new URL(
    '../../supabase/migrations/20260927130000_allow_authenticated_social_feed_visibility.sql',
    import.meta.url
  ),
  'utf8'
);

describe('social post feed visibility policy', () => {
  it('allows all authenticated readers to see community posts without opening anonymous access', () => {
    expect(visibilityMigration).toMatch(
      /CREATE POLICY "Authenticated users can view social feed posts"\s+ON public\.posts\s+FOR SELECT\s+TO authenticated\s+USING \(true\)/i
    );
    expect(visibilityMigration).not.toMatch(/\bTO\s+(public|anon)\b/i);
  });
});
