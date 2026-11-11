import {describe,expect,it} from 'vitest';import{readFileSync}from'node:fs';import{resolve}from'node:path';
const schema=readFileSync(resolve(process.cwd(),'supabase/migrations/20261111220000_reading_group_notification_preferences.sql'),'utf8');
const apply=readFileSync(resolve(process.cwd(),'supabase/migrations/20261111221000_apply_group_notification_mutes.sql'),'utf8');
const ui=readFileSync(resolve(process.cwd(),'src/components/groups/GroupNotificationPreference.tsx'),'utf8');
describe('group notification preferences',()=>{it('scopes preference rows to user and group with RLS',()=>{expect(schema).toMatch(/PRIMARY KEY\(user_id,group_id\)/);expect(schema).toMatch(/user_id=auth.uid\(\)/);expect(schema).toMatch(/ENABLE ROW LEVEL SECURITY/);});
it('honors mute preferences for posts, replies, events and RSVP',()=>{expect(apply.match(/reading_group_notifications_muted/g)?.length).toBeGreaterThanOrEqual(3);expect(apply).toMatch(/TG_TABLE_NAME='reading_group_posts'/);expect(apply).toMatch(/TG_TABLE_NAME='reading_group_post_comments'/);expect(apply).toMatch(/TG_TABLE_NAME='group_events'/);expect(apply).toMatch(/TG_TABLE_NAME='group_event_participants'/);});
it('provides a member-facing mute toggle',()=>{expect(ui).toMatch(/Mute/);expect(ui).toMatch(/Unmute/);expect(ui).toMatch(/upsert/);});});
