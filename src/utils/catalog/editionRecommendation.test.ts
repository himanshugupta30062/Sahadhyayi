import { describe, expect, it } from 'vitest';
import { recommendBestEditions } from './editionRecommendation';
import type { DuplicateGroup } from '@/types/bookCatalog';

const book = (overrides: Record<string, unknown> = {}) => ({
  id: 'edition-1',
  title: 'The Example Book',
  author: 'A. Author',
  language: 'English',
  description: 'A useful description',
  publication_year: 2020,
  pages: 250,
  cover_image_url: 'https://example.com/cover.jpg',
  pdf_url: 'https://example.com/book.pdf',
  ...overrides,
});

const group = (books: any[], overrides: Partial<DuplicateGroup> = {}): DuplicateGroup => ({
  groupId: 'group-1',
  clusterKey: 'example-author',
  classification: 'exact_duplicate_edition',
  confidence: 'high',
  evidence: ['matching title and author'],
  books,
  ...overrides,
});

describe('recommendBestEditions', () => {
  it('rejects an empty duplicate group', () => {
    expect(() => recommendBestEditions(group([]))).toThrow(
      'Cannot recommend editions for an empty group',
    );
  });

  it('returns a primary recommendation and score for a single edition', () => {
    const result = recommendBestEditions(group([book()]));

    expect(result.groupId).toBe('group-1');
    expect(result.primaryBookId).toBe('edition-1');
    expect(result.recommendedKeepIds).toEqual(['edition-1']);
    expect(result.duplicateIds).toEqual([]);
    expect(result.archiveCandidateIds).toEqual([]);
    expect(result.qualityScores['edition-1']).toBeDefined();
    expect(result.reasonsForRecommendation[0]).toContain('Primary edition chosen');
  });

  it('backfills missing primary metadata from duplicate candidates without mutating input', () => {
    const primary = book({
      id: 'primary',
      description: undefined,
      cover_image_url: undefined,
      isbn: undefined,
      publication_year: undefined,
      pages: undefined,
      pdf_url: undefined,
      author_bio: undefined,
      genre: undefined,
    });
    const duplicate = book({
      id: 'duplicate',
      description: 'Recovered description',
      cover_image_url: 'https://example.com/recovered.jpg',
      isbn: '9780306406157',
      publication_year: 1998,
      pages: 300,
      pdf_url: 'https://example.com/recovered.pdf',
      author_bio: 'Recovered bio',
      genre: 'Fiction',
    });

    const result = recommendBestEditions(group([primary, duplicate]));

    expect(result.primaryBookId).toBe('primary');
    expect(result.proposedMergedMetadata).toMatchObject({
      description: 'Recovered description',
      cover_image_url: 'https://example.com/recovered.jpg',
      isbn: '9780306406157',
      publication_year: 1998,
      pages: 300,
      pdf_url: 'https://example.com/recovered.pdf',
      author_bio: 'Recovered bio',
      genre: 'Fiction',
    });
    expect(primary.description).toBeUndefined();
    expect(primary.cover_image_url).toBeUndefined();
  });

  it('keeps one meaningful translation as a secondary edition', () => {
    const result = recommendBestEditions(group([
      book({ id: 'english', language: 'English' }),
      book({ id: 'hindi', language: 'Hindi', title: 'उदाहरण पुस्तक' }),
    ]));

    expect(result.recommendedKeepIds).toContain(result.primaryBookId);
    expect(result.secondaryBookId).toBeDefined();
    expect(result.recommendedKeepIds).toContain(result.secondaryBookId);
    expect(result.duplicateIds).toHaveLength(0);
  });

  it('marks low-confidence groups for manual review', () => {
    const result = recommendBestEditions(group([book()], { confidence: 'low' }));

    expect(result.requiresManualReview).toBe(true);
    expect(result.warnings).toContain(
      'Group contains potential ambiguity; manual review recommended before executing merge.',
    );
  });

  it('classifies redundant editions as duplicates and archive candidates', () => {
    const result = recommendBestEditions(group([
      book({ id: 'first' }),
      book({ id: 'second' }),
    ]));

    expect(result.duplicateIds).toContain('second');
    expect(result.archiveCandidateIds).toContain('second');
  });
});
