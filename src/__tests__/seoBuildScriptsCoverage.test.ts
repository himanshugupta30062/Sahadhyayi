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
};

function configureMockBackend() {
  mocks.createClient.mockImplementation(() => ({
    from: (table: string) => {
      const query: any = {
        select: () => query,
        not: () => query,
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
    mocks.rows = {
      books_library: [
        { id: 'book-1', title: 'A <script>alert(1)</script> Book', description: '<p>A &amp; B story</p>', cover_image_url: 'https://images.example/cover.jpg' },
        { id: '../unsafe', title: 'Unsafe route', description: null, cover_image_url: null },
      ],
      authors: [
        { name: 'Munshi Premchand', bio: '<p>Writer &amp; storyteller</p>' },
        { name: '   ', bio: null },
      ],
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
  }

  it('generates canonical static and dynamic sitemap URLs and escapes XML', async () => {
    await runScript('../../scripts/generateSitemap.js');
    const sitemap = mocks.writes.find((entry) => entry.path.endsWith('sitemap.xml'))?.content || '';
    expect(sitemap).toContain('<loc>https://sahadhyayi.com/library</loc>');
    expect(sitemap).toContain('<loc>https://sahadhyayi.com/book/book-1</loc>');
    expect(sitemap).toContain('<loc>https://sahadhyayi.com/author/munshi-premchand</loc>');
    expect(sitemap).not.toContain('/book/../unsafe');
    expect(sitemap).toContain('sahadhyayi-logo-digital-reading.png');
    expect(sitemap).toContain('<urlset');
    expect(mocks.writeFileSync).toHaveBeenCalled();
  });

  it('keeps sitemap generation useful when Supabase credentials are absent', async () => {
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.VITE_SUPABASE_ANON_KEY;
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
    expect(sitemap).not.toContain('/author/munshi-premchand');
    expect(console.warn).toHaveBeenCalledWith('[sitemap] Could not fetch books:', 'book query failed');
    expect(console.warn).toHaveBeenCalledWith('[sitemap] Could not fetch authors:', 'author query failed');
  });

  it('prerenders safe public book and author HTML with metadata and canonical URLs', async () => {
    await runScript('../../scripts/prerender-public-content.mjs');
    const book = mocks.writes.find((entry) => entry.path.endsWith('/book/book-1/index.html'))?.content || '';
    const author = mocks.writes.find((entry) => entry.path.endsWith('/author/munshi-premchand/index.html'))?.content || '';
    expect(book).toContain('<title>A &lt;script&gt;alert(1)&lt;/script&gt; Book - Read Online | Sahadhyayi</title>');
    expect(book).toContain('<meta property="og:image" content="https://images.example/cover.jpg" />');
    expect(book).toContain('<link rel="canonical" href="https://sahadhyayi.com/book/book-1" />');
    expect(book).not.toContain('<script>alert(1)</script>');
    expect(book).toContain('A &amp; B story');
    expect(author).toContain('<title>Munshi Premchand - Author Profile | Sahadhyayi</title>');
    expect(author).toContain('Writer &amp; storyteller');
    expect(mocks.writes.some((entry) => entry.path.includes('unsafe'))).toBe(false);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Generated 1 book and 1 author'));
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
    expect(mocks.writes.some((entry) => entry.path.endsWith('/author/munshi-premchand/index.html'))).toBe(false);
    expect(console.warn).toHaveBeenCalledWith('[prerender] Could not fetch public books: books offline');
    expect(console.warn).toHaveBeenCalledWith('[prerender] Could not fetch public authors: authors offline');
  });
});
