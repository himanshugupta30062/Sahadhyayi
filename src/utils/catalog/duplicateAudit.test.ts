// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  books: [] as Array<Record<string, any>>,
  groups: [] as Array<Record<string, any>>,
  recommendations: {} as Record<string, any>,
  junkIds: [] as string[],
  referenceRows: {} as Record<string, Array<Record<string, any>>>,
  bookFetchError: null as unknown,
  from: vi.fn(),
  select: vi.fn(),
  in: vi.fn(),
  order: vi.fn(),
  range: vi.fn(),
  detectDuplicateGroups: vi.fn(),
  recommendBestEditions: vi.fn(),
  identifyJunkCandidate: vi.fn(),
}));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: { from: (...args: unknown[]) => mocks.from(...args) },
}));

vi.mock('./duplicateDetection', () => ({
  detectDuplicateGroups: (...args: unknown[]) => mocks.detectDuplicateGroups(...args),
}));

vi.mock('./editionRecommendation', () => ({
  recommendBestEditions: (...args: unknown[]) => mocks.recommendBestEditions(...args),
}));

vi.mock('./qualityScoring', () => ({
  identifyJunkCandidate: (...args: unknown[]) => mocks.identifyJunkCandidate(...args),
}));

import { generateLibraryDuplicateAudit } from './duplicateAudit';

const book = (id: string, title = 'The Dispossessed', extra: Record<string, unknown> = {}) => ({
  id,
  title,
  author: 'Ursula K. Le Guin',
  isbn: null,
  publication_year: 1974,
  cover_image_url: null,
  pdf_url: null,
  ...extra,
});

const group = (...books: Array<Record<string, any>>) => ({
  groupId: 'group-1',
  classification: 'same_work',
  confidence: 'high',
  books,
});

const recommendation = () => ({
  primaryBookId: 'book-1',
  secondaryBookId: 'book-2',
  archiveCandidateIds: ['book-3'],
  qualityScores: {
    'book-1': { score: 95, accessStatus: 'verified_full_text' },
    'book-2': { score: 80, accessStatus: 'public_domain' },
    'book-3': { score: 20, accessStatus: 'metadata_only' },
  },
  proposedMergedMetadata: { description: 'A complete description', cover_image_url: 'https://example.com/cover.jpg' },
  reasonsForRecommendation: ['Best verified edition', 'Distinct edition retained'],
  requiresManualReview: false,
  warnings: [],
});

const referenceBuilder = () => {
  const builder = {
    select: mocks.select,
    in: mocks.in,
    order: mocks.order,
    range: mocks.range,
  };
  return builder;
};

