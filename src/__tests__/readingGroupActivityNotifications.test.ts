import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const migration=readFileSync(resolve(process.cwd(),'supabase/migrations/20261111200000_reading_group_activity_notifications.sql'),'utf8');
describe('reading group activity notifications',()=>{
 it('notifies active group members for posts and replies',()=>{
  expect(migration).toMatch(/AFTER INSERT ON public\.reading_group_posts/);
  expect(migration).toMatch(/AFTER INSERT ON public\.reading_group_post_comments/);
  expect(migration).toMatch(/m\.status='active'/);
  expect(migration).toMatch(/m\.user_id<>v_actor/);
  expect(migration).toMatch(/'reading_group_post'/);
  expect(migration).toMatch(/'reading_group_reply'/);
 });
 it('uses group feed deep links and a trigger-only security definer',()=>{
  expect(migration).toMatch(/'\/groups\/'/);
  expect(migration).toMatch(/SECURITY DEFINER LANGUAGE plpgsql|LANGUAGE plpgsql SECURITY DEFINER/);
  expect(migration).toMatch(/REVOKE ALL ON FUNCTION public\.notify_reading_group_activity\(\) FROM PUBLIC,anon,authenticated/);
 });
});
