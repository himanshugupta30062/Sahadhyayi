import { describe, expect, it } from 'vitest';
import {
  buildAssetOptions,
  calculateQualityScore,
  evaluateBookQuality,
  identifyJunkCandidate,
} from './qualityScoring';

describe('evaluateBookQuality', () => {
  it('scores a Standard Ebooks EPUB as carefully edited and public domain', () => {
    const result = evaluateBookQuality({
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      epubUrl: 'https://standardebooks.org/ebooks/jane-austen/pride-and-prejudice',
      sourceProvider: 'standardebooks',
      coverImageUrl: 'https://standardebooks.org/cover.jpg',
      publicationYear: 1813,
      description: 'A'.repeat(120),
      genre: 'Classic',
      pages: 300,
    });
    expect(result.accessStatus).toBe('carefully_edited');
    expect(result.licenseEvidence).toBe('public_domain');
    expect(result.breakdown.contentIntegrity).toBe(30);
    expect(result.breakdown.editorialAssurance).toBe(15);
    expect(result.score).toBeGreaterThan(70);
    expect(result.reasons).toContain('Verified reflowable EPUB with structural chapter hierarchy (+30)');
  });

  it('caps Google Books previews at 45 and marks them preview-only', () => {
    const result = evaluateBookQuality({
      title: 'A Complete Book',
      author: 'Known Author',
      pdfUrl: 'https://books.google.com/books?id=preview',
      isbn: '9781234567890',
      publicationYear: 2020,
      description: 'A'.repeat(120),
      coverImageUrl: 'https://covers.example/cover.jpg',
    });
    expect(result.accessStatus).toBe('preview_only');
    expect(result.licenseEvidence).toBe('publisher_preview');
    expect(result.score).toBeLessThanOrEqual(45);
    expect(result.confidence).toBe('low');
  });

  it('demotes broken links and never gives them access points', () => {
    const result = evaluateBookQuality({
      title: 'Unavailable',
      author: 'Author',
      pdfUrl: 'https://example.com/book.pdf',
      isBrokenLink: true,
    });
    expect(result.breakdown.contentIntegrity).toBe(0);
    expect(result.breakdown.verifiedAccess).toBe(0);
    expect(result.breakdown.demotions).toBe(35);
    expect(result.score).toBeLessThanOrEqual(35);
    expect(result.accessStatus).toBe('access_unverified');
  });

  it('assigns metadata-only status and low confidence without assets', () => {
    const result = evaluateBookQuality({ title: 'Catalog entry', author: 'Author' });
    expect(result.accessStatus).toBe('metadata_only');
    expect(result.confidence).toBe('low');
    expect(result.breakdown.contentIntegrity).toBe(0);
  });

  it('recognizes Gutenberg links and public-domain provenance', () => {
    const result = evaluateBookQuality({
      title: 'Classic',
      author: 'Author',
      pdf_url: 'https://gutenberg.org/files/1/1.pdf',
    });
    expect(result.accessStatus).toBe('public_domain');
    expect(result.licenseEvidence).toBe('public_domain');
    expect(result.breakdown.editorialAssurance).toBe(12);
  });

  it('supports the numeric compatibility wrapper', () => {
    expect(calculateQualityScore({ title: 'Book', epubUrl: 'https://example.com/book.epub' }))
      .toBe(evaluateBookQuality({ title: 'Book', epubUrl: 'https://example.com/book.epub' }).score);
  });
});

describe('buildAssetOptions', () => {
  it('creates a direct EPUB option with matching reader and download links', () => {
    expect(buildAssetOptions('','https://example.com/book.epub','provider')).toEqual([
      expect.objectContaining({
        format: 'epub',
        downloadUrl: 'https://example.com/book.epub',
        readerUrl: 'https://example.com/book.epub',
        isDirectDownload: true,
        isDirectRead: true,
        verified: true,
        sourceProvider: 'provider',
      }),
    ]);
  });

  it('keeps Google Books PDF as reader-only and direct PDFs downloadable', () => {
    const options = buildAssetOptions(
      'https://books.google.com/books?id=x',
      'https://example.com/book.epub',
    );
    expect(options[0]).toMatchObject({ format: 'epub', verified: true });
    expect(options[1]).toMatchObject({
      format: 'pdf',
      downloadUrl: undefined,
      readerUrl: 'https://books.google.com/books?id=x',
      isDirectDownload: false,
      verified: false,
    });
    expect(buildAssetOptions('https://example.com/book.pdf')[0])
      .toMatchObject({ format: 'pdf', isDirectDownload: true, verified: true });
  });

  it('returns an empty list when no formats are supplied', () => {
    expect(buildAssetOptions()).toEqual([]);
  });
});

describe('identifyJunkCandidate', () => {
  it.each(['', 'untitled', 'test', 'sample'])('flags placeholder title %s with no assets as junk', (title) => {
    const result = identifyJunkCandidate({ title, author: 'unknown' });
    expect(result.isJunk).toBe(true);
    expect(result.reasons).toContain('Missing or placeholder title');
  });

  it('does not classify a complete book record as junk', () => {
    expect(identifyJunkCandidate({
      title: 'Useful title',
      author: 'Author',
      pdf_url: 'https://example.com/book.pdf',
      description: 'A description',
      cover_image_url: 'https://example.com/cover.jpg',
    })).toEqual({ isJunk: false, reasons: [] });
  });

  it('flags empty ghost records and records both applicable reasons', () => {
    const result = identifyJunkCandidate({ title: 'Good title', author: 'Author' });
    expect(result.isJunk).toBe(true);
    expect(result.reasons).toContain('Completely empty ghost record with no digital assets or metadata');
  });
});
