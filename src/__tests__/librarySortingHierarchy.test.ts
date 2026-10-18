import { describe, expect, it } from 'vitest';
import {
  isVerifiedPdf,
  hasCompleteMetadata,
  hasOtherVerifiedFullText,
  hasUnverifiedOrBrokenLink,
  isMetadataOnly,
  getBookCompletenessScore,
  compareLibraryBooks,
  sortBooksByCompleteness,
} from '@/hooks/useLibraryBooks';

describe('Library Book Sorting Hierarchy', () => {
  // Test fixtures for all 5 tiers + ghost
  const completeVerifiedPdf = {
    id: 'book-1-complete-pdf',
    title: 'The Republic',
    author: 'Plato',
    cover_image_url: 'https://example.com/republic-cover.jpg',
    description: 'A foundational dialogue concerning justice, the order and character of the just city-state, and the just man.',
    language: 'English',
    pdf_url: 'https://example.com/books/republic.pdf',
    created_at: '2026-01-01T00:00:00Z',
    pages: 350,
    isbn: '9780140449143',
    genre: 'Philosophy',
  };

  const partialVerifiedPdfNoCover = {
    id: 'book-2-pdf-no-cover',
    title: 'Critique of Pure Reason',
    author: 'Immanuel Kant',
    cover_image_url: null,
    description: 'An investigation into the foundations and limits of human knowledge and metaphysics.',
    language: 'English',
    pdf_url: 'https://example.com/books/kant-critique.pdf',
    created_at: '2026-01-02T00:00:00Z',
  };

  const partialVerifiedPdfNoDesc = {
    id: 'book-3-pdf-no-desc',
    title: 'Nicomachean Ethics',
    author: 'Aristotle',
    cover_image_url: 'https://example.com/aristotle-cover.jpg',
    description: '',
    language: 'English',
    pdf_url: 'https://example.com/books/ethics.pdf',
    created_at: '2026-01-03T00:00:00Z',
  };

  const verifiedEpubBook = {
    id: 'book-4-verified-epub',
    title: 'Frankenstein',
    author: 'Mary Shelley',
    cover_image_url: 'https://standardebooks.org/covers/frank-L.jpg',
    description: 'The story of Victor Frankenstein and the monstrous creature created in an unorthodox experiment.',
    language: 'English',
    epub_url: 'https://standardebooks.org/ebooks/mary-shelley/frankenstein/dist.epub',
    created_at: '2026-01-04T00:00:00Z',
    accessStatus: 'carefully_edited' as const,
  };

  const officialHtmlReaderBook = {
    id: 'book-5-html-reader',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    cover_image_url: 'https://example.com/austen.jpg',
    description: 'A classic romantic novel following the character development of Elizabeth Bennet.',
    language: 'English',
    assets: [
      {
        format: 'official_reader' as const,
        readerUrl: 'https://gutenberg.org/ebooks/1342.html.images',
        isDirectDownload: false,
        isDirectRead: true,
        verified: true,
        sourceProvider: 'gutenberg',
      },
    ],
    created_at: '2026-01-05T00:00:00Z',
    accessStatus: 'official_reader' as const,
  };

  const brokenLinkBook = {
    id: 'book-6-broken-link',
    title: 'Quantum Mechanics Concepts',
    author: 'David Griffiths',
    cover_image_url: 'https://example.com/qm-cover.jpg',
    description: 'An accessible undergraduate introduction to quantum principles and applications.',
    language: 'English',
    pdf_url: 'https://example.com/404-broken.pdf',
    isBrokenLink: true,
    created_at: '2026-01-06T00:00:00Z',
  };

  const unverifiedAccessBook = {
    id: 'book-7-unverified-access',
    title: 'Organic Chemistry Insights',
    author: 'Paula Bruice',
    cover_image_url: 'https://example.com/chem.jpg',
    description: 'A study of organic chemistry structures, reactions, and synthesis mechanisms.',
    language: 'English',
    pdf_url: 'https://example.com/chem-notes.pdf',
    accessStatus: 'access_unverified' as const,
    created_at: '2026-01-07T00:00:00Z',
  };

  const googlePreviewBook = {
    id: 'book-8-google-preview',
    title: 'Modern Astrodynamics',
    author: 'Roger Bate',
    cover_image_url: 'https://example.com/astro.jpg',
    description: 'Orbital mechanics textbook with preview snippets available online.',
    language: 'English',
    pdf_url: 'https://books.google.com/books?id=astro123&preview=true',
    isGooglePreview: true,
    created_at: '2026-01-08T00:00:00Z',
  };

  const metadataOnlyBook = {
    id: 'book-9-metadata-only',
    title: 'Introduction to Algorithms',
    author: 'Thomas H. Cormen',
    cover_image_url: 'https://example.com/clrs-cover.jpg',
    description: 'Comprehensive computer science textbook on algorithms, data structures, and graph theory.',
    language: 'English',
    isbn: '9780262033848',
    pages: 1312,
    created_at: '2026-01-09T00:00:00Z',
    accessStatus: 'metadata_only' as const,
  };

  const ghostRecordBook = {
    id: 'book-10-ghost',
    title: 'Test sample record',
    author: 'Unknown Author',
    created_at: '2026-01-10T00:00:00Z',
  };

  // Requirement 7: Non-empty pdf_url validation
  describe('Requirement 7: PDF link verification rules', () => {
    it('accepts valid, accessible PDF URLs with direct .pdf extension', () => {
      expect(isVerifiedPdf(completeVerifiedPdf)).toBe(true);
      expect(isVerifiedPdf(partialVerifiedPdfNoCover)).toBe(true);
    });

    it('rejects broken links even when non-empty pdf_url is present', () => {
      expect(isVerifiedPdf(brokenLinkBook)).toBe(false);
      expect(isVerifiedPdf({ pdf_url: 'https://example.com/book.pdf', isBrokenLink: true })).toBe(false);
    });

    it('rejects unverified access status even when non-empty pdf_url is present', () => {
      expect(isVerifiedPdf(unverifiedAccessBook)).toBe(false);
      expect(isVerifiedPdf({ pdf_url: 'https://example.com/book.pdf', accessStatus: 'access_unverified' })).toBe(false);
    });

    it('rejects Google Books preview links masquerading as PDFs', () => {
      expect(isVerifiedPdf(googlePreviewBook)).toBe(false);
      expect(isVerifiedPdf({ pdf_url: 'https://books.google.com/books?id=123' })).toBe(false);
      expect(isVerifiedPdf({ pdf_url: 'https://example.com/read', isGooglePreview: true })).toBe(false);
    });

    it('rejects invalid or placeholder URL values', () => {
      expect(isVerifiedPdf({ pdf_url: '#' })).toBe(false);
      expect(isVerifiedPdf({ pdf_url: 'javascript:void(0)' })).toBe(false);
      expect(isVerifiedPdf({ pdf_url: 'not-a-valid-url' })).toBe(false);
      expect(isVerifiedPdf({ pdf_url: '' })).toBe(false);
      expect(isVerifiedPdf({ pdf_url: null })).toBe(false);
    });
  });

  // Metadata completeness validation
  describe('Metadata completeness checks', () => {
    it('recognizes complete metadata when title, author, cover, description, and language exist', () => {
      expect(hasCompleteMetadata(completeVerifiedPdf)).toBe(true);
    });

    it('detects incomplete metadata when cover is missing', () => {
      expect(hasCompleteMetadata(partialVerifiedPdfNoCover)).toBe(false);
    });

    it('detects incomplete metadata when description is missing or too brief', () => {
      expect(hasCompleteMetadata(partialVerifiedPdfNoDesc)).toBe(false);
      expect(hasCompleteMetadata({ ...completeVerifiedPdf, description: 'Short' })).toBe(false);
    });

    it('detects incomplete metadata when author is unknown or anonymous', () => {
      expect(hasCompleteMetadata({ ...completeVerifiedPdf, author: 'Unknown Author' })).toBe(false);
      expect(hasCompleteMetadata({ ...completeVerifiedPdf, author: 'Anonymous' })).toBe(false);
    });

    it('detects incomplete metadata when language is missing', () => {
      expect(hasCompleteMetadata({ ...completeVerifiedPdf, language: '' })).toBe(false);
    });
  });

  // Other verified formats detection
  describe('Requirement 4: Other verified full-text formats', () => {
    it('identifies verified EPUB files', () => {
      expect(hasOtherVerifiedFullText(verifiedEpubBook)).toBe(true);
    });

    it('identifies verified official HTML/reader assets', () => {
      expect(hasOtherVerifiedFullText(officialHtmlReaderBook)).toBe(true);
    });

    it('does not classify verified PDFs as other formats', () => {
      expect(hasOtherVerifiedFullText(completeVerifiedPdf)).toBe(false);
    });

    it('does not classify broken or unverified links as verified full-text', () => {
      expect(hasOtherVerifiedFullText(brokenLinkBook)).toBe(false);
      expect(hasOtherVerifiedFullText(googlePreviewBook)).toBe(false);
    });
  });

  // Unverified/broken link and metadata-only detection
  describe('Requirements 5 & 6: Unverified links and metadata-only records', () => {
    it('identifies broken links and unverified access', () => {
      expect(hasUnverifiedOrBrokenLink(brokenLinkBook)).toBe(true);
      expect(hasUnverifiedOrBrokenLink(unverifiedAccessBook)).toBe(true);
      expect(hasUnverifiedOrBrokenLink(googlePreviewBook)).toBe(true);
    });

    it('identifies metadata-only books with no readable digital assets', () => {
      expect(isMetadataOnly(metadataOnlyBook)).toBe(true);
    });

    it('does not classify books with working reading files as metadata-only', () => {
      expect(isMetadataOnly(completeVerifiedPdf)).toBe(false);
      expect(isMetadataOnly(verifiedEpubBook)).toBe(false);
    });
  });

  // End-to-end score ranking order
  describe('Requirements 2-6: Ranking hierarchy & score boundaries', () => {
    it('ranks verified PDF with complete metadata at the top (Tier 1 > 10,000)', () => {
      const score = getBookCompletenessScore(completeVerifiedPdf);
      expect(score).toBeGreaterThanOrEqual(10000);
    });

    it('ranks verified PDF with incomplete metadata strictly below complete verified books (Tier 2: 7,000-9,999)', () => {
      const scoreComplete = getBookCompletenessScore(completeVerifiedPdf);
      const scoreNoCover = getBookCompletenessScore(partialVerifiedPdfNoCover);
      const scoreNoDesc = getBookCompletenessScore(partialVerifiedPdfNoDesc);

      expect(scoreNoCover).toBeGreaterThanOrEqual(7000);
      expect(scoreNoCover).toBeLessThan(10000);
      expect(scoreNoDesc).toBeGreaterThanOrEqual(7000);
      expect(scoreNoDesc).toBeLessThan(10000);

      expect(scoreComplete).toBeGreaterThan(scoreNoCover);
      expect(scoreComplete).toBeGreaterThan(scoreNoDesc);
    });

    it('ranks other verified full-text formats after verified-PDF group (Tier 3: 5,000-6,999)', () => {
      const scoreNoCover = getBookCompletenessScore(partialVerifiedPdfNoCover);
      const scoreEpub = getBookCompletenessScore(verifiedEpubBook);
      const scoreHtml = getBookCompletenessScore(officialHtmlReaderBook);

      expect(scoreEpub).toBeGreaterThanOrEqual(5000);
      expect(scoreEpub).toBeLessThan(7000);
      expect(scoreHtml).toBeGreaterThanOrEqual(5000);
      expect(scoreHtml).toBeLessThan(7000);

      expect(scoreNoCover).toBeGreaterThan(scoreEpub);
      expect(scoreNoCover).toBeGreaterThan(scoreHtml);
    });

    it('ranks unverified or broken reading links below verified-content books (Tier 4: 3,000-4,999)', () => {
      const scoreEpub = getBookCompletenessScore(verifiedEpubBook);
      const scoreBroken = getBookCompletenessScore(brokenLinkBook);
      const scoreUnverified = getBookCompletenessScore(unverifiedAccessBook);
      const scorePreview = getBookCompletenessScore(googlePreviewBook);

      expect(scoreBroken).toBeGreaterThanOrEqual(3000);
      expect(scoreBroken).toBeLessThan(5000);
      expect(scoreUnverified).toBeGreaterThanOrEqual(3000);
      expect(scoreUnverified).toBeLessThan(5000);
      expect(scorePreview).toBeGreaterThanOrEqual(3000);
      expect(scorePreview).toBeLessThan(5000);

      expect(scoreEpub).toBeGreaterThan(scoreBroken);
      expect(scoreEpub).toBeGreaterThan(scoreUnverified);
      expect(scoreEpub).toBeGreaterThan(scorePreview);
    });

    it('ranks metadata-only books near the bottom (Tier 5: 1,000-2,999)', () => {
      const scoreBroken = getBookCompletenessScore(brokenLinkBook);
      const scoreMetaOnly = getBookCompletenessScore(metadataOnlyBook);
      const scoreGhost = getBookCompletenessScore(ghostRecordBook);

      expect(scoreMetaOnly).toBeGreaterThanOrEqual(1000);
      expect(scoreMetaOnly).toBeLessThan(3000);

      expect(scoreBroken).toBeGreaterThan(scoreMetaOnly);
      expect(scoreMetaOnly).toBeGreaterThan(scoreGhost);
    });
  });

  // End-to-end comparator sort
  describe('Requirements 8-10: Deterministic sort and full catalog preservation', () => {
    it('sorts a mixed catalog into the exact required hierarchical order', () => {
      const mixedBooks = [
        ghostRecordBook,
        metadataOnlyBook,
        brokenLinkBook,
        verifiedEpubBook,
        partialVerifiedPdfNoCover,
        completeVerifiedPdf,
      ];

      const sorted = sortBooksByCompleteness(mixedBooks);

      // Preserves every book in catalog (Requirement 8)
      expect(sorted).toHaveLength(mixedBooks.length);
      expect(sorted.map(b => b.id)).toEqual([
        'book-1-complete-pdf',
        'book-2-pdf-no-cover',
        'book-4-verified-epub',
        'book-6-broken-link',
        'book-9-metadata-only',
        'book-10-ghost',
      ]);
    });

    it('breaks ties deterministically using newest created_at, then title, then id', () => {
      const bookA = {
        ...completeVerifiedPdf,
        id: 'tie-book-a',
        title: 'Alpha Book',
        created_at: '2026-05-01T00:00:00Z',
      };
      const bookB = {
        ...completeVerifiedPdf,
        id: 'tie-book-b',
        title: 'Beta Book',
        created_at: '2026-06-01T00:00:00Z', // Newer date
      };

      // Newer created_at wins
      expect(compareLibraryBooks(bookA, bookB)).toBeGreaterThan(0);
      expect(compareLibraryBooks(bookB, bookA)).toBeLessThan(0);

      // When dates are equal, alphabetical title wins
      const bookC = { ...bookA, id: 'tie-book-c', title: 'Beta Book' };
      expect(compareLibraryBooks(bookA, bookC)).toBeLessThan(0); // 'alpha' comes before 'beta'

      // Consistency: calling comparator twice returns identical result
      expect(compareLibraryBooks(bookA, bookB)).toBe(compareLibraryBooks(bookA, bookB));
    });
  });
});
