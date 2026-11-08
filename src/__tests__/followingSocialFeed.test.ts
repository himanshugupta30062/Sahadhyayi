import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const toPath = (relPath: string) => fileURLToPath(new URL(relPath, import.meta.url));

const hook = readFileSync(
  toPath('../../src/hooks/useSocialPosts.ts'),
  'utf8',
);
const feed = readFileSync(
  toPath('../../src/components/social/EnhancedSocialFeed.tsx'),
  'utf8',
);
const audienceMigration = readFileSync(
  toPath('../../supabase/migrations/20261020130000_add_post_audiences.sql'),
  'utf8',
);

describe('Following social feed', () => {
  it('queries only followed authors and keeps a separate cache per feed mode', () => {
    expect(hook).toMatch(/export type SocialFeedMode = [^;]*'following'/);
    expect(hook).toMatch(/queryKey: \['social-posts', user\?\.id, feedMode\]/);
    expect(hook).toMatch(/from\('user_follows'\)[\s\S]*select\('following_id'\)[\s\S]*eq\('follower_id', (userId|user\.id)\)/);
    expect(hook).toMatch(/mode === 'following'[\s\S]*query\.in\('user_id', context\.followedUserIds\)/);
  });

  it('preserves cursor pagination and audience RLS for followed posts', () => {
    expect(hook).toMatch(/created_at\.lt\.\$\{cursor\.created_at\}/);
    expect(hook).toMatch(/setQueryData<SocialPost\[]>\(\['social-posts', user\?\.id, feedMode\]/);
    expect(audienceMigration).toMatch(/audience = 'public'/);
    expect(audienceMigration).toMatch(/audience = 'followers'[\s\S]*uf\.follower_id = auth\.uid\(\)/);
    expect(audienceMigration).toMatch(/audience = 'friends'[\s\S]*FROM public\.friends/);
  });

  it('offers a Following control and a useful no-following empty state', () => {
    expect(feed).toMatch(/setStreamMode\('following'\)/);
    expect(feed).toMatch(/aria-label="Choose feed"/);
    expect(feed).toMatch(/Your Following feed is quiet/);
    expect(feed).toMatch(/Discover readers to follow/);
  });

  it('does not insert a newly created post into the Following cache unconditionally', () => {
    expect(hook).toMatch(/setQueryData<SocialPost\[]>\(\['social-posts', user\?\.id, 'community'\]/);
    expect(hook).toMatch(/invalidateQueries\(\{ queryKey: \['social-posts'\] \}\)/);
  });
});
