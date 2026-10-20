import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const migration = readFileSync(resolve(process.cwd(), 'supabase/migrations/20261020220000_social_activity_notifications.sql'), 'utf8');
const hook = readFileSync(resolve(process.cwd(), 'src/hooks/useNotifications.ts'), 'utf8');
const dropdown = readFileSync(resolve(process.cwd(), 'src/components/notifications/NotificationDropdown.tsx'), 'utf8');

describe('social activity notifications', () => {
  it('creates notifications for follows, likes and comments using database triggers', () => {
    expect(migration).toMatch(/AFTER INSERT ON public\.user_follows/);
    expect(migration).toMatch(/AFTER INSERT ON public\.post_likes/);
    expect(migration).toMatch(/AFTER INSERT ON public\.post_comments/);
    expect(migration).toMatch(/'new_follower'/);
    expect(migration).toMatch(/'post_like'/);
    expect(migration).toMatch(/'post_comment'/);
    expect(migration).toMatch(/'comment_reply'/);
  });

  it('avoids self-notifications and does not grant client insert access', () => {
    expect(migration).toMatch(/v_recipient <> v_actor/);
    expect(migration).toMatch(/SECURITY DEFINER[\s\S]*SET search_path = ''/);
    expect(migration).toMatch(/REVOKE ALL ON FUNCTION public\.notify_social_activity\(\) FROM PUBLIC, anon, authenticated/);
    expect(migration).not.toMatch(/CREATE POLICY[^;]+FOR INSERT ON public\.notifications/i);
  });

  it('keeps reads scoped to the signed-in recipient and displays actor profiles', () => {
    expect(hook).toMatch(/\.eq\('user_id', user\.id\)/);
    expect(hook).toMatch(/actor:actor_id\(id, full_name, username, profile_photo_url\)/);
    expect(dropdown).toMatch(/navigate\(notification\.link\)/);
  });
});
