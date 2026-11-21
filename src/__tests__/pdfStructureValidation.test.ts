import { describe, expect, it } from "vitest";
import { validatePDFStructure } from "../../supabase/functions/_shared/pdfVerification";

function makePdfBlob(headerContent: string, bodyContent: string, trailerContent: string): Blob {
  const content = `${headerContent}\n${bodyContent}\n${trailerContent}`;
  return new Blob([content], { type: "application/pdf" });
}

describe("validatePDFStructure", () => {
  it("validates standard unencrypted PDF containing /Filter and /Version without false encryption error", async () => {
    // This is the critical case: standard modern PDFs have /Filter /FlateDecode and /Version in header,
    // which previously caused a false-positive encryption detection on books like Gunaho Ka Devta.
    const header = `%PDF-1.5\n%âãÏÓ\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R /Version /1.5 >>\nendobj\n3 0 obj\n<< /Filter /FlateDecode /Length 120 >>\nstream`;
    const body = `x^+\\O\\...sample stream data...endstream\nendobj`;
    const trailer = `xref\n0 4\n0000000000 65535 f \n0000000015 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R /Count 150 >>\nstartxref\n345\n%%EOF`;

    const blob = makePdfBlob(header, body, trailer);
    const result = await validatePDFStructure(blob);

    expect(result.valid).toBe(true);
    expect(result.encrypted).toBe(false);
    expect(result.pageCount).toBe(150);
    expect(result.error).toBeUndefined();
  });

  it("validates standard unencrypted PDF with /ViewerPreferences and /V in author metadata", async () => {
    const header = `%PDF-1.6\n1 0 obj\n<< /Type /Catalog /ViewerPreferences << /FitWindow true >> >>\nendobj\n2 0 obj\n<< /Author (Vikram Seth) /V (Draft) /Filter /FlateDecode >>\nendobj`;
    const body = `stream\ndata\nendstream`;
    const trailer = `trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n250\n%%EOF`;

    const blob = makePdfBlob(header, body, trailer);
    const result = await validatePDFStructure(blob);

    expect(result.valid).toBe(true);
    expect(result.encrypted).toBe(false);
  });

  it("does not falsely classify a book about encryption as encrypted", async () => {
    const header = `%PDF-1.4\n1 0 obj\n<< /Title (Modern Encryption and Security) /Subject (How to Encrypt Data) /Filter /FlateDecode >>\nendobj`;
    const body = `stream\nSample text discussing encryption concepts\nendobj`;
    const trailer = `trailer\n<< /Size 3 /Root 1 0 R >>\nstartxref\n180\n%%EOF`;

    const blob = makePdfBlob(header, body, trailer);
    const result = await validatePDFStructure(blob);

    expect(result.valid).toBe(true);
    expect(result.encrypted).toBe(false);
  });

  it("detects standard encrypted PDF with /Encrypt reference in trailer dictionary", async () => {
    const header = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj`;
    const body = `3 0 obj\n<< /Filter /Standard /V 2 /R 3 /O (hash) /U (hash) /P -3904 >>\nendobj`;
    const trailer = `trailer\n<< /Size 4 /Root 1 0 R /Encrypt 3 0 R >>\nstartxref\n300\n%%EOF`;

    const blob = makePdfBlob(header, body, trailer);
    const result = await validatePDFStructure(blob);

    expect(result.valid).toBe(false);
    expect(result.encrypted).toBe(true);
    expect(result.error).toMatch(/Encrypted PDFs are not accepted/i);
  });

  it("detects encrypted PDF with inline /Encrypt dictionary in trailer", async () => {
    const header = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj`;
    const body = `2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj`;
    const trailer = `trailer\n<< /Size 3 /Root 1 0 R /Encrypt << /Filter /Standard /V 4 /R 4 >> >>\nstartxref\n250\n%%EOF`;

    const blob = makePdfBlob(header, body, trailer);
    const result = await validatePDFStructure(blob);

    expect(result.valid).toBe(false);
    expect(result.encrypted).toBe(true);
    expect(result.error).toMatch(/Encrypted PDFs are not accepted/i);
  });

  it("detects linearized encrypted PDF with /Encrypt in header portion", async () => {
    const header = `%PDF-1.5\n1 0 obj\n<< /Linearized 1.0 /L 12345 /Encrypt 5 0 R >>\nendobj`;
    const body = `2 0 obj\n<< /Type /Catalog /Pages 3 0 R >>\nendobj`;
    const trailer = `trailer\n<< /Size 6 /Root 2 0 R >>\nstartxref\n1200\n%%EOF`;

    const blob = makePdfBlob(header, body, trailer);
    const result = await validatePDFStructure(blob);

    expect(result.valid).toBe(false);
    expect(result.encrypted).toBe(true);
    expect(result.error).toMatch(/Encrypted PDFs are not accepted/i);
  });

  it("rejects non-PDF file missing %PDF- signature", async () => {
    const blob = new Blob(["<!DOCTYPE html><html><body>Not a PDF</body></html>"], { type: "text/html" });
    const result = await validatePDFStructure(blob);

    expect(result.valid).toBe(false);
    expect(result.encrypted).toBe(false);
    expect(result.error).toBe("Missing PDF signature");
  });

  it("rejects files that are too small", async () => {
    const blob = new Blob(["%PDF-"], { type: "application/pdf" });
    const result = await validatePDFStructure(blob);

    expect(result.valid).toBe(false);
    expect(result.error).toBe("File too small to be a valid PDF");
  });

  it("rejects corrupted/truncated PDF missing startxref or %%EOF", async () => {
    const header = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj`;
    const body = `stream data that is truncated before trailer`;
    const trailer = `corrupted content without eof markers`;

    const blob = makePdfBlob(header, body, trailer);
    const result = await validatePDFStructure(blob);

    expect(result.valid).toBe(false);
    expect(result.error).toBe("Invalid PDF structure: missing trailer/EOF");
  });
});
