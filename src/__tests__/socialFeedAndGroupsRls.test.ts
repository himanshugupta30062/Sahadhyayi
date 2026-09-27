import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  new URL(
    '../../supabase/migrations/20260927140000_fix_social_feed_and_group_discovery.sql',
    import.meta.url,
  ),
  'utf8',
);

describe('social feed and reading group RLS policies', () => {
  it('makes posts visible to authenticated readers without restoring anonymous visibility', () => {
    expect(migration).toMatch(
      /CREATE POLICY "Authenticated users can view social feed posts"\s+ON public\.posts\s+FOR SELECT\s+TO authenticated\s+USING \(true\)/i,
    );
    expect(migration).toMatch(/DROP POLICY IF EXISTS "Anyone can view posts"/i);
    expect(migration).toMatch(/GRANT SELECT, INSERT, UPDATE, DELETE ON public\.posts TO authenticated/i);
    expect(migration).toMatch(
      /CREATE POLICY "Authenticated users can view comments on feed posts"[\s\S]*FOR SELECT[\s\S]*TO authenticated[\s\S]*visible_post\.id = post_comments\.post_id/i,
    );
    expect(migration).not.toMatch(/\bTO\s+(public|anon)\b/i);
  });

  it('lets authenticated readers discover groups before joining', () => {
    expect(migration).toMatch(
      /CREATE POLICY "Authenticated users can discover reading groups"\s+ON public\.group_chats\s+FOR SELECT\s+TO authenticated\s+USING \(true\)/i,
    );
    expect(migration).toMatch(/GRANT SELECT[\s\S]*ON public\.group_chats TO authenticated/i);
    expect(migration).toMatch(
      /CREATE POLICY "Authenticated users can join reading groups"[\s\S]*WITH CHECK \(user_id = auth\.uid\(\) AND role = 'member'\)/i,
    );
    expect(migration).toMatch(
      /CREATE POLICY "Group creators can add themselves as group admins"[\s\S]*role = 'admin'[\s\S]*created_by = auth\.uid\(\)/i,
    );
  });
});
