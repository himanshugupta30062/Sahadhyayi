import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20261117234000_private_reading_room_realtime.sql"),
  "utf8",
);
const hook = readFileSync(resolve(process.cwd(), "src/hooks/useReadingRoom.ts"), "utf8");

describe("private reading-room Realtime authorization", () => {
  it("limits room topics to a matching persisted room and authenticated role", () => {
    expect(migration).toContain("TO authenticated");
    expect(migration).toContain("realtime.topic() = 'reading-room:' || room.id::text");
    expect(migration).toContain("private IS TRUE");
    expect(migration).toContain("extension IN ('broadcast', 'presence')");
  });

  it("uses private channels and stable room IDs in the client", () => {
    expect(hook).toContain("const channelKey = `reading-room:${roomId}`");
    expect(hook).toContain("config: { private: true, presence: { key: user.id } }");
    expect(hook).toContain("config: { private: true }");
  });
});
