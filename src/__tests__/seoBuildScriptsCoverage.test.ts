// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
  createClient: vi.fn(),
  rows: {} as Record<string, any[]>,
  errors: {} as Record<string, any>,
  writes: [] as Array<{ path: string; content: string }>,
}));

vi.mock('node:fs', () => ({
  default: {
    existsSync: (...args: unknown[]) => mocks.existsSync(...args),
    readFileSync: (...args: unknown[]) => mocks.readFileSync(...args),
    mkdirSync: (...args: unknown[]) => mocks.mkdirSync(...args),
    writeFileSync: (...args: unknown[]) => mocks.writeFileSync(...args),
  },
  existsSync: (...args: unknown[]) => mocks.existsSync(...args),
  readFileSync: (...args: unknown[]) => mocks.readFileSync(...args),
  mkdirSync: (...args: unknown[]) => mocks.mkdirSync(...args),
  writeFileSync: (...args: unknown[]) => mocks.writeFileSync(...args),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: (...args: unknown[]) => mocks.createClient(...args),
}));

const originalEnv = {
  url: process.env.VITE_SUPABASE_URL,
  key: process.env.VITE_SUPABASE_ANON_KEY,
  disablePublicConfig: process.env.SAHADHYAYI_DISABLE_PUBLIC_SEO_CONFIG,
};

function configureMockBackend() {
  mocks.createClient.mockImplementation(() => ({
    from: (table: string) => {
      const query: any = {
        select: () => query,
        not: () => query,
        eq: () => query,
        in: () => query,
        range: async (start: number, end: number) => ({
          data: (mocks.rows[table] || []).slice(start, end + 1),
          error: mocks.errors[table] || null,
        }),
      };
      return query;
    },
  }));
}

async function runScript(path: string) {
  await vi.resetModules();
  return import(path);
}

