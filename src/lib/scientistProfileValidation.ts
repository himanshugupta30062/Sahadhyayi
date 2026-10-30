const REQUIRED_PROFILE_ARRAYS = ["knownFor", "lifeStory", "work", "milestones", "sources"] as const;

type ProfileRecord = Record<string, unknown>;

export function parseScientistJson<T>(value: string, label: string): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    throw new Error(label + " must contain valid JSON.");
  }
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && Boolean(value.trim());
}

function hasTextFields(value: unknown, fields: string[]): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return fields.every((field) => hasText((value as ProfileRecord)[field]));
}

export function validateScientistProfile(profile: ProfileRecord): void {
  if (!hasText(profile.initials)) throw new Error("Scientist initials are required.");
  if (!hasText(profile.birthplace)) throw new Error("A birthplace is required.");
  if (!hasText(profile.headline)) throw new Error("A profile headline is required.");
  if (!hasText(profile.legacy)) throw new Error("A legacy summary is required.");

  const missing = REQUIRED_PROFILE_ARRAYS.filter((key) => !Array.isArray(profile[key]));
  if (missing.length) {
    throw new Error("Profile details need valid arrays for: " + missing.join(", ") + ".");
  }

  if (!(profile.knownFor as unknown[]).every(hasText)) {
    throw new Error("Every knownFor entry must be a non-empty string.");
  }
  if (!(profile.lifeStory as unknown[]).every(hasText)) {
    throw new Error("Every lifeStory entry must be a non-empty paragraph.");
  }
  if (!(profile.work as unknown[]).every((item) => hasTextFields(item, ["title", "description"]))) {
    throw new Error("Every work item needs a title and description.");
  }
  if (!(profile.milestones as unknown[]).every((item) => hasTextFields(item, ["year", "title", "description"]))) {
    throw new Error("Every milestone needs a year, title and description.");
  }
  if (!(profile.sources as unknown[]).every((item) => hasTextFields(item, ["label", "publisher", "url"]))) {
    throw new Error("Every source needs a label, publisher and URL.");
  }
  if ((profile.sources as ProfileRecord[]).some((source) => {
    const url = source.url as string;
    return !/^https?:\/\//i.test(url);
  })) {
    throw new Error("Source URLs must use http or https.");
  }
}

export function isCompleteScientistProfile(profile: ProfileRecord): boolean {
  try {
    validateScientistProfile(profile);
    return REQUIRED_PROFILE_ARRAYS.every((key) => (profile[key] as unknown[]).length > 0);
  } catch {
    return false;
  }
}
