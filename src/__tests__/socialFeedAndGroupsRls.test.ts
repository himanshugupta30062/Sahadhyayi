import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  new URL(
    '../../supabase/migrations/20260927140000_fix_social_feed_and_group_discovery.sql',
    import.meta.url,
  ),
  'utf8',
);

const groupDiscoveryHardening = readFileSync(
  new URL(
    '../../supabase/migrations/20261020180000_fix_group_discovery_and_anon_grants.sql',
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

  it('documents the original authenticated group-discovery migration', () => {
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

  it('lets anonymous visitors discover only public groups', () => {
    expect(groupDiscoveryHardening).toMatch(
      /CREATE POLICY "Anyone can discover public reading groups"\s+ON public\.group_chats\s+FOR SELECT\s+TO anon\s+USING \(is_encrypted IS NOT TRUE\)/i,
    );
    expect(groupDiscoveryHardening).toMatch(
      /CREATE POLICY "Readers can discover public groups and access their own invite-only groups"[\s\S]*FOR SELECT\s+TO authenticated[\s\S]*is_encrypted IS NOT TRUE[\s\S]*created_by = \(SELECT auth\.uid\(\)\)[\s\S]*gcm\.user_id = \(SELECT auth\.uid\(\)\)/i,
    );
  });

  it('removes anonymous membership/message access while retaining public group listing', () => {
    expect(groupDiscoveryHardening).toMatch(/REVOKE ALL PRIVILEGES ON TABLE public\.group_chats FROM anon/i);
    expect(groupDiscoveryHardening).toMatch(/GRANT SELECT ON TABLE public\.group_chats TO anon/i);
    expect(groupDiscoveryHardening).toMatch(/REVOKE ALL PRIVILEGES ON TABLE public\.group_chat_members FROM anon/i);
    expect(groupDiscoveryHardening).toMatch(/REVOKE ALL PRIVILEGES ON TABLE public\.group_messages FROM anon/i);
    expect(groupDiscoveryHardening).toMatch(/GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public\.group_messages TO authenticated/i);
  });
});
