import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  fileURLToPath(new URL('../../supabase/migrations/20261117233000_harden_reading_room_table_privileges.sql', import.meta.url)),
  'utf8',
);

describe('reading room table privilege hardening migration', () => {
  it('revokes broad inherited grants from public, anonymous and authenticated roles', () => {
    expect(migration).toMatch(
      /REVOKE ALL PRIVILEGES ON TABLE[\s\S]*public\.reading_rooms[\s\S]*public\.reading_room_messages[\s\S]*public\.reading_room_events[\s\S]*FROM PUBLIC, anon, authenticated/i,
    );
  });

  it('grants only the room operations needed for discovery, creation and creator upserts', () => {
    expect(migration).toMatch(
      /GRANT SELECT, INSERT, UPDATE ON TABLE public\.reading_rooms TO authenticated/i,
    );
    expect(migration).toMatch(
      /CREATE POLICY "reading_rooms_creator_update"[\s\S]*FOR UPDATE[\s\S]*TO authenticated[\s\S]*USING \(created_by = \(SELECT auth\.uid\(\)\)\)[\s\S]*WITH CHECK \(created_by = \(SELECT auth\.uid\(\)\)\)/i,
    );
  });

  it('makes messages and events append-only for authenticated clients', () => {
    expect(migration).toMatch(
      /GRANT SELECT, INSERT ON TABLE[\s\S]*public\.reading_room_messages[\s\S]*public\.reading_room_events[\s\S]*TO authenticated/i,
    );
    expect(migration).not.toMatch(/GRANT[^;]*(UPDATE|DELETE|TRUNCATE|REFERENCES|TRIGGER)[^;]*ON TABLE[\s\S]*reading_room_messages/i);
  });

  it('does not change the open authenticated-reader model or replace existing RLS policies', () => {
    expect(migration).toContain('The existing SELECT/INSERT RLS policies remain in force.');
    expect(migration).not.toMatch(/DROP POLICY[^;]*(reading_room_messages_read|reading_room_events_read)/i);
    expect(migration).not.toMatch(/TO anon/i);
  });
});
