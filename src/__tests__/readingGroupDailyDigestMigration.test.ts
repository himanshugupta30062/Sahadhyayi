import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
const sql=readFileSync(resolve(process.cwd(), 'supabase/migrations/20261112120000_reading_group_daily_digest.sql'),'utf8');
describe('Reading Group daily digest migration',()=>{
 it('deduplicates a digest per user and date and schedules daily',()=>{
  expect(sql).toMatch(/PRIMARY KEY\(user_id,digest_date\)/i);
  expect(sql).toMatch(/reading-group-daily-digest/i);
  expect(sql).toMatch(/'0 8 \* \* \*'/);
 });
 it('is opt-in and aggregates Reading Group notifications only',()=>{
  expect(sql).toMatch(/coalesce\(pref\.digest_enabled,false\)/i);
  expect(sql).toMatch(/coalesce\(pref\.enabled,true\)/i);
  expect(sql).toMatch(/n\.type LIKE 'reading_group%'/i);
  expect(sql).toMatch(/reading_group_digest/i);
  expect(sql).not.toMatch(/send_email|webpush|push_notification/i);
 });
});
