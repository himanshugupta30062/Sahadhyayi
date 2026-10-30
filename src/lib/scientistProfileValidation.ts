const REQUIRED_PROFILE_ARRAYS = ["knownFor", "lifeStory", "work", "milestones", "sources"] as const;

export function parseScientistJson<T>(value: string, label: string): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    throw new Error(label + " must contain valid JSON.");
  }
}

export function isCompleteScientistProfile(profile: Record<string, unknown>): boolean {
  return typeof profile.initials === "string" && Boolean(profile.initials.trim())
    && typeof profile.birthplace === "string" && Boolean(profile.birthplace.trim())
    && REQUIRED_PROFILE_ARRAYS.every((key) =>
    Array.isArray(profile[key]) && (profile[key] as unknown[]).length > 0
  )
    && typeof profile.headline === "string" && Boolean(profile.headline.trim())
    && typeof profile.legacy === "string" && Boolean(profile.legacy.trim());
}

export function validateScientistProfile(profile: Record<string, unknown>): void {
  if (typeof profile.initials !== "string" || !profile.initials.trim()) throw new Error("Scientist initials are required.");
  if (typeof profile.birthplace !== "string" || !profile.birthplace.trim()) throw new Error("A birthplace is required.");
  const missing = REQUIRED_PROFILE_ARRAYS.filter((key) => !Array.isArray(profile[key]));
  if (missing.length) {
    throw new Error("Profile details need valid arrays for: " + missing.join(", ") + ".");
  }
  if (!Array.isArray(profile.knownFor) || profile.knownFor.length === 0) {
    throw new Error("Add at least one item to knownFor before saving or publishing.");
  }
  if (!Array.isArray(profile.lifeStory) || profile.lifeStory.length === 0) {
    throw new Error("Add at least one lifeStory paragraph before saving or publishing.");
  }
  if (!Array.isArray(profile.work) || profile.work.length === 0) {
    throw new Error("Add at least one work item before saving or publishing.");
  }
  if (!Array.isArray(profile.milestones) || profile.milestones.length === 0) {
    throw new Error("Add at least one milestone before saving or publishing.");
  }
  if (!Array.isArray(profile.sources) || profile.sources.length === 0) {
    throw new Error("Add at least one cited source before saving or publishing.");
  }
  if (typeof profile.headline !== "string" || !profile.headline.trim()) {
    throw new Error("A profile headline is required.");
  }
  if (typeof profile.legacy !== "string" || !profile.legacy.trim()) {
    throw new Error("A legacy summary is required.");
  }
}
