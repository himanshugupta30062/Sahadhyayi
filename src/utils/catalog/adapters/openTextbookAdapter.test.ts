import { describe, expect, it, vi, beforeEach } from 'vitest';
import { OpenTextbookAdapter } from './openTextbookAdapter';

describe('OpenTextbookAdapter', () => {
  const adapter = new OpenTextbookAdapter();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('exposes adapter metadata', () => {
    expect(adapter.id).toBe('open_textbook_library');
    expect(adapter.name).toBe('Open Textbook Library');
    expect(adapter.tier).toBe('A');
    expect(adapter.isFreeToRead).toBe(true);
  });

  it('transforms raw open textbook item to Edition model with assets', () => {
    const raw = {
      id: 123,
      title: 'Introduction to Calculus',
      author: 'Gilbert Strang',
      description: 'A comprehensive textbook for undergraduate mathematics.',
      cover_url: 'https://example.com/calc.jpg',
      pdf_url: 'https://example.com/calc.pdf',
      ebook_url: 'https://example.com/calc.epub',
      read_online_url: 'https://example.com/calc/read',
      subject: 'Mathematics',
      publisher: 'MIT OpenCourseWare',
      publication_year: 2017,
      reviews_count: 5,
    };

    const edition = adapter.transformItem(raw);

    expect(edition.id).toBe('otl-123');
    expect(edition.title).toBe('Introduction to Calculus');
    expect(edition.author).toBe('Gilbert Strang');
    expect(edition.genre).toBe('Mathematics');
    expect(edition.accessStatus).toBe('open_textbook');
    expect(edition.assets).toHaveLength(3);
    expect(edition.assets.map(a => a.format)).toEqual(['epub', 'pdf', 'html']);
    expect(edition.isPreferredEdition).toBe(true);
  });

  it('searches Open Textbook API and returns transformed editions', async () => {
    const mockItems = [
      { id: 1, title: 'Linear Algebra', author: 'Jim Hefferon', pdf_url: 'https://example.com/la.pdf' },
    ];

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockItems), { status: 200, headers: { 'Content-Type': 'application/json' } })
    );

    const editions = await adapter.search('algebra', 5);
    expect(editions).toHaveLength(1);
    expect(editions[0].title).toBe('Linear Algebra');
    expect(editions[0].author).toBe('Jim Hefferon');
  });

  it('returns empty array when search fails or returns non-ok status', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('Error', { status: 500 }));
    const result = await adapter.search('query');
    expect(result).toEqual([]);

    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network offline'));
    const failedResult = await adapter.search('query');
    expect(failedResult).toEqual([]);
  });
});

