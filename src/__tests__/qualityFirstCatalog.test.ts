import { describe, expect, it } from 'vitest';
import {
  createCanonicalClusterKey,
  normalizeAuthor,
  normalizeIsbn,
  normalizeTitle,
} from '@/utils/catalog/metadataNormalization';
import { evaluateBookQuality } from '@/utils/catalog/qualityScoring';
import {
  clusterEditionsIntoWorks,
  identifyJunkCandidate,
  mapRawToEdition,
} from '@/utils/catalog/deduplicationEngine';
import { StandardEbooksAdapter } from '@/utils/catalog/adapters/standardEbooksAdapter';

describe('Quality-First Catalog: Metadata Normalization', () => {
  it('normalizes titles while preserving Hindi and multilingual scripts', () => {
    // English with subtitle and brackets
    const eng = normalizeTitle('Crime and Punishment: A Novel in Six Parts (Vintage Classics)');
    expect(eng.cleanTitle).toBe('Crime and Punishment');
    expect(eng.subtitle).toBe('A Novel in Six Parts');
    expect(eng.editionTag).toBe('Vintage Classics');

    // Hindi / Devanagari script preservation
    const hindi = normalizeTitle('गोदान : एक यथार्थवादी उपन्यास (विशेष संस्करण)');
    expect(hindi.cleanTitle).toBe('गोदान');
    expect(hindi.subtitle).toBe('एक यथार्थवादी उपन्यास');
    expect(hindi.editionTag).toBe('विशेष संस्करण');
  });

  it('inverts author names and strips honorifics while preserving scripts', () => {
    expect(normalizeAuthor('Dostoevsky, Fyodor').normalizedAuthor).toBe('Fyodor Dostoevsky');
    expect(normalizeAuthor('Dr. B. R. Ambedkar').normalizedAuthor).toBe('B. R. Ambedkar');
    expect(normalizeAuthor('मुंशी प्रेमचंद').normalizedAuthor).toBe('मुंशी प्रेमचंद');
  });

  it('validates ISBN-10 and ISBN-13 checksums', () => {
    // Valid ISBN-10 (e.g. 0-14-044913-2)
    expect(normalizeIsbn('0-14-044913-2').isValid).toBe(true);
    expect(normalizeIsbn('0140449132').isbn10).toBe('0140449132');

    // Valid ISBN-13 (e.g. 978-0-14-044913-6)
    expect(normalizeIsbn('978-0-14-044913-6').isValid).toBe(true);
    expect(normalizeIsbn('9780140449136').isbn13).toBe('9780140449136');

    // Invalid ISBN
    expect(normalizeIsbn('1234567890').isValid).toBe(false);
  });

  it('generates consistent canonical cluster keys for matching editions', () => {
    const key1 = createCanonicalClusterKey('War and Peace: Volume 1', 'Tolstoy, Leo');
    const key2 = createCanonicalClusterKey('War and Peace (Illustrated)', 'Leo Tolstoy');
    expect(key1).toBe(key2);

    // Different author produces different cluster
    const keyDiffAuthor = createCanonicalClusterKey('War and Peace', 'John Doe');
    expect(key1).not.toBe(keyDiffAuthor);
  });
});

describe('Quality-First Catalog: 100-Point Quality Scoring', () => {
  it('awards high score to professionally edited Standard Ebooks with EPUB', () => {
    const result = evaluateBookQuality({
      title: 'Frankenstein',
      author: 'Mary Shelley',
      description: 'The classic gothic horror story of Victor Frankenstein and his creature.',
      coverImageUrl: 'https://standardebooks.org/covers/frank-L.jpg',
      epubUrl: 'https://standardebooks.org/downloads/frank.epub',
      sourceProvider: 'standardebooks',
      pages: 280,
    });

    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.accessStatus).toBe('carefully_edited');
    expect(result.licenseEvidence).toBe('public_domain');
    expect(result.breakdown.contentIntegrity).toBeGreaterThanOrEqual(25);
    expect(result.breakdown.editorialAssurance).toBe(15);
  });

  it('recognizes open textbooks and peer-reviewed educational assurance', () => {
    const result = evaluateBookQuality({
      title: 'Introduction to Computer Science',
      author: 'Alice Smith',
      description: 'Comprehensive college level computer science curriculum.',
      pdfUrl: 'https://open.umn.edu/textbooks/cs.pdf',
      sourceProvider: 'opentextbook',
      isPeerReviewed: true,
      pages: 450,
    });

    expect(result.accessStatus).toBe('open_textbook');
    expect(result.licenseEvidence).toBe('open_access');
    expect(result.breakdown.editorialAssurance).toBe(14);
  });

  it('correctly classifies Google Books as preview_only with lower content score', () => {
    const result = evaluateBookQuality({
      title: 'Modern Physics',
      author: 'Bob Vance',
      description: 'Physics preview book',
      pdfUrl: 'https://books.google.com/books?id=123&preview=true',
      sourceProvider: 'google',
    });

    expect(result.accessStatus).toBe('preview_only');
    expect(result.breakdown.contentIntegrity).toBeLessThanOrEqual(5);
  });

  it('penalizes empty ghost records while judging educational books on content rather than blanket penalties', () => {
    const ghost = evaluateBookQuality({
      title: 'Random Unknown Book',
      author: 'Unknown Author',
    });
    expect(ghost.breakdown.demotions).toBeGreaterThan(0);
    expect(ghost.score).toBeLessThan(30);

    const ncert = evaluateBookQuality({
      title: 'NCERT Class 10 Science',
      author: 'NCERT Editorial Board',
      pdfUrl: 'https://ncert.nic.in/science.pdf',
    });
    expect(ncert.breakdown.contentIntegrity).toBeGreaterThanOrEqual(18);
    expect(ncert.score).toBeGreaterThanOrEqual(40);
  });
});

