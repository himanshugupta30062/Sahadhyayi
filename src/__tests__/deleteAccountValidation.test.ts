import { describe, expect, it } from "vitest";
import { getBearerToken, hasDeleteConfirmation } from "../../supabase/functions/delete-account/validation";

describe("delete-account request validation", () => {
  describe("getBearerToken", () => {
    it("extracts a bearer token", () => {
      expect(getBearerToken("Bearer abc.def.ghi")).toBe("abc.def.ghi");
    });

    it("accepts case-insensitive scheme and trims surrounding token whitespace", () => {
      expect(getBearerToken("bEaReR   token-value  ")).toBe("token-value");
    });

    it.each([null, "", "Basic abc", "Bearer", "Bearer   ", "abc"])(
      "rejects missing or malformed authorization: %s",
      (authorization) => expect(getBearerToken(authorization)).toBeNull(),
    );
  });

  describe("hasDeleteConfirmation", () => {
    it("accepts only the exact DELETE confirmation", () => {
      expect(hasDeleteConfirmation({ confirmation: "DELETE" })).toBe(true);
    });

    it.each([
      null,
      undefined,
      "DELETE",
      1,
      [],
      {},
      { confirmation: "delete" },
      { confirmation: " DELETE " },
      { confirmation: true },
      { confirmation: "DELETE", userId: "someone-else" },
    ])("rejects invalid confirmation payload: %j", (body) => {
      expect(hasDeleteConfirmation(body)).toBe(false);
    });
  });
});
