export function parseVerificationReport(rawText: string): Record<string, unknown> {
  let cleaned = rawText.replace(/^\uFEFF/, "").trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "");
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3).trimEnd();
  }
  cleaned = cleaned.trim();

  try {
    const parsed: unknown = JSON.parse(cleaned);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    throw new Error("Gemini returned an invalid verification report. Please retry verification; the PDF remains private.");
  } catch (err) {
    if (err instanceof Error && err.message.includes("Gemini returned an invalid verification report")) {
      throw err;
    }
  }

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const extracted = cleaned.slice(firstBrace, lastBrace + 1);
    try {
      const parsed: unknown = JSON.parse(extracted);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // Try the bounded JSON object extraction before failing.
    }
  }

  throw new Error("Gemini returned an invalid verification report. Please retry verification; the PDF remains private.");
}
