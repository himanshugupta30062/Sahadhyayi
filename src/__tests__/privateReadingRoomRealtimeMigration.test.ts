import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20261117234000_private_reading_room_realtime.sql"),
  "utf8",
);
const hook = readFileSync(resolve(process.cwd(), "src/hooks/useReadingRoom.ts"), "utf8");

describe("private reading-room Realtime authorization", () => {
  it("limits room topics to an existing room and authenticated readers", () => {
    expect(migration).toContain("TO authenticated");
    expect(migration).toContain("(SELECT realtime.topic()) = 'reading-room:' || room.id::text");
    expect(migration).toContain("private IS TRUE");
    expect(migration).toContain("extension IN ('broadcast', 'presence')");
  });

  it("keeps the room-list channel private and prevents client publishing", () => {
    expect(migration).toContain("(SELECT realtime.topic()) LIKE 'reading-rooms-realtime:%'");
    expect(migration).toContain('DROP POLICY IF EXISTS "Authenticated readers can publish reading room list realtime"');
    expect(migration).not.toContain('CREATE POLICY "Authenticated readers can publish reading room list realtime"');
  });

  it("drops every managed policy before recreating it for safe replay", () => {
    const drops = migration.match(/DROP POLICY IF EXISTS/g) ?? [];
    expect(drops).toHaveLength(4);
    expect(migration.indexOf("CREATE POLICY")).toBeGreaterThan(migration.lastIndexOf("DROP POLICY IF EXISTS"));
  });

  it("uses private channels and stable room IDs in the client", () => {
    expect(hook).toContain("const channelKey = `reading-room:${roomId}`");
    expect(hook).toContain("config: { private: true, presence: { key: user.id } }");
    expect(hook).toContain("config: { private: true }");
  });
});
