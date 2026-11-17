function parseVerificationReport(rawText: string): Record<string, unknown> {
  const cleaned = rawText
    .replace(/^\uFEFF/, "")
    .trim()
    .replace(/^\x60{3}(?:json)?\s*/i, "")
    .replace(/\s*\x60{3}\s*$/, "")
    .trim();

  const candidates = [cleaned];
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const extracted = cleaned.slice(firstBrace, lastBrace + 1);
    if (extracted !== cleaned) candidates.push(extracted);
  }

  for (const candidate of candidates) {
    try {
      const parsed: unknown = JSON.parse(candidate);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // Try the bounded JSON object extraction before failing.
    }
  }

  throw new Error("Gemini returned an invalid verification report. Please retry verification; the PDF remains private.");
}
