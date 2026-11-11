import { describe, expect, it } from 'vitest';
import {
  identifyJunkCandidate,
  mapRawToEdition,
  clusterEditionsIntoWorks,
} from './deduplicationEngine';

describe('identifyJunkCandidate (catalog)', () => {
  it.each(['', 'x', 'test', 'testing', 'asdf', 'sample', 'demo', 'untitled', 'book 12', 'n/a', 'null', 'undefined'])(
    'rejects placeholder title %s', (title) => {
      expect(identifyJunkCandidate({ title }).isJunk).toBe(true);
    },
  );

  it('classifies empty records as ghost records', () => {
    expect(identifyJunkCandidate({ title: 'A real title' })).toMatchObject({
      isJunk: true,
      category: 'ghost_empty',
      reason: expect.stringContaining('Empty ghost record'),
    });
  });

  it('keeps records with a readable file, cover, or meaningful metadata', () => {
    expect(identifyJunkCandidate({ title: 'A real title', pdf_url: '/book.pdf' })).toEqual({ isJunk: false });
    expect(identifyJunkCandidate({ title: 'A real title', cover_image_url: '/cover.jpg' })).toEqual({ isJunk: false });
    expect(identifyJunkCandidate({ title: 'A real title', description: 'A'.repeat(30) })).toEqual({ isJunk: false });
    expect(identifyJunkCandidate({ title: 'A real title', pages: 11 })).toEqual({ isJunk: false });
  });
});

describe('mapRawToEdition', () => {
  it('normalizes metadata, defaults language, infers provider, and creates assets', () => {
    const edition = mapRawToEdition({
      id: 42,
      title: '  Pride and Prejudice: A Novel ',
      author: 'Jane Austen',
      pdf_url: 'https://gutenberg.org/files/1/1.pdf',
      epub_url: 'https://example.org/book.epub',
      isbn: '978-1-234567-89-0',
      created_at: '2024-01-01T00:00:00Z',
    });
    expect(edition.id).toBe('42');
    expect(edition.title).toContain('Pride and Prejudice');
    expect(edition.author).toContain('Jane Austen');
    expect(edition.language).toBe('English');
    expect(edition.accessStatus).toBe('public_domain');
    expect(edition.assets.map(asset => asset.format)).toEqual(['epub', 'pdf']);
    expect(edition.sources[0]).toMatchObject({
      provider: 'gutenberg',
      providerId: '42',
      sourceUrl: 'https://gutenberg.org/files/1/1.pdf',
      importedAt: '2024-01-01T00:00:00Z',
    });
  });

  it('honors explicit provider and supplied language', () => {
    const edition = mapRawToEdition({ title: 'Book', author: 'Author', language: 'Hindi' }, 'custom-source');
    expect(edition.language).toBe('Hindi');
    expect(edition.sources[0].provider).toBe('custom-source');
    expect(edition.sources[0].sourceUrl).toBe('');
  });
});

describe('clusterEditionsIntoWorks', () => {
  const edition = (overrides: Record<string, unknown> = {}) => ({
    id: 'edition-1', title: 'Same Book', author: 'Same Author', language: 'English',
    qualityScore: 50, coverImageUrl: undefined, description: undefined, isbn13: undefined,
    isbn10: undefined, publicationYear: undefined, genre: undefined, pages: undefined,
    assets: [], isPreferredEdition: false, ...overrides,
  } as any);

  it('groups editions by canonical title/author and selects highest quality', () => {
    const works = clusterEditionsIntoWorks([
      edition({ id: 'low', qualityScore: 20 }),
      edition({ id: 'high', qualityScore: 90 }),
      edition({ id: 'other', title: 'Different Book', qualityScore: 70 }),
    ]);
    expect(works).toHaveLength(2);
    const same = works.find(work => work.canonicalTitle === 'Same Book')!;
    expect(same.preferredEdition.id).toBe('high');
    expect(same.preferredEdition.isPreferredEdition).toBe(true);
    expect(same.alternativeEditions.map(e => e.id)).toEqual(['low']);
    expect(same.totalEditionsCount).toBe(2);
  });

  it('backfills missing metadata and deduplicates assets from alternatives', () => {
    const shared = { format: 'pdf', downloadUrl: '/shared.pdf' };
    const works = clusterEditionsIntoWorks([
      edition({ id: 'best', qualityScore: 90, assets: [shared] }),
      edition({ id: 'alt', qualityScore: 40, coverImageUrl: '/cover.jpg', description: 'Description',
        isbn13: '9781234567890', publicationYear: 2001, genre: 'Classic', pages: 100,
        assets: [shared, { format: 'epub', downloadUrl: '/book.epub' }] }),
    ]);
    const preferred = works[0].preferredEdition;
    expect(preferred).toMatchObject({
      coverImageUrl: '/cover.jpg', description: 'Description', isbn13: '9781234567890',
      publicationYear: 2001, genre: 'Classic', pages: 100,
    });
    expect(preferred.assets).toHaveLength(2);
    expect(works[0].alternativeEditions[0].isPreferredEdition).toBe(false);
  });

  it('does not overwrite metadata already present on the preferred edition', () => {
    const works = clusterEditionsIntoWorks([
      edition({ qualityScore: 80, description: 'Preferred description', pages: 200 }),
      edition({ id: 'alt', qualityScore: 30, description: 'Alternative', pages: 100 }),
    ]);
    expect(works[0].preferredEdition.description).toBe('Preferred description');
    expect(works[0].preferredEdition.pages).toBe(200);
  });

  it('returns no works for an empty input', () => {
    expect(clusterEditionsIntoWorks([])).toEqual([]);
  });
});