describe('SEO build-script coverage', () => {
  beforeEach(() => {
    process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
    process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
    mocks.createClient.mockClear();
    mocks.rows = {
      books_library: [
        { id: 'book-1', title: 'A <script>alert(1)</script> Book', description: '<p>A &amp; B story</p>', cover_image_url: 'https://images.example/cover.jpg', author_id: 'author-1', author: 'Munshi Premchand', isbn: '9780000000001', genre: 'Literary fiction', language: 'en', pages: 240, publication_year: 1936 },
        { id: '../unsafe', title: 'Unsafe route', description: null, cover_image_url: null },
      ],
      authors: [
        { id: 'author-1', name: 'Munshi Premchand', bio: '<p>Writer &amp; storyteller</p>', profile_image_url: 'https://images.example/premchand.jpg', website_url: 'https://premchand.example' },
        { name: '   ', bio: null },
      ],
      articles: [
        { id: 'article-1', user_id: 'user-1', title: 'A Useful Reading Guide', subtitle: 'A guide &amp; reflection', content: '<p>Read deeply and think carefully.</p>', cover_image_url: 'https://images.example/article.jpg', slug: 'useful-reading-guide', published_at: '2026-11-10T00:00:00Z', updated_at: '2026-11-11T00:00:00Z', created_at: '2026-11-09T00:00:00Z', is_published: true },
        { id: 'article-2', user_id: 'user-1', title: 'Unsafe article', content: 'private?', slug: '../unsafe', is_published: true },
      ],
      public_profiles: [{ id: 'user-1', full_name: 'Reader One' }],
    };
    mocks.errors = {};
    mocks.writes = [];
    mocks.existsSync.mockReset().mockReturnValue(true);
    mocks.readFileSync.mockReset().mockReturnValue('<html><head><title>App</title></head><body><div id="root"></div></body></html>');
    mocks.mkdirSync.mockReset();
    mocks.writeFileSync.mockReset().mockImplementation((filePath: string, data: string) => {
      mocks.writes.push({ path: String(filePath), content: String(data) });
    });
    configureMockBackend();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanupEnv();
    vi.restoreAllMocks();
  });

  function cleanupEnv() {
    if (originalEnv.url === undefined) delete process.env.VITE_SUPABASE_URL;
    else process.env.VITE_SUPABASE_URL = originalEnv.url;
    if (originalEnv.key === undefined) delete process.env.VITE_SUPABASE_ANON_KEY;
    else process.env.VITE_SUPABASE_ANON_KEY = originalEnv.key;
    if (originalEnv.disablePublicConfig === undefined) delete process.env.SAHADHYAYI_DISABLE_PUBLIC_SEO_CONFIG;
    else process.env.SAHADHYAYI_DISABLE_PUBLIC_SEO_CONFIG = originalEnv.disablePublicConfig;
  }

  it('generates canonical static and dynamic sitemap URLs and escapes XML', async () => {
    await runScript('../../scripts/generateSitemap.js');
    const sitemap = mocks.writes.find((entry) => entry.path.endsWith('sitemap.xml'))?.content || '';
    expect(sitemap).toContain('<loc>https://sahadhyayi.com/library</loc>');
    expect(sitemap).toContain('<loc>https://sahadhyayi.com/research-papers/topic/artificial-intelligence</loc>');
    expect(sitemap).toContain('<loc>https://sahadhyayi.com/book/book-1</loc>');
    expect(sitemap).toContain('<loc>https://sahadhyayi.com/authors/munshi-premchand</loc>');
    expect(sitemap).toContain('<loc>https://sahadhyayi.com/articles/useful-reading-guide</loc>');
    expect(sitemap).toContain('<lastmod>2026-11-11</lastmod>');
    expect(sitemap).not.toContain('/articles/../unsafe');
    expect(sitemap).not.toContain('/book/../unsafe');
    expect(sitemap).toContain('sahadhyayi-logo-digital-reading.png');
    expect(sitemap).toContain('<urlset');
    expect(mocks.writeFileSync).toHaveBeenCalled();
  });

  it('keeps sitemap generation useful when Supabase credentials are absent', async () => {
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.VITE_SUPABASE_ANON_KEY;
    process.env.SAHADHYAYI_DISABLE_PUBLIC_SEO_CONFIG = '1';
    await runScript('../../scripts/generateSitemap.js');
    const sitemap = mocks.writes.find((entry) => entry.path.endsWith('sitemap.xml'))?.content || '';
    expect(sitemap).toContain('<loc>https://sahadhyayi.com/library</loc>');
    expect(sitemap).not.toContain('/book/book-1');
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('environment variables are missing'));
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it('warns on dynamic sitemap query failures without inventing book or author URLs', async () => {
    mocks.errors = { books_library: { message: 'book query failed' }, authors: { message: 'author query failed' } };
    await runScript('../../scripts/generateSitemap.js');
    const sitemap = mocks.writes.find((entry) => entry.path.endsWith('sitemap.xml'))?.content || '';
    expect(sitemap).not.toContain('/book/book-1');
    expect(sitemap).not.toContain('/authors/munshi-premchand');
    expect(console.warn).toHaveBeenCalledWith('[sitemap] Could not fetch books:', 'book query failed');
    expect(console.warn).toHaveBeenCalledWith('[sitemap] Could not fetch authors:', 'author query failed');
  });

  it('prerenders safe public book and author HTML with metadata and canonical URLs', async () => {
    await runScript('../../scripts/prerender-public-content.mjs');
    const book = mocks.writes.find((entry) => entry.path.endsWith('/book/book-1/index.html'))?.content || '';
    const author = mocks.writes.find((entry) => entry.path.endsWith('/authors/munshi-premchand/index.html'))?.content || '';
    const article = mocks.writes.find((entry) => entry.path.endsWith('/articles/useful-reading-guide/index.html'))?.content || '';
    expect(book).toContain('<title>A &lt;script&gt;alert(1)&lt;/script&gt; Book - Read Online &amp; Book Details | Sahadhyayi</title>');
    expect(book).toContain('<meta property="og:image" content="https://images.example/cover.jpg" />');
    expect(book).toContain('<link rel="canonical" href="https://sahadhyayi.com/book/book-1" />');
    expect(book).not.toContain('<script>alert(1)</script>');
    expect(book).toContain('A &amp; B story');
    expect(book).toContain('"@type":"Book"');
    expect(book).toContain('"isbn":"9780000000001"');
    expect(book).toContain('"genre":"Literary fiction"');
    expect(book).toContain('"inLanguage":"en"');
    expect(book).toContain('"numberOfPages":240');
    expect(book).toContain('"datePublished":"1936"');
    expect(book).toContain('"mainEntityOfPage":{"@type":"WebPage","@id":"https://sahadhyayi.com/book/book-1"}');
    expect(book).toContain('<p>By <a href="/authors/munshi-premchand">Munshi Premchand</a></p>');
    expect(book).toContain('"@type":"BreadcrumbList"');
    expect(book).toContain('A &amp; B story');
    expect(book).toContain('"name":"A \\u003cscript\\u003ealert(1)\\u003c/script\\u003e Book"');
    expect(author).toContain('"@type":"Person"');
    expect(author).toContain('"name":"Munshi Premchand"');
    expect(author).toContain('<title>Munshi Premchand - Author Profile | Sahadhyayi</title>');
    expect(author).toContain('Writer &amp; storyteller');
    expect(author).toContain('<meta property="og:image" content="https://images.example/premchand.jpg" />');
    expect(author).toContain('"mainEntityOfPage":{"@type":"WebPage","@id":"https://sahadhyayi.com/authors/munshi-premchand"}');
    expect(author).toContain('"sameAs":["https://premchand.example"]');
    expect(author).toContain('"@type":"BreadcrumbList"');
    expect(author).toContain('Books by Munshi Premchand');
    expect(author).toContain('<a href="/book/book-1">A &lt;script&gt;alert(1)&lt;/script&gt; Book</a>');
    const research = mocks.writes.find((entry) => entry.path.endsWith('/research-papers/index.html'))?.content || '';
    const aiResearch = mocks.writes.find((entry) => entry.path.endsWith('/research-papers/topic/artificial-intelligence/index.html'))?.content || '';
    expect(research).toContain('<title>Research Papers &amp; Academic Studies | Sahadhyayi</title>');
    expect(research).toContain('"@type":"CollectionPage"');
    expect(research).toContain('"@type":"BreadcrumbList"');
    expect(research).toContain('"name":"Artificial intelligence"');
    expect(research).toContain('"name":"Research Papers"');
    expect(aiResearch).toContain('<title>Artificial intelligence Research Papers &amp; Studies | Sahadhyayi</title>');
    expect(aiResearch).toContain('<link rel="canonical" href="https://sahadhyayi.com/research-papers/topic/artificial-intelligence" />');
    expect(aiResearch).toContain('"@type":"CollectionPage"');
    expect(aiResearch).toContain('"name":"Artificial intelligence"');
    expect(aiResearch).toContain('Home');
    expect(aiResearch).toContain('Research Papers');
    expect(article).toContain('<title>A Useful Reading Guide | Sahadhyayi</title>');
    expect(article).toContain('<meta property="og:type" content="article" />');
    expect(article).toContain('"@type":"Article"');
    expect(article).toContain('"headline":"A Useful Reading Guide"');
    expect(article).toContain('"name":"Reader One"');
    expect(article).toContain('Read deeply and think carefully.');
    expect(article).toContain('<link rel="canonical" href="https://sahadhyayi.com/articles/useful-reading-guide" />');
    expect(mocks.writes.some((entry) => entry.path.includes('unsafe'))).toBe(false);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Generated 1 article, 1 book and 1 author'));
  });

  it('fails early if the Vite HTML template is missing', async () => {
    mocks.existsSync.mockReturnValue(false);
    await expect(runScript('../../scripts/prerender-public-content.mjs')).rejects.toThrow('dist/index.html is missing');
    expect(mocks.writes).toHaveLength(0);
  });

  it('skips failed dynamic prerender queries while retaining static landing pages', async () => {
    mocks.errors = { books_library: { message: 'books offline' }, authors: { message: 'authors offline' } };
    await runScript('../../scripts/prerender-public-content.mjs');
    expect(mocks.writes.some((entry) => entry.path.endsWith('/library/index.html'))).toBe(true);
    expect(mocks.writes.some((entry) => entry.path.endsWith('/book/book-1/index.html'))).toBe(false);
    expect(mocks.writes.some((entry) => entry.path.endsWith('/authors/munshi-premchand/index.html'))).toBe(false);
    expect(console.warn).toHaveBeenCalledWith('[prerender] Could not fetch public books: books offline');
    expect(console.warn).toHaveBeenCalledWith('[prerender] Could not fetch public authors: authors offline');
  });
});
