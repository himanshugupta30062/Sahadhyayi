import { afterEach, describe, expect, it, vi } from 'vitest';
import { validatePdf } from './AdminBookPdfManager';

const makePdf = (options: { content?: string; type?: string; size?: number; name?: string } = {}) => {
  const file = new File([options.content ?? '%PDF-1.7\nvalid test pdf'], options.name ?? 'sample.pdf', {
    type: options.type ?? 'application/pdf',
  });
  if (options.size === undefined) return file;
  return Object.defineProperty(file, 'size', { configurable: true, value: options.size }) as File;
};

describe('validatePdf', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('accepts a PDF with a valid signature and MIME type', async () => {
    await expect(validatePdf(makePdf())).resolves.toBeUndefined();
  });

  it('rejects empty files', async () => {
    await expect(validatePdf(makePdf({ content: '', size: 0 })))
      .rejects.toThrow('Choose a PDF smaller than 50 MB.');
  });

  it('rejects files larger than 50 MB', async () => {
    await expect(validatePdf(makePdf({ size: 50 * 1024 * 1024 + 1 })))
      .rejects.toThrow('Choose a PDF smaller than 50 MB.');
  });

  it('rejects a non-PDF MIME type', async () => {
    await expect(validatePdf(makePdf({ type: 'text/plain' })))
      .rejects.toThrow('Only PDF files are accepted.');
  });

  it('rejects files without the PDF magic signature even when MIME type claims PDF', async () => {
    await expect(validatePdf(makePdf({ content: 'not a PDF' })))
      .rejects.toThrow('This file does not have a valid PDF signature.');
  });

  it('checks the file signature even when MIME type is omitted', async () => {
    await expect(validatePdf(makePdf({ type: '', content: 'not a PDF' })))
      .rejects.toThrow('This file does not have a valid PDF signature.');
  });
});
