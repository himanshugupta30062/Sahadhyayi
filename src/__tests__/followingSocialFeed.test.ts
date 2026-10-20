import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const hook = readFileSync(
  new URL('../../src/hooks/useSocialPosts.ts', import.meta.url),
  'utf8',
);
const feed = readFileSync(
  new URL('../../src/components/social/EnhancedSocialFeed.tsx', import.meta.url),
  'utf8',
);
const audienceMigration = readFileSync(
  new URL('../../supabase/migrations/20261020130000_add_post_audiences.sql', import.meta.url),
  'utf8',
);

describe('Following social feed', () => {
  it('queries only followed authors and keeps a separate cache per feed mode', () => {
    expect(hook).toMatch(/export type SocialFeedMode = 'community' \| 'following'/);
    expect(hook).toMatch(/queryKey: \['social-posts', user\?\.id, feedMode\]/);
    expect(hook).toMatch(/from\('user_follows'\)[\s\S]*select\('following_id'\)[\s\S]*eq\('follower_id', user\.id\)/);
    expect(hook).toMatch(/if \(feedMode === 'following'\) postsQuery = postsQuery\.in\('user_id', followedUserIds\)/);
    expect(hook).toMatch(/if \(feedMode === 'following'\) fallbackQuery = fallbackQuery\.in\('user_id', followedUserIds\)/);
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
