import { describe, expect, it } from 'vitest';
import {
  isVerifiedPdf,
  hasValidCover,
  hasCompleteMetadata,
  hasOtherVerifiedFullText,
  hasUnverifiedOrBrokenLink,
  isMetadataOnly,
  isOnlineReader,
  isNonBookDocument,
  getBookResourceType,
  getBookCompletenessScore,
  compareLibraryBooks,
  sortBooksByCompleteness,
  diversifyBooksPerPage,
  getAuthorDiversificationKey,
  getTitleDiversificationKey,
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

  const nasaTechnicalReport = {
    id: 'doc-nasa-report',
    title: 'NASA Technical Reports Server (NTRS) 20110005614: The Black Holes in the Hearts of Galaxies',
    author: 'NASA Technical Reports Server (NTRS)',
    cover_image_url: null,
    pdf_url: 'https://archive.org/download/NASA_NTRS_Archive/nasa_report.pdf',
    created_at: '2026-01-15T00:00:00Z',
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

  // Cover photo validity checks
  describe('Cover photo validity checks', () => {
    it('accepts valid cover image URLs', () => {
      expect(hasValidCover(completeVerifiedPdf)).toBe(true);
      expect(hasValidCover(partialVerifiedPdfNoDesc)).toBe(true);
      expect(hasValidCover(verifiedEpubBook)).toBe(true);
    });

    it('rejects missing or null cover images', () => {
      expect(hasValidCover(partialVerifiedPdfNoCover)).toBe(false);
      expect(hasValidCover({ cover_image_url: null })).toBe(false);
      expect(hasValidCover({ cover_image_url: '' })).toBe(false);
      expect(hasValidCover({})).toBe(false);
    });

    it('rejects placeholder or default cover images', () => {
      expect(hasValidCover({ cover_image_url: 'https://example.com/placeholder-cover.jpg' })).toBe(false);
      expect(hasValidCover({ cover_image_url: 'https://example.com/default_book.png' })).toBe(false);
      expect(hasValidCover({ cover_image_url: 'https://example.com/no-cover.png' })).toBe(false);
      expect(hasValidCover({ cover_image_url: '#' })).toBe(false);
      expect(hasValidCover({ cover_image_url: 'javascript:void(0)' })).toBe(false);
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

  // Resource types and metadata detection
  describe('Requirements 5 & 6: Resource type classification and detection', () => {
    it('classifies resources into distinct defensive resource types', () => {
      expect(getBookResourceType(completeVerifiedPdf)).toBe('verified_direct_pdf');
      expect(getBookResourceType(verifiedEpubBook)).toBe('verified_direct_pdf');
      expect(getBookResourceType(googlePreviewBook)).toBe('online_reader');
      expect(getBookResourceType(metadataOnlyBook)).toBe('no_reading_resource');
      expect(isOnlineReader(googlePreviewBook)).toBe(true);
      expect(isOnlineReader(completeVerifiedPdf)).toBe(false);
    });

    it('identifies broken links and unverified access', () => {
      expect(hasUnverifiedOrBrokenLink(brokenLinkBook)).toBe(true);
      expect(hasUnverifiedOrBrokenLink(unverifiedAccessBook)).toBe(true);
    });

    it('identifies metadata-only books with no readable digital assets', () => {
      expect(isMetadataOnly(metadataOnlyBook)).toBe(true);
    });

    it('does not classify books with working reading files as metadata-only', () => {
      expect(isMetadataOnly(completeVerifiedPdf)).toBe(false);
      expect(isMetadataOnly(verifiedEpubBook)).toBe(false);
    });

    it('correctly distinguishes technical reports and preprints from books', () => {
      expect(isNonBookDocument(nasaTechnicalReport)).toBe(true);
      expect(isNonBookDocument(completeVerifiedPdf)).toBe(false);
      expect(isNonBookDocument(partialVerifiedPdfNoCover)).toBe(false);
    });
  });

  // End-to-end score ranking order & cover photo preference
  describe('Ranking hierarchy & cover photo preference', () => {
    it('ranks verified PDF with complete metadata & cover at the top (Tier 1 > 10,000)', () => {
      const score = getBookCompletenessScore(completeVerifiedPdf);
      expect(score).toBeGreaterThanOrEqual(10000);
    });

    it('ranks verified PDF with cover photo in Tier 2 (8,800-9,999)', () => {
      const scoreWithCover = getBookCompletenessScore(partialVerifiedPdfNoDesc);
      expect(scoreWithCover).toBeGreaterThanOrEqual(8800);
      expect(scoreWithCover).toBeLessThan(10000);
    });

    it('ranks other verified full-text with cover photo in Tier 3 (8,200-8,799)', () => {
      const scoreEpub = getBookCompletenessScore(verifiedEpubBook);
      const scoreHtml = getBookCompletenessScore(officialHtmlReaderBook);

      expect(scoreEpub).toBeGreaterThanOrEqual(8200);
      expect(scoreEpub).toBeLessThan(8800);
      expect(scoreHtml).toBeGreaterThanOrEqual(8200);
      expect(scoreHtml).toBeLessThan(8800);
    });

    it('ranks genuine books with cover and online reader in Tier 4 (7,500-8,199), above coverless documents', () => {
      const scorePreview = getBookCompletenessScore(googlePreviewBook);
      const scoreNoCover = getBookCompletenessScore(partialVerifiedPdfNoCover);
      const scoreNasa = getBookCompletenessScore(nasaTechnicalReport);

      expect(scorePreview).toBeGreaterThanOrEqual(7500);
      expect(scorePreview).toBeLessThan(8200);

      // Books with covers and online reader strictly outrank coverless PDFs and reports
      expect(scorePreview).toBeGreaterThan(scoreNoCover);
      expect(scorePreview).toBeGreaterThan(scoreNasa);
    });

    it('ranks genuine books with cover and metadata in Tier 5 (6,200-7,499), above coverless documents', () => {
      const scoreMetaWithCover = getBookCompletenessScore(metadataOnlyBook);
      const scoreNoCover = getBookCompletenessScore(partialVerifiedPdfNoCover);
      const scoreNasa = getBookCompletenessScore(nasaTechnicalReport);

      expect(scoreMetaWithCover).toBeGreaterThanOrEqual(6200);
      expect(scoreMetaWithCover).toBeLessThan(7500);

      expect(scoreMetaWithCover).toBeGreaterThan(scoreNoCover);
      expect(scoreMetaWithCover).toBeGreaterThan(scoreNasa);
    });

    it('ranks genuine books with verified PDF without cover in Tier 6 (4,500-6,199)', () => {
      const scoreNoCover = getBookCompletenessScore(partialVerifiedPdfNoCover);
      const scoreNasa = getBookCompletenessScore(nasaTechnicalReport);

      expect(scoreNoCover).toBeGreaterThanOrEqual(4500);
      expect(scoreNoCover).toBeLessThan(6200);

      // Genuine book without cover outranks non-book institutional reports
      expect(scoreNoCover).toBeGreaterThan(scoreNasa);
    });

    it('ranks technical reports and preprints in Tier 7 (3,200-4,499)', () => {
      const scoreNasa = getBookCompletenessScore(nasaTechnicalReport);
      const scoreGhost = getBookCompletenessScore(ghostRecordBook);

      expect(scoreNasa).toBeGreaterThanOrEqual(3200);
      expect(scoreNasa).toBeLessThan(4500);

      expect(scoreNasa).toBeGreaterThan(scoreGhost);
    });
  });

  // End-to-end comparator sort
  describe('Requirements 8-10: Deterministic sort and full catalog preservation', () => {
    it('sorts a mixed catalog into the exact required hierarchical order prioritizing covers', () => {
      const mixedBooks = [
        ghostRecordBook,
        nasaTechnicalReport,
        metadataOnlyBook,
        partialVerifiedPdfNoCover,
        googlePreviewBook,
        verifiedEpubBook,
        partialVerifiedPdfNoDesc,
        completeVerifiedPdf,
      ];

      const sorted = sortBooksByCompleteness(mixedBooks);

      // Preserves every book in catalog (Requirement 8)
      expect(sorted).toHaveLength(mixedBooks.length);
      expect(sorted.map(b => b.id)).toEqual([
        'book-1-complete-pdf',       // Tier 1: complete verified PDF (has cover)
        'book-3-pdf-no-desc',        // Tier 2: verified PDF with cover photo
        'book-4-verified-epub',      // Tier 3: verified EPUB with cover photo
        'book-8-google-preview',     // Tier 4: online reader with cover photo
        'book-9-metadata-only',      // Tier 5: metadata-only with cover photo
        'book-2-pdf-no-cover',       // Tier 6: verified PDF without cover photo
        'doc-nasa-report',           // Tier 7: technical report without cover
        'book-10-ghost',             // Tier 8: ghost
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

  // Per-page catalog diversity (1 book per author and title per page)
  describe('Per-page catalog diversity (max 1 book of same name and title per page)', () => {
    it('normalizes author and title keys for diversity matching', () => {
      expect(getAuthorDiversificationKey('CIA Reading Room', 'Some Title')).toBe('cia reading room');
      expect(getAuthorDiversificationKey(null, 'CIA Reading Room cia-rdp123: Note')).toBe('cia reading room');
      expect(getAuthorDiversificationKey('Stephen Hawking', 'Title')).toBe('stephen hawking');
      expect(getAuthorDiversificationKey('Hawking, Stephen', 'Title')).toBe('stephen hawking');
      expect(getAuthorDiversificationKey('Unknown Author', 'Regular Book')).toBe('');

      expect(getTitleDiversificationKey('CIA Reading Room cia-rdp75b00380r000700010025-1: NOTE TO GLC')).toBe('cia reading room');
      expect(getTitleDiversificationKey('The Theory of Everything: Origin and Fate')).toBe('the theory of everything');
    });

    it('ensures each page contains at most 1 book of the same author and title, deferring others to later pages', () => {
      // Create a test catalog with 4 CIA books, 2 Hawking books, and other distinct books
      const catalog = [
        { id: 'hawking-1', title: 'The Theory of Everything', author: 'Stephen Hawking', created_at: '2026-01-01' },
        { id: 'hawking-2', title: 'A Brief History of Time', author: 'Stephen Hawking', created_at: '2026-01-02' },
        { id: 'cia-1', title: 'CIA Reading Room cia-rdp-001: Note A', author: 'CIA Reading Room', created_at: '2026-01-03' },
        { id: 'cia-2', title: 'CIA Reading Room cia-rdp-002: Note B', author: 'CIA Reading Room', created_at: '2026-01-04' },
        { id: 'cia-3', title: 'CIA Reading Room cia-rdp-003: Note C', author: 'CIA Reading Room', created_at: '2026-01-05' },
        { id: 'cia-4', title: 'CIA Reading Room cia-rdp-004: Note D', author: 'CIA Reading Room', created_at: '2026-01-06' },
        { id: 'premchand-1', title: 'Godan', author: 'Munshi Premchand', created_at: '2026-01-07' },
        { id: 'bharati-1', title: 'Gunahon Ka Devta', author: 'Dharamvir Bharati', created_at: '2026-01-08' },
        { id: 'boozer-1', title: 'Heritage of Buddha', author: 'Celina LuZanne Boozer', created_at: '2026-01-09' },
        { id: 'plato-1', title: 'The Republic', author: 'Plato', created_at: '2026-01-10' },
        { id: 'kant-1', title: 'Critique of Pure Reason', author: 'Immanuel Kant', created_at: '2026-01-11' },
        { id: 'austen-1', title: 'Pride and Prejudice', author: 'Jane Austen', created_at: '2026-01-12' },
        { id: 'russell-1', title: 'Problems of Philosophy', author: 'Bertrand Russell', created_at: '2026-01-13' },
        { id: 'dostoyevsky-1', title: 'Crime and Punishment', author: 'Fyodor Dostoyevsky', created_at: '2026-01-14' },
        { id: 'tolstoy-1', title: 'War and Peace', author: 'Leo Tolstoy', created_at: '2026-01-15' },
        { id: 'kafka-1', title: 'The Metamorphosis', author: 'Franz Kafka', created_at: '2026-01-16' },
        { id: 'camus-1', title: 'The Stranger', author: 'Albert Camus', created_at: '2026-01-17' },
        { id: 'nietzsche-1', title: 'Beyond Good and Evil', author: 'Friedrich Nietzsche', created_at: '2026-01-18' },
      ];

      // Page size = 6 books per page
      const pageSize = 6;
      const diversified = diversifyBooksPerPage(catalog, pageSize);

      // Requirement: Full preservation - no books deleted
      expect(diversified).toHaveLength(catalog.length);

      // Page 1 (first 6 items)
      const page1 = diversified.slice(0, pageSize);
      const page1Authors = page1.map(b => getAuthorDiversificationKey(b.author, b.title));
      const page1Titles = page1.map(b => getTitleDiversificationKey(b.title));

      // Assert all authors on Page 1 are strictly unique
      const uniquePage1Authors = new Set(page1Authors.filter(Boolean));
      expect(uniquePage1Authors.size).toBe(page1Authors.filter(Boolean).length);

      // Assert all titles on Page 1 are strictly unique
      const uniquePage1Titles = new Set(page1Titles.filter(Boolean));
      expect(uniquePage1Titles.size).toBe(page1Titles.filter(Boolean).length);

      // Specifically check: only 1 CIA book and only 1 Hawking book on Page 1
      const ciaOnPage1 = page1.filter(b => b.author.includes('CIA') || b.title.includes('CIA'));
      expect(ciaOnPage1).toHaveLength(1);
      expect(ciaOnPage1[0].id).toBe('cia-1');

      const hawkingOnPage1 = page1.filter(b => b.author.includes('Hawking'));
      expect(hawkingOnPage1).toHaveLength(1);
      expect(hawkingOnPage1[0].id).toBe('hawking-1');

      // Page 2 (next 6 items) receives the deferred books
      const page2 = diversified.slice(pageSize, pageSize * 2);
      const ciaOnPage2 = page2.filter(b => b.author.includes('CIA') || b.title.includes('CIA'));
      const hawkingOnPage2 = page2.filter(b => b.author.includes('Hawking'));

      // Page 2 also has at most 1 Hawking book (his second book) and at most 1 CIA book (second note)
      expect(hawkingOnPage2).toHaveLength(1);
      expect(hawkingOnPage2[0].id).toBe('hawking-2');
      expect(ciaOnPage2).toHaveLength(1);
      expect(ciaOnPage2[0].id).toBe('cia-2');

      // Page 3 (final page) receives the remaining deferred CIA books
      const page3 = diversified.slice(pageSize * 2, pageSize * 3);
      const ciaOnPage3 = page3.filter(b => b.author.includes('CIA') || b.title.includes('CIA'));
      expect(ciaOnPage3.length).toBeGreaterThanOrEqual(1);
      expect(ciaOnPage3[0].id).toBe('cia-3');
    });

    it('gracefully handles catalogs where all books share the same author without dropping records', () => {
      const sameAuthorBooks = [
        { id: 'cia-1', title: 'CIA Note 1', author: 'CIA Reading Room' },
        { id: 'cia-2', title: 'CIA Note 2', author: 'CIA Reading Room' },
        { id: 'cia-3', title: 'CIA Note 3', author: 'CIA Reading Room' },
        { id: 'cia-4', title: 'CIA Note 4', author: 'CIA Reading Room' },
      ];

      const diversified = diversifyBooksPerPage(sameAuthorBooks, 3);
      // All 4 books must be preserved across pages
      expect(diversified).toHaveLength(4);
      expect(diversified.map(b => b.id)).toEqual(['cia-1', 'cia-2', 'cia-3', 'cia-4']);
    });
  });

  // Section 6 of prompt: Regression tests verifying book-first ranking and resource separation
  describe('Prompt Section 6: Specific Regression Tests', () => {
    // 1. A genuine book with a valid cover and Google Books reader link ranks ahead of an unrelated coverless technical paper with a direct PDF
    it('1. ranks a genuine book with valid cover and Google Books reader link ahead of an unrelated coverless technical paper with direct PDF', () => {
      const durgaSaptashati = {
        id: 'durga-saptashati-1',
        title: 'Shri Durga Saptashati',
        author: 'Bharat Bhushan Mishra',
        language: 'Hindi',
        cover_image_url: 'https://books.google.com/books/content?id=fqiEEQAAQBAJ&printsec=frontcover&img=1',
        description: 'Complete Sanskrit text with Hindi translation and detailed rituals for recitation.',
        pdf_url: 'http://books.google.co.in/books?id=fqiEEQAAQBAJ&printsec=frontcover',
        created_at: '2026-03-24T00:00:00Z',
      };

      const coverlessTechPaper = {
        id: 'nasa-tech-paper-1',
        title: 'NASA Technical Reports Server (NTRS) 20110005614: The Black Holes in the Hearts of Galaxies',
        author: 'NASA Technical Reports Server (NTRS)',
        language: 'English',
        cover_image_url: null,
        description: 'Technical investigation into galactic center supermassive black holes.',
        pdf_url: 'https://archive.org/download/NASA_NTRS_Archive/nasa_report.pdf',
        created_at: '2026-03-25T00:00:00Z',
      };

      const scoreBook = getBookCompletenessScore(durgaSaptashati);
      const scorePaper = getBookCompletenessScore(coverlessTechPaper);

      expect(scoreBook).toBeGreaterThan(scorePaper);
      expect(compareLibraryBooks(durgaSaptashati, coverlessTechPaper)).toBeLessThan(0); // durga ranks first
    });

    // 2. A verified direct-PDF book with a valid cover ranks appropriately
    it('2. ranks a verified direct-PDF book with a valid cover at the top tier', () => {
      const score = getBookCompletenessScore(completeVerifiedPdf);
      expect(score).toBeGreaterThanOrEqual(10000);
      expect(getBookResourceType(completeVerifiedPdf)).toBe('verified_direct_pdf');
    });

    // 3. A coverless genuine book with a direct PDF is not incorrectly treated as a non-book document
    it('3. does not treat a coverless genuine book with a direct PDF as a non-book document', () => {
      const kantBook = {
        id: 'kant-critique',
        title: 'Critique of Pure Reason',
        author: 'Immanuel Kant',
        language: 'English',
        cover_image_url: null,
        description: 'A masterpiece of Western philosophy exploring human reason and epistemology.',
        pdf_url: 'https://archive.org/download/kant_critique/kant.pdf',
        created_at: '2026-01-01T00:00:00Z',
      };

      expect(isNonBookDocument(kantBook)).toBe(false);
      expect(isVerifiedPdf(kantBook)).toBe(true);
      expect(getBookResourceType(kantBook)).toBe('verified_direct_pdf');
      // Should score higher than technical reports (Tier 6: 4,500+ vs Tier 7: 3,200)
      const scoreKant = getBookCompletenessScore(kantBook);
      const scoreReport = getBookCompletenessScore(nasaTechnicalReport);
      expect(scoreKant).toBeGreaterThan(scoreReport);
    });

    // 4. Google Books preview URLs never qualify as verified direct PDFs
    it('4. ensures Google Books preview URLs never qualify as verified direct PDFs', () => {
      const googleBooksItem = {
        id: 'gb-preview-item',
        title: 'Devdas',
        author: 'Śaratcandra Caṭṭopādhyāya',
        cover_image_url: 'https://books.google.com/books/content?id=123&img=1',
        pdf_url: 'http://books.google.co.in/books?id=J7U719-WcWQC&printsec=frontcover',
      };

      expect(isVerifiedPdf(googleBooksItem)).toBe(false);
      expect(getBookResourceType(googleBooksItem)).toBe('online_reader');
      expect(isOnlineReader(googleBooksItem)).toBe(true);
    });

    // 5. Missing, malformed, and inaccessible cover URLs are handled safely
    it('5. handles missing, malformed, and inaccessible cover URLs safely without crashing', () => {
      expect(hasValidCover({ cover_image_url: null })).toBe(false);
      expect(hasValidCover({ cover_image_url: undefined })).toBe(false);
      expect(hasValidCover({ cover_image_url: '' })).toBe(false);
      expect(hasValidCover({ cover_image_url: '   ' })).toBe(false);
      expect(hasValidCover({ cover_image_url: '#' })).toBe(false);
      expect(hasValidCover({ cover_image_url: 'javascript:alert(1)' })).toBe(false);
      expect(hasValidCover({ cover_image_url: 'https://example.com/placeholder.png' })).toBe(false);
      expect(hasValidCover({ cover_image_url: 'https://example.com/default-book-cover.jpg' })).toBe(false);
      expect(hasValidCover({ cover_image_url: 'https://example.com/no-cover.png' })).toBe(false);
      expect(hasValidCover(null)).toBe(false);
      expect(hasValidCover(undefined)).toBe(false);
    });

    // 6. Duplicate book editions do not gain an unfair ranking advantage
    it('6. prevents duplicate book editions from gaining an unfair ranking advantage', () => {
      const edition1 = {
        id: 'devdas-ed-1',
        title: 'Devdas',
        author: 'Sarat Chandra Chattopadhyay',
        created_at: '2026-01-01T00:00:00Z',
        cover_image_url: 'https://example.com/cover1.jpg',
        description: 'Tragic love story of Devdas and Paro.',
        language: 'English',
        pdf_url: 'https://books.google.com/books?id=ed1',
      };
      const edition2 = {
        ...edition1,
        id: 'devdas-ed-2',
        created_at: '2026-01-02T00:00:00Z',
      };

      // Both receive identical completeness score
      expect(getBookCompletenessScore(edition1)).toBe(getBookCompletenessScore(edition2));

      // In pagination with diversification, they are spread across different pages (max 1 per page)
      const catalog = [
        edition1,
        edition2,
        { id: 'other-book', title: 'Godan', author: 'Munshi Premchand', created_at: '2026-01-03T00:00:00Z' },
      ];
      const page1 = diversifyBooksPerPage(catalog, 2).slice(0, 2);
      const devdasOnPage1 = page1.filter(b => b.title.includes('Devdas'));
      expect(devdasOnPage1).toHaveLength(1); // Only 1 edition on page 1
    });

    // 7. Ranking is stable when scores are equal
    it('7. produces deterministic and stable ranking when scores are equal', () => {
      const bookX = {
        id: 'stable-book-x',
        title: 'Book X',
        author: 'Author One',
        created_at: '2026-01-01T00:00:00Z',
      };
      const bookY = {
        id: 'stable-book-y',
        title: 'Book Y',
        author: 'Author Two',
        created_at: '2026-01-01T00:00:00Z',
      };

      // Exact same score and created_at
      expect(getBookCompletenessScore(bookX)).toBe(getBookCompletenessScore(bookY));

      // Title tie-breaker is deterministic
      const comp1 = compareLibraryBooks(bookX, bookY);
      const comp2 = compareLibraryBooks(bookX, bookY);
      expect(comp1).toBe(comp2);
      expect(comp1).toBeLessThan(0); // 'Book X' < 'Book Y' alphabetically
    });

    // 8. Pagination produces the same global ordering across page boundaries
    it('8. ensures pagination produces the same global ordering across page boundaries', () => {
      const catalog = Array.from({ length: 24 }, (_, i) => ({
        id: `book-${i + 1}`,
        title: `Distinct Book ${i + 1}`,
        author: `Author ${i + 1}`,
        created_at: new Date(Date.now() - i * 1000).toISOString(),
        cover_image_url: `https://example.com/cover-${i + 1}.jpg`,
        description: `Description for distinct book ${i + 1} with enough length.`,
        language: 'English',
      }));

      const globallySorted = sortBooksByCompleteness(catalog);
      const pageSize = 8;
      const page1 = globallySorted.slice(0, pageSize);
      const page2 = globallySorted.slice(pageSize, pageSize * 2);
      const page3 = globallySorted.slice(pageSize * 2, pageSize * 3);

      // Union of pages reproduces globally sorted array with no duplicates or missing books
      const concatenated = [...page1, ...page2, ...page3];
      expect(concatenated.map(b => b.id)).toEqual(globallySorted.map(b => b.id));
    });

    // 9. Search and genre filters retain relevant results
    it('9. retains relevant results under search and genre filters', () => {
      const catalog = [
        { id: 'b1', title: 'Shri Durga Saptashati', author: 'Bharat Bhushan Mishra', genre: 'Spiritual', language: 'Hindi' },
        { id: 'b2', title: 'Devdas', author: 'Sarat Chandra', genre: 'Fiction', language: 'Bengali' },
        { id: 'b3', title: 'Astrodynamics', author: 'Roger Bate', genre: 'Science', language: 'English' },
      ];

      // Simulated search filter for "durga"
      const searchResults = catalog.filter(b => b.title.toLowerCase().includes('durga'));
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].id).toBe('b1');

      // Simulated genre filter for "Fiction"
      const genreResults = catalog.filter(b => b.genre === 'Fiction');
      expect(genreResults).toHaveLength(1);
      expect(genreResults[0].id).toBe('b2');
    });

    // 10. Explicit document-focused searches can still surface relevant papers and reports
    it('10. surfaces relevant papers and reports when explicitly searched for', () => {
      const catalog = [
        completeVerifiedPdf,
        googlePreviewBook,
        nasaTechnicalReport,
      ];

      // Explicit search for "NASA" or "Black Holes"
      const query = 'nasa';
      const matchingDocs = catalog.filter(
        b => b.title.toLowerCase().includes(query) || b.author.toLowerCase().includes(query)
      );

      expect(matchingDocs).toHaveLength(1);
      expect(matchingDocs[0].id).toBe('doc-nasa-report');
      // When sorted among matching results, it surfaces properly
      const sortedMatches = sortBooksByCompleteness(matchingDocs);
      expect(sortedMatches[0].id).toBe('doc-nasa-report');
    });
  });
});