describe('generateLibraryDuplicateAudit', () => {
  beforeEach(() => {
    mocks.books = [];
    mocks.groups = [];
    mocks.recommendations = {};
    mocks.junkIds = [];
    mocks.referenceRows = {};
    mocks.bookFetchError = null;

    mocks.from.mockReset().mockImplementation((table: string) => {
      const builder = referenceBuilder();
      mocks.select.mockReset().mockImplementation(() => builder);
      mocks.in.mockReset().mockImplementation(async () => ({
        data: mocks.referenceRows[table] ?? [],
        error: null,
      }));
      mocks.order.mockReset().mockImplementation(() => builder);
      mocks.range.mockReset().mockImplementation(async () => ({
        data: mocks.books,
        error: mocks.bookFetchError,
      }));
      return builder;
    });

    mocks.detectDuplicateGroups.mockReset().mockImplementation(() => mocks.groups);
    mocks.recommendBestEditions.mockReset().mockImplementation(() => mocks.recommendations);
    mocks.identifyJunkCandidate.mockReset().mockImplementation((candidate: { id: string }) => ({
      isJunk: mocks.junkIds.includes(candidate.id),
      reasons: mocks.junkIds.includes(candidate.id) ? ['placeholder record'] : [],
    }));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a zeroed report when there are no books to audit', async () => {
    const report = await generateLibraryDuplicateAudit([]);

    expect(report.totalRecordsScanned).toBe(0);
    expect(report.candidateGroupsCount).toBe(0);
    expect(report.groups).toEqual([]);
    expect(report.summary).toEqual({
      potentialRedundantRecords: 0,
      averageQualityScore: 0,
      executionImpact: {
        booksToArchive: 0,
        metadataFieldsToEnrich: 0,
        userReferencesToSafelyMigrate: 0,
      },
    });
    expect(mocks.detectDuplicateGroups).not.toHaveBeenCalled();
  });

  it('loads catalog records in a database query when no non-empty input is supplied', async () => {
    mocks.books = [book('book-1')];

    const report = await generateLibraryDuplicateAudit();

    expect(mocks.from).toHaveBeenCalledWith('books_library');
    expect(mocks.order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(mocks.range).toHaveBeenCalledWith(0, 999);
    expect(report.totalRecordsScanned).toBe(1);
    expect(report.candidateGroupsCount).toBe(0);
  });

  it('returns an empty report and logs when catalog retrieval fails', async () => {
    mocks.bookFetchError = new Error('database unavailable');

    const report = await generateLibraryDuplicateAudit();

    expect(console.error).toHaveBeenCalledWith(
      'Error fetching catalog books for audit:',
      expect.any(Error),
    );
    expect(report.totalRecordsScanned).toBe(0);
    expect(report.groups).toEqual([]);
  });

  it('ignores singleton groups and does not query user references when no duplicates exist', async () => {
    mocks.groups = [group(book('book-1'))];

    const report = await generateLibraryDuplicateAudit([book('book-1')]);

    expect(report.totalRecordsScanned).toBe(1);
    expect(report.candidateGroupsCount).toBe(0);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('summarizes duplicate candidates, references, recommendations, and archive impact', async () => {
    const books = [book('book-1'), book('book-2', 'The Dispossessed (Illustrated)'), book('book-3', 'The Dispossessed duplicate')];
    mocks.groups = [group(...books)];
    mocks.recommendations = recommendation();
    mocks.junkIds = ['book-3'];
    mocks.referenceRows = {
      user_bookshelf: [{ book_id: 'book-1' }, { book_id: 'book-3' }],
      reading_progress: [{ book_id: 'book-3' }],
      reading_rooms: [{ book_id: 'book-2' }],
      margin_notes: [{ book_id: 'book-3' }, { book_id: 'book-3' }],
    };

    const report = await generateLibraryDuplicateAudit(books);

    expect(report.totalRecordsScanned).toBe(3);
    expect(report.candidateGroupsCount).toBe(1);
    expect(report.highConfidenceGroupsCount).toBe(1);
    expect(report.ambiguousGroupsCount).toBe(0);
    expect(report.possibleJunkCount).toBe(1);
    expect(report.summary.potentialRedundantRecords).toBe(1);
    expect(report.summary.executionImpact).toEqual({
      booksToArchive: 1,
      metadataFieldsToEnrich: 2,
      userReferencesToSafelyMigrate: 4,
    });

    const audited = report.groups[0];
    expect(audited.recommendedPrimary).toMatchObject({
      id: 'book-1',
      title: 'The Dispossessed',
      qualityScore: 95,
      accessStatus: 'verified_full_text',
    });
    expect(audited.recommendedSecondary).toMatchObject({
      id: 'book-2',
      qualityScore: 80,
    });
    expect(audited.candidateRecords.find((record: any) => record.id === 'book-3')).toMatchObject({
      isArchiveCandidate: true,
      proposedAction: 'Archive as junk placeholder',
      userReferences: {
        bookshelf: 1,
        readingProgress: 1,
        rooms: 0,
        marginNotes: 2,
        total: 4,
      },
    });
    expect(audited.proposedAction).toBe('merge_and_archive_duplicates');
  });

  it('marks groups for manual review and supplies fallback recommendation reasons', async () => {
    mocks.groups = [group(book('book-1'), book('book-2'))];
    mocks.recommendations = {
      primaryBookId: 'book-1',
      archiveCandidateIds: [],
      qualityScores: {},
      proposedMergedMetadata: {},
      reasonsForRecommendation: [],
      requiresManualReview: true,
      warnings: ['Similar titles need human review'],
    };

    const report = await generateLibraryDuplicateAudit([book('book-1'), book('book-2')]);

    expect(report.ambiguousGroupsCount).toBe(1);
    expect(report.groups[0].proposedAction).toBe('mark_for_review');
    expect(report.groups[0].recommendedPrimary.reason).toBe('Highest verified quality edition');
    expect(report.groups[0].candidateRecords[1].proposedAction).toBe('Keep as primary');
    expect(report.groups[0].warnings).toEqual(['Similar titles need human review']);
  });

  it('continues with zeroed reference counts and warns when dependent-reference queries throw', async () => {
    const books = [book('book-1'), book('book-2')];
    mocks.groups = [group(...books)];
    mocks.recommendations = {
      primaryBookId: 'book-1',
      archiveCandidateIds: ['book-2'],
      qualityScores: {},
      proposedMergedMetadata: {},
      reasonsForRecommendation: ['Keep primary'],
      requiresManualReview: false,
      warnings: [],
    };
    mocks.from.mockImplementation((table: string) => {
      if (table === 'user_bookshelf') throw new Error('reference query failed');
      return referenceBuilder();
    });

    const report = await generateLibraryDuplicateAudit(books);

    expect(console.warn).toHaveBeenCalledWith(
      'Could not fetch dependent user references for books:',
      expect.any(Error),
    );
    expect(report.groups[0].candidateRecords[1].userReferences.total).toBe(0);
    expect(report.summary.executionImpact.userReferencesToSafelyMigrate).toBe(0);
  });
});