describe('Quality-First Catalog: Deduplication & Best Edition Selection', () => {
  it('selects the best-quality edition as preferred, preserves alternatives, and backfills metadata', () => {
    const edition1 = mapRawToEdition({
      id: 'ed-gutenberg',
      title: 'Pride and Prejudice',
      author: 'Austen, Jane',
      pdf_url: 'https://www.gutenberg.org/files/1342/1342-pdf.pdf',
      publication_year: 1813,
    }, 'gutenberg');

    const edition2 = mapRawToEdition({
      id: 'ed-standard',
      title: 'Pride and Prejudice (Annotated Edition)',
      author: 'Jane Austen',
      epub_url: 'https://standardebooks.org/ebooks/jane-austen/pride-and-prejudice/downloads/pride-and-prejudice.epub',
      cover_image_url: 'https://covers.openlibrary.org/b/id/12345-L.jpg',
      description: 'A masterpiece of romantic fiction featuring Elizabeth Bennet and Mr. Darcy.',
      isbn: '978-0-14-143951-8',
      pages: 432,
    }, 'standardebooks');

    const works = clusterEditionsIntoWorks([edition1, edition2]);

    expect(works).toHaveLength(1);
    const work = works[0];

    // Standard Ebooks edition should win as the preferred edition
    expect(work.preferredEdition.id).toBe('ed-standard');
    expect(work.preferredEdition.isPreferredEdition).toBe(true);
    expect(work.preferredEdition.accessStatus).toBe('carefully_edited');

    // Alternative edition should be preserved
    expect(work.alternativeEditions).toHaveLength(1);
    expect(work.alternativeEditions[0].id).toBe('ed-gutenberg');
    expect(work.totalEditionsCount).toBe(2);

    // Publication year was backfilled from edition 1 into preferred edition!
    expect(work.preferredEdition.publicationYear).toBe(1813);
  });

  it('detects fake titles and empty ghost books', () => {
    expect(identifyJunkCandidate({ title: 'test' }).isJunk).toBe(true);
    expect(identifyJunkCandidate({ title: 'untitled' }).isJunk).toBe(true);
    expect(identifyJunkCandidate({ title: 'a' }).isJunk).toBe(true);

    // Legitimate book with content is not junk
    expect(identifyJunkCandidate({
      title: 'The Republic',
      author: 'Plato',
      pdf_url: 'https://example.com/republic.pdf',
    }).isJunk).toBe(false);

    // Empty record with no content, cover or description is junk
    expect(identifyJunkCandidate({
      title: 'Some Ghost Book',
      author: 'Some Author',
    }).isJunk).toBe(true);
  });
});

describe('Quality-First Catalog: Standard Ebooks Feed Parsing', () => {
  it('parses Atom XML feed entries correctly', () => {
    const sampleXml = `<?xml version="1.0" encoding="utf-8"?>
    <feed xmlns="http://www.w3.org/2005/Atom">
      <title>Standard Ebooks New Releases</title>
      <entry xml:lang="en">
        <id>https://standardebooks.org/ebooks/h-g-wells/the-time-machine</id>
        <title>The Time Machine</title>
        <author><name>H. G. Wells</name></author>
        <summary>A Victorian scientist invents a machine that can travel through time.</summary>
        <link href="https://standardebooks.org/ebooks/h-g-wells/the-time-machine/downloads/h-g-wells_the-time-machine.epub" rel="enclosure" type="application/epub+zip" />
        <link href="https://standardebooks.org/ebooks/h-g-wells/the-time-machine/cover-thumbnail.jpg" rel="http://opds-spec.org/image/thumbnail" type="image/jpeg" />
        <published>2026-01-01T00:00:00Z</published>
      </entry>
    </feed>`;

    const adapter = new StandardEbooksAdapter();
    const entries = adapter.parseAtomFeed(sampleXml);

    expect(entries).toHaveLength(1);
    expect(entries[0].title).toBe('The Time Machine');
    expect(entries[0].author).toBe('H. G. Wells');
    expect(entries[0].epubUrl).toContain('the-time-machine.epub');
    expect(entries[0].coverUrl).toContain('cover-thumbnail.jpg');
  });
});

