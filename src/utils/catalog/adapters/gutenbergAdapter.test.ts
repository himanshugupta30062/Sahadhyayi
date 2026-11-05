import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GutenbergAdapter } from './gutenbergAdapter';

describe('GutenbergAdapter', () => {
  const adapter = new GutenbergAdapter();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('exposes adapter metadata', () => {
    expect(adapter.id).toBe('project_gutenberg');
    expect(adapter.name).toBe('Project Gutenberg');
    expect(adapter.tier).toBe('A');
    expect(adapter.isFreeToRead).toBe(true);
  });

  it('searches Gutendex API and transforms results into Edition models', async () => {
    const mockData = {
      results: [
        {
          id: 1342,
          title: 'Pride and Prejudice',
          authors: [{ name: 'Austen, Jane', birth_year: 1775, death_year: 1817 }],
          subjects: ['Courtship -- Fiction', 'Domestic fiction'],
          languages: ['en'],
          formats: {
            'application/epub+zip': 'https://www.gutenberg.org/ebooks/1342.epub3.images',
            'application/pdf': 'https://www.gutenberg.org/files/1342/1342-pdf.pdf',
            'text/html': 'https://www.gutenberg.org/files/1342/1342-h/1342-h.htm',
            'image/jpeg': 'https://www.gutenberg.org/cache/epub/1342/pg1342.cover.medium.jpg',
          },
        },
      ],
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockData), { status: 200, headers: { 'Content-Type': 'application/json' } })
    );

    const editions = await adapter.search('austen', 10);
    expect(editions).toHaveLength(1);

    const book = editions[0];
    expect(book.id).toBe('pg-1342');
    expect(book.title).toBe('Pride and Prejudice');
    expect(book.author).toBe('Jane Austen');
    expect(book.accessStatus).toBe('public_domain');
    expect(book.assets.map(a => a.format)).toEqual(['epub', 'pdf', 'html']);
  });

  it('handles empty results and network errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ results: [] }), { status: 200 }));
    expect(await adapter.search('empty')).toEqual([]);

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('Error', { status: 500 }));
    expect(await adapter.search('fail')).toEqual([]);

    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Connection error'));
    expect(await adapter.search('error')).toEqual([]);
  });
});
