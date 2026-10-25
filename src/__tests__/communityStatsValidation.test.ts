import { describe, expect, it } from "vitest";
import {
  getCommunityStatsBearerToken,
  isAllowedCommunityStatsTimeframe,
  normalizeCommunityStatsTimeframe,
} from "../../supabase/functions/community-stats/validation";

describe("community-stats request validation", () => {
  describe("getCommunityStatsBearerToken", () => {
    it("extracts bearer tokens case-insensitively", () => {
      expect(getCommunityStatsBearerToken("bEaReR abc.def")).toBe("abc.def");
    });

    it.each([null, "", "Basic abc", "abc", "Bearer", "Bearer   "])(
      "rejects missing or malformed authorization: %s",
      (header) => expect(getCommunityStatsBearerToken(header)).toBeNull(),
    );
  });

  describe("normalizeCommunityStatsTimeframe", () => {
    it.each([
      ["24h", "24h"],
      [" 7D ", "7d"],
      ["30D", "30d"],
      [null, "24h"],
      [undefined, "24h"],
      ["", "24h"],
      [42, "24h"],
    ])("normalizes %j to %s", (value, expected) => {
      expect(normalizeCommunityStatsTimeframe(value)).toBe(expected);
    });
  });

  it.each(["24h", "7d", "30d"])("allows supported timeframe %s", (value) => {
    expect(isAllowedCommunityStatsTimeframe(value)).toBe(true);
  });

  it.each(["", "1h", "90d", "all", "7D"])("rejects unsupported timeframe %s", (value) => {
    expect(isAllowedCommunityStatsTimeframe(value)).toBe(false);
  });
});
