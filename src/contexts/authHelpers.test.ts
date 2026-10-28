import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(() => ({})),
}));
vi.mock("@/integrations/supabase/client-universal", () => ({
  supabase: { auth: {} },
}));

import { normalizeAuthEmail, normalizeAuthName } from "@/contexts/authHelpers";

describe("normalizeAuthEmail", () => {
  it("trims surrounding whitespace and lowercases the address", () => {
    expect(normalizeAuthEmail("  Reader+Books@Example.COM  ")).toBe("reader+books@example.com");
  });

  it("preserves valid punctuation in the email address", () => {
    expect(normalizeAuthEmail("first.last+tag@example.com")).toBe("first.last+tag@example.com");
  });
});

describe("normalizeAuthName", () => {
  it("replaces control characters and collapses repeated whitespace", () => {
    expect(normalizeAuthName("  Himanshu\t\nGupta\u0000 ")).toBe("Himanshu Gupta");
  });

  it("trims empty names and limits names to 100 characters", () => {
    expect(normalizeAuthName("   ")).toBe("");
    expect(normalizeAuthName("a".repeat(120))).toHaveLength(100);
  });
});
