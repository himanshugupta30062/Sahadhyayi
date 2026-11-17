import { describe, expect, it } from "vitest";
import { parseVerificationReport } from "../../supabase/functions/_shared/pdfVerification";

describe("parseVerificationReport", () => {
  it("parses a plain JSON object", () => {
    expect(parseVerificationReport('{"confidence":0.95,"recommendation":"needs_review"}')).toEqual({ confidence: 0.95, recommendation: "needs_review" });
  });

  it("parses JSON wrapped in markdown fences", () => {
    expect(parseVerificationReport('```json\\n{"confidence":0.8}\\n```')).toEqual({ confidence: 0.8 });
  });

  it("strips a UTF-8 BOM", () => {
    expect(parseVerificationReport('\\uFEFF{"title":"The Trial"}')).toEqual({ title: "The Trial" });
  });

  it("extracts a bounded object from surrounding provider prose", () => {
    expect(parseVerificationReport('Result follows: {"title":"Dune"} End of result.')).toEqual({ title: "Dune" });
  });

  it("rejects arrays and primitive JSON values", () => {
    expect(() => parseVerificationReport('[{"title":"Dune"}]')).toThrow(/invalid verification report/i);
    expect(() => parseVerificationReport('"not an object"')).toThrow(/invalid verification report/i);
  });

  it("rejects malformed and truncated JSON with a safe retry message", () => {
    expect(() => parseVerificationReport('{"title":')).toThrow(/retry verification/i);
    expect(() => parseVerificationReport('')).toThrow(/retry verification/i);
  });
});
