import { afterEach, describe, expect, it, vi } from 'vitest';
import { StandardEbooksAdapter } from '@/utils/catalog/adapters/standardEbooksAdapter';

const feed = [
  '<?xml version="1.0"?>',
  '<feed xmlns="http://www.w3.org/2005/Atom">',
  '<entry id="entry-attribute">',
  '<id>https://standardebooks.org/ebooks/jane-austen/pride-and-prejudice</id>',
  '<title>Pride and Prejudice</title>',
  '<author><name>Jane Austen</name></author>',
  '<summary>A classic <em>novel</em>.</summary>',
  '<link href="https://cdn.example/pride.epub" type="application/epub+zip" />',
  '<link href="https://cdn.example/pride.jpg" type="image/jpeg" />',
  '<published>2026-01-01T00:00:00Z</published>',
  '</entry>',
  '<entry><title>Anonymous Work</title><summary> </summary></entry>',
  '<entry><id>missing-title</id><author><name>Someone</name></author></entry>',
  '</feed>',
].join('\n');

describe('StandardEbooksAdapter', () => {
  afterEach(() => vi.restoreAllMocks());

  it('parses complete entries, supplies safe defaults, and ignores entries without titles', () => {
    const adapter = new StandardEbooksAdapter();
    expect(adapter.id).toBe('standard_ebooks');
    expect(adapter.tier).toBe('A');
    expect(adapter.isFreeToRead).toBe(true);

    const entries = adapter.parseAtomFeed(feed);
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({
      id: 'https://standardebooks.org/ebooks/jane-austen/pride-and-prejudice',
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      summary: 'A classic novel.',
      epubUrl: 'https://cdn.example/pride.epub',
      coverUrl: 'https://cdn.example/pride.jpg',
      published: '2026-01-01T00:00:00Z',
    });
    expect(entries[1]).toMatchObject({ id: 'se-2', title: 'Anonymous Work', author: 'Unknown Author', summary: '', epubUrl: '', published: '' });
  });

  it('handles malformed XML-like tags and entries without complete metadata', () => {
    const adapter = new StandardEbooksAdapter();
    expect(adapter.parseAtomFeed('<feed><entry><title>Broken title</entry></feed>')).toEqual([]);
    expect(adapter.parseAtomFeed('<feed><entry><title>Title</title><author><name>Missing close</author></entry></feed>')).toEqual([
      expect.objectContaining({ title: 'Title', author: 'Unknown Author' }),
    ]);
  });

  it('searches the official feed, filters title/author and maps results to catalog editions', async () => {
    const adapter = new StandardEbooksAdapter();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: async () => feed }));
    const results = await adapter.search('jane', 5);
    expect(fetch).toHaveBeenCalledWith('https://standardebooks.org/feeds/atom/new-releases', {
      headers: { Accept: 'application/atom+xml, text/xml' },
    });
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      id: 'https://standardebooks.org/ebooks/jane-austen/pride-and-prejudice',
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      publisher: 'Standard Ebooks',
      language: 'English',
      licenseEvidence: 'public_domain',
      accessStatus: 'carefully_edited',
    });
    expect(results[0].assets[0]).toMatchObject({ format: 'epub', isDirectDownload: true, verified: true });
  });

  it('returns no results for non-OK feeds and catches network errors', async () => {
    const adapter = new StandardEbooksAdapter();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, text: async () => '' }));
    await expect(adapter.search('anything')).resolves.toEqual([]);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(adapter.search('anything')).resolves.toEqual([]);
    expect(warn).toHaveBeenCalledWith('Standard Ebooks search failed:', expect.any(Error));
  });
});
