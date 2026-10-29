import { describe, expect, it } from 'vitest';
import { detectDuplicateGroups } from './duplicateDetection';

const book = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  title: 'The Dispossessed',
  author: 'Ursula K. Le Guin',
  language: 'English',
  publication_year: 1974,
  ...overrides,
});

describe('detectDuplicateGroups', () => {
  it('returns no groups for empty or missing input', () => {
    expect(detectDuplicateGroups([])).toEqual([]);
    expect(detectDuplicateGroups(null as unknown as any[])).toEqual([]);
  });

  it('clusters normalized title and author duplicates with evidence', () => {
    const first = book('book-1');
    const second = book('book-2', { title: '  THE DISPOSSESSED  ' });

    const groups = detectDuplicateGroups([first, second]);

    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({
      classification: 'exact_duplicate_edition',
      confidence: 'high',
      books: [first, second],
    });
    expect(groups[0].groupId).toContain('grp-');
    expect(groups[0].evidence[0]).toContain('Normalized title and author match');
  });

  it('classifies different languages as translation variants', () => {
    const english = book('english');
    const hindi = book('hindi', {
      title: 'The Dispossessed',
      language: 'Hindi',
    });

    const groups = detectDuplicateGroups([english, hindi]);

    expect(groups).toHaveLength(1);
    expect(groups[0].classification).toBe('translation_variant');
    expect(groups[0].evidence.join(' ')).toContain('different languages/scripts');
  });

  it('keeps separate editions in one group when publication years differ', () => {
    const older = book('older', { publication_year: 1974 });
    const newer = book('newer', { publication_year: 2019 });

    const groups = detectDuplicateGroups([older, newer]);

    expect(groups).toHaveLength(1);
    expect(groups[0].classification).toBe('same_work_different_edition');
    expect(groups[0].confidence).toBe('high');
  });

  it('matches a stable provider identifier even when titles differ', () => {
    const first = book('first', { title: 'The Dispossessed', provider_id: 'provider-42' });
    const second = book('second', { title: 'An Ambiguous Work Title', provider_id: 'PROVIDER-42' });

    const groups = detectDuplicateGroups([first, second]);

    expect(groups).toHaveLength(1);
    expect(groups[0].classification).toBe('exact_duplicate_edition');
    expect(groups[0].evidence.join(' ')).toContain('Exact match on provider ID');
  });

  it('does not merge books with contradictory authors', () => {
    const first = book('first', { author: 'Ursula K. Le Guin' });
    const second = book('second', { author: 'J. K. Rowling' });

    const groups = detectDuplicateGroups([first, second]);

    expect(groups).toHaveLength(2);
    expect(groups.every((entry) => entry.classification === 'distinct_work')).toBe(true);
    expect(groups[0].evidence[0]).toContain('Single unique catalog entry');
  });

  it('returns separate groups for unrelated titles', () => {
    const first = book('first');
    const second = book('second', {
      title: 'The Hobbit',
      author: 'J. R. R. Tolkien',
    });

    const groups = detectDuplicateGroups([first, second]);

    expect(groups).toHaveLength(2);
    expect(groups.map((entry) => entry.books)).toEqual([[first], [second]]);
    expect(groups.map((entry) => entry.confidence)).toEqual(['high', 'high']);
  });
});
