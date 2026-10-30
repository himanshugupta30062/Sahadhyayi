import { describe, expect, it } from "vitest";
import {
  isCompleteScientistProfile,
  parseScientistJson,
  validateScientistProfile,
} from "@/lib/scientistProfileValidation";

const validProfile = {
  headline: "A life in science",
  legacy: "A lasting contribution.",
  knownFor: ["Discovery"],
  lifeStory: ["A biographical paragraph."],
  work: [{ title: "Research", description: "A verified contribution." }],
  milestones: [{ year: "1900", title: "Born", description: "Birth record." }],
  sources: [{ label: "Biography", publisher: "Institution", url: "https://example.org/source" }],
};

describe("Scientist profile validation", () => {
  it("accepts a complete profile", () => {
    expect(() => validateScientistProfile(validProfile)).not.toThrow();
    expect(isCompleteScientistProfile(validProfile)).toBe(true);
  });

  it("rejects a profile missing required arrays", () => {
    const incomplete = { ...validProfile, milestones: undefined };
    expect(() => validateScientistProfile(incomplete)).toThrow(/milestones/);
    expect(isCompleteScientistProfile(incomplete)).toBe(false);
  });

  it("rejects empty biography, work, milestones and source lists", () => {
    expect(() => validateScientistProfile({ ...validProfile, lifeStory: [] })).toThrow(/lifeStory/);
    expect(() => validateScientistProfile({ ...validProfile, work: [] })).toThrow(/work/);
    expect(() => validateScientistProfile({ ...validProfile, milestones: [] })).toThrow(/milestone/);
    expect(() => validateScientistProfile({ ...validProfile, sources: [] })).toThrow(/cited source/);
  });

  it("requires a headline and a legacy summary", () => {
    expect(() => validateScientistProfile({ ...validProfile, headline: " " })).toThrow(/headline/);
    expect(() => validateScientistProfile({ ...validProfile, legacy: "" })).toThrow(/legacy/);
  });

  it("parses valid JSON and provides a useful error for malformed JSON", () => {
    expect(parseScientistJson<{ name: string }>('{ "name": "Raman" }', "Profile data")).toEqual({ name: "Raman" });
    expect(() => parseScientistJson("{", "Publications")).toThrow("Publications must contain valid JSON.");
  });
});
