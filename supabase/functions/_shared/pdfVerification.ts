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

export interface PDFStructureValidationResult {
  valid: boolean;
  pageCount: number | null;
  encrypted: boolean;
  error?: string;
}

/**
 * Validate PDF structure beyond magic bytes - check for proper PDF trailer, xref, and encryption.
 * Accurately detects PDF encryption dictionaries without false-positives on unencrypted PDFs
 * that contain compressed streams (/Filter /FlateDecode) or /Version or /V properties.
 */
export async function validatePDFStructure(blob: Blob): Promise<PDFStructureValidationResult> {
  try {
    const size = blob.size;
    if (size < 32) {
      return { valid: false, pageCount: null, encrypted: false, error: "File too small to be a valid PDF" };
    }

    // Read first 2KB for header and initial objects validation
    const headerBuffer = await blob.slice(0, Math.min(size, 2048)).arrayBuffer();
    const header = new TextDecoder().decode(new Uint8Array(headerBuffer));

    if (!header.replace(/^\uFEFF/, "").startsWith("%PDF-")) {
      return { valid: false, pageCount: null, encrypted: false, error: "Missing PDF signature" };
    }

    // Read up to last 16KB for trailer validation (covers larger trailers, metadata, and whitespace before %%EOF)
    const trailerStart = Math.max(0, size - 16384);
    const trailerBuffer = await blob.slice(trailerStart, size).arrayBuffer();
    const trailer = new TextDecoder().decode(new Uint8Array(trailerBuffer));

    if (!trailer.includes("startxref") || !trailer.includes("%%EOF")) {
      return { valid: false, pageCount: null, encrypted: false, error: "Invalid PDF structure: missing trailer/EOF" };
    }

    // Check for PDF encryption according to ISO 32000-1 (PDF specification):
    // 1. Trailer dictionary or cross-reference stream containing the /Encrypt entry:
    //    e.g. /Encrypt 3 0 R or /Encrypt << ... >>
    // 2. Encryption dictionary containing the Standard security handler:
    //    e.g. /Filter /Standard with /V, /R, /O, /U, /P
    const encryptKeyPattern = /\/Encrypt\s*(\d+\s+\d+\s+R|<<)/;
    const standardSecurityHandlerPattern = /\/Filter\s*\/Standard(?:\s|\/|>>|$)/;

    const isEncrypted =
      encryptKeyPattern.test(trailer) ||
      encryptKeyPattern.test(header) ||
      (trailer.includes("/Encrypt") && standardSecurityHandlerPattern.test(trailer)) ||
      (header.includes("/Encrypt") && standardSecurityHandlerPattern.test(header));

    let pageCount: number | null = null;
    const countMatch = trailer.match(/\/Count\s+(\d+)/);
    if (countMatch) {
      pageCount = Number.parseInt(countMatch[1], 10);
    } else {
      const contentMatch = header.match(/\/Count\s+(\d+)/);
      if (contentMatch) {
        pageCount = Number.parseInt(contentMatch[1], 10);
      }
    }

    if (isEncrypted) {
      return { valid: false, pageCount, encrypted: true, error: "Encrypted PDFs are not accepted. Please provide an unencrypted PDF." };
    }

    return { valid: true, pageCount, encrypted: false };
  } catch (error) {
    return { valid: false, pageCount: null, encrypted: false, error: error instanceof Error ? error.message : "PDF structure validation failed" };
  }
}

