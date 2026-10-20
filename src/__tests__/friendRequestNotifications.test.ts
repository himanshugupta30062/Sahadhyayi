import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20261020230000_friend_request_notifications.sql'),
  'utf8',
);

describe('friend request notifications', () => {
  it('notifies only the addressee for newly created pending requests', () => {
    expect(migration).toMatch(/AFTER INSERT ON public\.friend_requests/);
    expect(migration).toMatch(/NEW\.status = 'pending'/);
    expect(migration).toMatch(/NEW\.addressee_id/);
    expect(migration).toMatch(/'friend_request'/);
    expect(migration).toMatch(/'\/social\?tab=friends'/);
  });

  it('uses a hardened trigger and avoids self-notifications', () => {
    expect(migration).toMatch(/SECURITY DEFINER[\s\S]*SET search_path = ''/);
    expect(migration).toMatch(/NEW\.requester_id <> NEW\.addressee_id/);
    expect(migration).toMatch(/REVOKE ALL ON FUNCTION public\.notify_friend_request\(\) FROM PUBLIC, anon, authenticated/);
    expect(migration).not.toMatch(/CREATE POLICY[^;]+FOR INSERT ON public\.notifications/i);
  });
});
