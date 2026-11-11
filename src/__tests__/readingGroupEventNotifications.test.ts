import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const migration=readFileSync(resolve(process.cwd(),'supabase/migrations/20261111210000_reading_group_event_notifications.sql'),'utf8');
describe('reading group event notifications',()=>{
 it('alerts active members on event creation, excluding organizer',()=>{
  expect(migration).toMatch(/AFTER INSERT ON public\.group_events/);
  expect(migration).toMatch(/m\.status='active'/);
  expect(migration).toMatch(/m\.user_id<>v_actor/);
  expect(migration).toMatch(/'reading_group_event'/);
 });
 it('alerts event organizer about member RSVP and links to event section',()=>{
  expect(migration).toMatch(/AFTER INSERT ON public\.group_event_participants/);
  expect(migration).toMatch(/'reading_group_event_rsvp'/);
  expect(migration).toMatch(/'\/groups\/'/);
  expect(migration).toMatch(/SECURITY DEFINER/);
  expect(migration).toMatch(/REVOKE ALL ON FUNCTION public\.notify_reading_group_event_activity\(\) FROM PUBLIC,anon,authenticated/);
 });
});
