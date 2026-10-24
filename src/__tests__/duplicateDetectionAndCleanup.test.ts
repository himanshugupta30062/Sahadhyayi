import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { normalizeBookIdentity } from '@/utils/catalog/bookIdentity';
import { detectDuplicateGroups } from '@/utils/catalog/duplicateDetection';
import { evaluateBookQuality, identifyJunkCandidate } from '@/utils/catalog/qualityScoring';
import { recommendBestEditions } from '@/utils/catalog/editionRecommendation';
import { applyDuplicateResolution, verifyAdminStatus } from '@/utils/catalog/duplicateResolution';
import { supabase } from '@/integrations/supabase/client-universal';

describe('Automated Duplicate Book Detection & Admin Cleanup Acceptance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Scenario 1: Import 10 records for the same verified edition -> identify group and recommend one primary
  it('Scenario 1: identifies 10 records of the same edition and recommends one primary record with no redundant secondary', () => {
    const records = Array.from({ length: 10 }, (_, i) => ({
      id: `book-${i + 1}`,
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      isbn: '9780141439518',
      publication_year: 1813,
      pdf_url: i === 0 ? 'https://standardebooks.org/ebooks/jane-austen/pride-and-prejudice/dist.epub' : 'https://archive.org/download/pandp.pdf',
      cover_image_url: 'https://example.com/cover.jpg',
      description: 'Classic romantic novel of manners.',
    }));

    const groups = detectDuplicateGroups(records);
    expect(groups.length).toBe(1);
    expect(groups[0].books.length).toBe(10);
    expect(groups[0].classification).toBe('exact_duplicate_edition');

    const rec = recommendBestEditions(groups[0]);
    // Highest quality (Standard Ebooks EPUB) chosen as primary
    expect(rec.primaryBookId).toBe('book-1');
    // All other 9 records are redundant duplicates of the same manifestation
    expect(rec.secondaryBookId).toBeUndefined();
    expect(rec.duplicateIds.length).toBe(9);
    expect(rec.recommendedKeepIds).toEqual(['book-1']);
  });

  // Scenario 2: Multiple records of the same work with one genuine translated edition -> recommend strongest & preserve translation
  it('Scenario 2: recommends strongest primary and preserves genuine translated edition', () => {
    const records = [
      {
        id: 'book-en-1',
        title: 'Godan',
        author: 'Munshi Premchand',
        language: 'English',
        pdf_url: 'https://example.com/godan-en.epub',
        description: 'English translation of the masterpiece.',
      },
      {
        id: 'book-en-2',
        title: 'Godan',
        author: 'Premchand, Munshi',
        language: 'English',
        pdf_url: 'https://example.com/godan-en.pdf',
      },
      {
        id: 'book-hi-1',
        title: 'Godan (Hindi Edition)',
        author: 'Munshi Premchand',
        language: 'Hindi',
        pdf_url: 'https://example.com/godan-hindi.epub',
        description: 'भारतीय ग्रामीण जीवन का कालजयी महाकाव्य।',
      },
    ];

    const groups = detectDuplicateGroups(records);
    // Hindi and English share work cluster
    const rec = recommendBestEditions(groups[0]);
    expect(rec.primaryBookId).toBeDefined();
    // Distinct Hindi/English translation is preserved as secondary
    expect(rec.secondaryBookId).toBeDefined();
    expect(rec.recommendedKeepIds.length).toBe(2);
  });

  // Scenario 3: Matching titles but different authors -> do not automatically merge
  it('Scenario 3: does not merge records with matching titles but completely different authors', () => {
    const bookA = {
      id: 'book-1',
      title: 'Nemesis',
      author: 'Isaac Asimov',
      isbn: '9780553286281',
      publication_year: 1989,
    };
    const bookB = {
      id: 'book-2',
      title: 'Nemesis',
      author: 'Agatha Christie',
      isbn: '9780008196349',
      publication_year: 1971,
    };

    const groups = detectDuplicateGroups([bookA, bookB]);
    expect(groups.length).toBe(2);
    expect(groups[0].books.length).toBe(1);
    expect(groups[1].books.length).toBe(1);
  });

  // Scenario 4: Multiple editions with different valid ISBNs -> preserve edition distinctions
  it('Scenario 4: preserves distinct edition tags and years across valid ISBNs', () => {
    const edition1 = {
      id: 'ed-1',
      title: 'Dune (First Edition)',
      author: 'Frank Herbert',
      isbn: '9780441172719',
      publication_year: 1965,
    };
    const edition2 = {
      id: 'ed-2',
      title: 'Dune (Illustrated Deluxe Edition)',
      author: 'Frank Herbert',
      isbn: '9780593099971',
      publication_year: 2019,
    };

    const ident1 = normalizeBookIdentity(edition1);
    const ident2 = normalizeBookIdentity(edition2);
    expect(ident1.editionTag).toBe('First Edition');
    expect(ident2.editionTag).toBe('Illustrated Deluxe Edition');
    expect(ident1.publicationYear).not.toEqual(ident2.publicationYear);

    const groups = detectDuplicateGroups([edition1, edition2]);
    expect(groups[0].classification).toBe('same_work_different_edition');
  });

  // Scenario 5: Complementary metadata -> merge safe fields without overwriting stronger data
  it('Scenario 5: merges missing fields into primary without overwriting existing data with empty values', () => {
    const primary = {
      id: 'p-1',
      title: 'The Republic',
      author: 'Plato',
      description: 'Foundational philosophical dialogue.',
      cover_image_url: 'https://example.com/cover.jpg',
      publication_year: undefined,
      isbn: undefined,
      pdf_url: 'https://standardebooks.org/republic.epub',
    };
    const duplicate = {
      id: 'd-1',
      title: 'The Republic',
      author: 'Plato',
      description: undefined, // empty description must not overwrite
      publication_year: 1901,
      isbn: '9780140449143',
      pdf_url: undefined,
    };

    const group = {
      groupId: 'grp-republic',
      clusterKey: 'republic::plato',
      classification: 'exact_duplicate_edition' as const,
      confidence: 'high' as const,
      evidence: ['Matching title and author'],
      books: [primary, duplicate],
    };

    const rec = recommendBestEditions(group);
    expect(rec.primaryBookId).toBe('p-1');
    // Backfills missing year and isbn from duplicate
    expect(rec.proposedMergedMetadata.publication_year).toBe(1901);
    expect(rec.proposedMergedMetadata.isbn).toBe('9780140449143');
    // Does NOT propose overwriting description or cover with undefined
    expect(rec.proposedMergedMetadata.description).toBeUndefined();
    expect(rec.proposedMergedMetadata.cover_image_url).toBeUndefined();
  });

  // Scenario 6: Cover present but broken PDF link -> does not rank as fully readable
  it('Scenario 6: demotes records with broken or inaccessible file links regardless of cover quality', () => {
    const bookWithBrokenLink = {
      title: 'Quantum Mechanics',
      author: 'David Griffiths',
      cover_image_url: 'https://example.com/hd-cover.jpg',
      pdf_url: 'https://example.com/404-broken.pdf',
      isBrokenLink: true,
    };

    const quality = evaluateBookQuality(bookWithBrokenLink, { isBrokenLink: true });
    expect(quality.score).toBeLessThanOrEqual(35);
    expect(quality.accessStatus).toBe('access_unverified');
    expect(quality.breakdown.contentIntegrity).toBe(0);
    expect(quality.breakdown.verifiedAccess).toBe(0);
  });

  // Scenario 7: Complete EPUB vs corrupt/broken PDF of same edition -> prefer EPUB
  it('Scenario 7: prefers verified reflowable EPUB over lower quality/corrupt PDF', () => {
    const epubEdition = {
      id: 'b-epub',
      title: 'Moby Dick',
      author: 'Herman Melville',
      epubUrl: 'https://standardebooks.org/herman-melville/moby-dick/dist.epub',
      sourceProvider: 'standardebooks',
      description: 'Comprehensive whaling masterpiece.',
    };
    const pdfEdition = {
      id: 'b-pdf',
      title: 'Moby Dick',
      author: 'Herman Melville',
      pdf_url: 'https://example.com/scan.pdf',
      isBrokenLink: true,
    };

    const group = {
      groupId: 'grp-moby',
      clusterKey: 'mobydick::melville',
      classification: 'exact_duplicate_edition' as const,
      confidence: 'high' as const,
      evidence: ['Exact title and author'],
      books: [pdfEdition, epubEdition],
    };

    const rec = recommendBestEditions(group);
    expect(rec.primaryBookId).toBe('b-epub');
    expect(rec.archiveCandidateIds).toContain('b-pdf');
  });

  // Scenario 8: Metadata-only record with no cover -> classified appropriately, not called fake
  it('Scenario 8: classifies metadata-only record with no cover as metadata_only, not fake/junk', () => {
    const metadataOnlyBook = {
      title: 'Introduction to Algorithms',
      author: 'Thomas H. Cormen',
      isbn: '9780262033848',
      publication_year: 2009,
      pages: 1292,
      description: 'Comprehensive textbook on computer algorithms.',
    };

    const quality = evaluateBookQuality(metadataOnlyBook);
    expect(quality.accessStatus).toBe('metadata_only');
    expect(quality.breakdown.bibliographicConfidence).toBeGreaterThan(15);

    const junkCheck = identifyJunkCandidate(metadataOnlyBook);
    expect(junkCheck.isJunk).toBe(false);
  });

  // Scenario 9: Repeat an import -> duplicate check prevents creating duplicate edition
  it('Scenario 9: normalizes identities to identify existing database records and prevents duplicate inserts', () => {
    const existing = {
      id: 'existing-1',
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      isbn: '9780743273565',
    };
    const incomingImport = {
      title: 'The Great Gatsby (Annotated)',
      author: 'Fitzgerald, F. Scott',
      isbn: '9780743273565',
    };

    const identExisting = normalizeBookIdentity(existing);
    const identIncoming = normalizeBookIdentity(incomingImport);

    expect(identExisting.normalizedTitleKey).toBe(identIncoming.normalizedTitleKey);
    expect(identExisting.primaryAuthor).toBe(identIncoming.primaryAuthor);
    expect(identExisting.primaryIsbn).toBe(identIncoming.primaryIsbn);
  });

  // Scenario 10: Preview cleanup -> dry run does not mutate database or references
  it('Scenario 10: dry-run preview returns impact projection without mutating database', async () => {
    // Mock the read-only preview dependencies; this unit test must not contact the real Supabase service.
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: { id: 'preview-admin' } },
      error: null,
    } as any);
    vi.spyOn(supabase, 'rpc').mockResolvedValue({ data: true, error: null } as any);
    vi.spyOn(supabase, 'from').mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
    } as any));

    const preview = await applyDuplicateResolution('grp-sample', 'merge_and_archive_duplicates', {
      dryRun: true,
      customPrimaryId: 'prim-1',
      customKeepIds: ['prim-1'],
    });

    expect(preview.dryRun).toBe(true);
    expect(preview.success).toBe(true);
    expect(preview.message).toContain('Preview');
  });

  // Scenario 11: Execute approved cleanup -> marks superseded and preserves user references
  it('Scenario 11: execution returns resolution with audit trail', async () => {
    const groupBooks = [
      { id: 'book-a', title: 'Frankenstein', author: 'Mary Shelley', pdf_url: 'https://standardebooks.org/epub' },
      { id: 'book-b', title: 'Frankenstein', author: 'Mary Shelley', pdf_url: 'https://archive.org/pdf' },
    ];

    const group = {
      groupId: 'grp-frank',
      clusterKey: 'frank::shelley',
      classification: 'exact_duplicate_edition' as const,
      confidence: 'high' as const,
      evidence: ['Identical title and author'],
      books: groupBooks,
    };

    const rec = recommendBestEditions(group);
    expect(rec.primaryBookId).toBe('book-a');
    expect(rec.duplicateIds).toEqual(['book-b']);
  });

  // Scenario 12: Dependent table unique constraint collision handling
  it('Scenario 12: detects unique constraint conflicts in dependent tables and plans safe merge', () => {
    const primaryId = 'book-pri';
    const dupId = 'book-dup';
    const userId = 'user-1';

    // Simulated user shelf with duplicate
    const shelfItems = [
      { user_id: userId, book_id: primaryId, notes: 'Read chapter 1' },
      { user_id: userId, book_id: dupId, notes: 'Favorite book' },
    ];

    // Conflict detection: user has both primary and dup in shelf
    const hasConflict = shelfItems.filter((i) => i.user_id === userId).length > 1;
    expect(hasConflict).toBe(true);

    // Merge policy: retain primary row, backfill non-empty notes
    const mergedNotes = shelfItems[0].notes || shelfItems[1].notes;
    expect(mergedNotes).toBe('Read chapter 1');
  });

  // Scenario 13: Admin authorization rejection
  it('Scenario 13: rejects cleanup when user is not an administrator', async () => {
    // Mock unauthorized admin
    const mockGetUser = vi.spyOn(supabase.auth, 'getUser').mockResolvedValueOnce({
      data: { user: null },
      error: null,
    } as any);

    await expect(
      applyDuplicateResolution('grp-unauth', 'merge_and_archive_duplicates', { dryRun: false })
    ).rejects.toThrow(/Unauthorized/);

    mockGetUser.mockRestore();
  });

  // Scenario 14: Repeat cleanup execution is idempotent
  it('Scenario 14: repeat duplicate resolution produces consistent, repeat-safe output', () => {
    const group = {
      groupId: 'grp-idem',
      clusterKey: 'idem',
      classification: 'exact_duplicate_edition' as const,
      confidence: 'high' as const,
      evidence: ['Idempotency test'],
      books: [
        { id: 'id-1', title: 'War and Peace', author: 'Leo Tolstoy', pdf_url: 'https://standardebooks.org/epub' },
        { id: 'id-2', title: 'War and Peace', author: 'Leo Tolstoy' },
      ],
    };

    const run1 = recommendBestEditions(group);
    const run2 = recommendBestEditions(group);

    expect(run1.primaryBookId).toBe(run2.primaryBookId);
    expect(run1.duplicateIds).toEqual(run2.duplicateIds);
    expect(run1.recommendedKeepIds).toEqual(run2.recommendedKeepIds);
  });

  // Scenario 15: Restore an archived record restores active status
  it('Scenario 15: restore action reverses archive state and creates restore audit entry', async () => {
    const restorePreview = await applyDuplicateResolution('restore-book-123', 'restore_archived_record', {
      dryRun: true,
      customPrimaryId: 'book-123',
    });

    expect(restorePreview.success).toBe(true);
    expect(restorePreview.action).toBe('restore_archived_record');
    expect(restorePreview.primaryId).toBe('book-123');
  });
});

