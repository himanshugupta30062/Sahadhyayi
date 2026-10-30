import { beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({ responses: {} as Record<string, unknown> }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => {
      const builder: Record<string, unknown> = {};
      for (const method of ["select", "eq", "order", "in"]) {
        builder[method] = vi.fn(() => builder);
      }
      builder.then = (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
        Promise.resolve(mocked.responses[table] ?? { data: [], error: null }).then(resolve, reject);
      return builder;
    },
  },
}));

import { fetchScientistProfiles } from "@/lib/scientistsRepository";

const completeProfile = {
  initials: "NEW",
  birthplace: "India",
  headline: "A scientist's story",
  birthplace: "India",
  knownFor: ["Research"],
  lifeStory: ["Biography paragraph"],
  work: [{ title: "Work", description: "Contribution" }],
  milestones: [{ year: "1900", title: "Milestone", description: "Detail" }],
  legacy: "A lasting legacy.",
  sources: [{ label: "Institutional biography", publisher: "University", url: "https://example.org" }],
};

describe("Scientists Supabase repository", () => {
  beforeEach(() => {
    mocked.responses = {
      scientists: { data: [], error: null },
      scientist_publications: { data: [], error: null },
      scientist_archives: { data: [], error: null },
    };
  });

  it("returns an empty collection when the database query succeeds with no published records", async () => {
    await expect(fetchScientistProfiles()).resolves.toEqual([]);
  });

  it("uses the curated static collection when the scientist query fails", async () => {
    mocked.responses.scientists = { data: null, error: { message: "temporary outage" } };
    const result = await fetchScientistProfiles();
    expect(result.length).toBeGreaterThan(0);
    expect(result.some((scientist) => scientist.slug === "c-v-raman")).toBe(true);
  });

  it("preserves an existing reviewed biography but respects intentionally empty database source lists", async () => {
    mocked.responses.scientists = {
      data: [{
        id: "raman-id", slug: "c-v-raman", name: "C. V. Raman", region: "india",
        discipline: "Physics · Optics", lifespan: "1888–1970", summary: "A physicist.",
        status: "published", profile_data: {}, sort_order: 1,
      }],
      error: null,
    };
    const result = await fetchScientistProfiles();
    expect(result).toHaveLength(1);
    expect(result[0].knownFor.length).toBeGreaterThan(0);
    expect(result[0].publications).toEqual([]);
    expect(result[0].archives).toEqual([]);
  });

  it("does not expose a new published row until its biography is complete", async () => {
    mocked.responses.scientists = {
      data: [{
        id: "new-id", slug: "new-scientist", name: "New Scientist", region: "india",
        discipline: "Physics", lifespan: "1900–1980", summary: "A scientist.",
        status: "published", profile_data: {}, sort_order: 20,
      }],
      error: null,
    };
    await expect(fetchScientistProfiles()).resolves.toEqual([]);
  });

  it("exposes a new profile when all required biography sections are present", async () => {
    mocked.responses.scientists = {
      data: [{
        id: "new-id", slug: "new-scientist", name: "New Scientist", region: "india",
        discipline: "Physics", lifespan: "1900–1980", summary: "A scientist.",
        status: "published", profile_data: completeProfile, sort_order: 20,
      }],
      error: null,
    };
    const result = await fetchScientistProfiles();
    expect(result).toHaveLength(1);
    expect(result[0].knownFor).toEqual(["Research"]);
    expect(result[0].lifeStory).toEqual(["Biography paragraph"]);
  });
});
