import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  detectBookSchemaCapabilities: vi.fn(),
  applyPublicBookFilter: vi.fn((query: unknown) => query),
  filterPublicBooks: vi.fn((books: any[]) =>
    Array.isArray(books)
      ? books.filter((book) => book && book.catalog_status !== 'archived' && book.status !== 'archived' && book.is_archived !== true)
      : [],
  ),
}));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: { from: mocks.from },
}));

vi.mock('@/utils/catalog/bookVisibility', () => ({
  detectBookSchemaCapabilities: mocks.detectBookSchemaCapabilities,
  applyPublicBookFilter: mocks.applyPublicBookFilter,
  filterPublicBooks: mocks.filterPublicBooks,
}));

import {
  generateEnhancedPrompt,
  getBookSummaries,
  getWebsiteContext,
  populateInitialTrainingData,
  searchRelevantBooks,
  type WebsiteContext,
} from './enhancedChatbotKnowledge';

const book = (id: string, title: string): WebsiteContext['recentBooks'][number] => ({
  id,
  title,
  author: `Author ${id}`,
  genre: 'Fiction',
  description: 'A short description',
  language: 'en',
});

type QueryResult = {
  data?: any[] | null;
  error?: unknown;
  count?: number | null;
};

const makeQueryBuilder = (result: QueryResult) => {
  const builder: any = {
    select: vi.fn(() => builder),
    not: vi.fn(() => builder),
    order: vi.fn(() => builder),
    or: vi.fn(() => builder),
    in: vi.fn(() => builder),
    limit: vi.fn(() => Promise.resolve(result)),
    then: (resolve: (value: QueryResult) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  };
  return builder;
};

const queueBookQueries = (results: QueryResult[]) => {
  const builders = results.map(makeQueryBuilder);
  mocks.from.mockImplementation(() => builders.shift() ?? makeQueryBuilder({ data: [], error: null }));
  return builders;
};

const baseContext: WebsiteContext = {
  totalBooks: 42,
  genres: ['Fiction', 'Science'],
  features: ['Reading goals', 'Author connections'],
  recentBooks: [book('1', 'First'), book('2', 'Second'), book('3', 'Third'), book('4', 'Fourth')],
};

describe('generateEnhancedPrompt', () => {
  it('includes catalog count, genres, features, and only the three most recent books', () => {
    const prompt = generateEnhancedPrompt('Suggest a novel', baseContext);

    expect(prompt).toContain('Current catalog count: 42.');
    expect(prompt).toContain('Available genres include: Fiction, Science.');
    expect(prompt).toContain('Key features: Reading goals, Author connections.');
    expect(prompt).toContain('"First" by Author 1 (Fiction)');
    expect(prompt).toContain('"Third" by Author 3 (Fiction)');
    expect(prompt).not.toContain('"Fourth"');
    expect(prompt).toContain('User query: Suggest a novel');
  });

  it('explicitly avoids guessing when the catalog count is unavailable', () => {
    const prompt = generateEnhancedPrompt('How many books?', {
      totalBooks: null,
      genres: [],
      features: [],
      recentBooks: [],
    });

    expect(prompt).toContain('Current catalog count is unavailable; do not guess the number of books.');
    expect(prompt).not.toContain('Available genres include:');
    expect(prompt).not.toContain('Key features:');
    expect(prompt).not.toContain('Recent books:');
  });

  it('omits empty context sections while retaining the user query and response guidance', () => {
    const prompt = generateEnhancedPrompt('Hello', {
      totalBooks: 0,
      genres: [],
      features: [],
      recentBooks: [],
    });

    expect(prompt).toContain('Current catalog count: 0.');
    expect(prompt).toContain('User query: Hello');
    expect(prompt).toContain('Provide a concise and helpful response');
    expect(prompt).not.toContain('Recent books:');
  });

  it('formats multiple recent books as individual prompt lines', () => {
    const prompt = generateEnhancedPrompt('Compare these', {
      totalBooks: 2,
      genres: ['History'],
      features: [],
      recentBooks: [book('a', 'A'), book('b', 'B')],
    });

    expect(prompt).toContain('- "A" by Author a (Fiction)');
    expect(prompt).toContain('- "B" by Author b (Fiction)');
  });
});

describe('enhanced chatbot data access', () => {
  beforeEach(() => {
    mocks.from.mockReset();
    mocks.detectBookSchemaCapabilities.mockReset().mockResolvedValue({
      hasStatus: true,
      hasCatalogStatus: true,
      checked: true,
    });
    mocks.applyPublicBookFilter.mockClear().mockImplementation((query: unknown) => query);
    mocks.filterPublicBooks.mockClear().mockImplementation((books: any[]) =>
      Array.isArray(books)
        ? books.filter((item) => item && item.catalog_status !== 'archived' && item.status !== 'archived' && item.is_archived !== true)
        : [],
    );
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('builds a public website context with normalized unique titles, genres, and at most ten recent books', async () => {
    const recent = Array.from({ length: 12 }, (_, index) => book(String(index + 1), `Recent ${index + 1}`));
    const builders = queueBookQueries([
      {
        data: [
          { id: '1', title: 'The Book' },
          { id: '2', title: ' the book ' },
          { id: '3', title: 'Another Book' },
          { id: '4', title: '   ' },
          { id: '5', title: 'Archived', catalog_status: 'archived' },
        ],
        error: null,
      },
      {
        data: [
          { genre: 'Fiction' },
          { genre: 'Science' },
          { genre: 'Fiction' },
          { genre: null },
          { genre: 'Hidden', is_archived: true },
        ],
        error: null,
      },
      {
        data: [...recent, { ...book('hidden', 'Hidden recent'), status: 'archived' }],
        error: null,
      },
    ]);

    const context = await getWebsiteContext();

    expect(context.totalBooks).toBe(2);
    expect(context.genres).toEqual(['Fiction', 'Science']);
    expect(context.features).toContain('Reading progress tracking');
    expect(context.recentBooks).toHaveLength(10);
    expect(context.recentBooks[0].title).toBe('Recent 1');
    expect(context.recentBooks[9].title).toBe('Recent 10');
    expect(mocks.from).toHaveBeenNthCalledWith(1, 'books_library');
    expect(mocks.from).toHaveBeenCalledTimes(3);
    expect(builders).toHaveLength(0);
    expect(mocks.applyPublicBookFilter).toHaveBeenCalledTimes(3);
    expect(mocks.filterPublicBooks).toHaveBeenCalledTimes(3);
  });

  it('falls back to a head-count query when the title-list query fails', async () => {
    const builders = queueBookQueries([
      { data: null, error: { message: 'select unavailable' } },
      { count: 17, error: null },
      { data: [{ genre: 'History' }], error: null },
      { data: [], error: null },
    ]);

    const context = await getWebsiteContext();

    expect(context.totalBooks).toBe(17);
    expect(context.genres).toEqual(['History']);
    expect(mocks.from).toHaveBeenCalledTimes(4);
    expect(builders).toHaveLength(0);
  });

  it('returns an unknown catalog count when both title and count queries fail', async () => {
    queueBookQueries([
      { data: null, error: { message: 'select unavailable' } },
      { count: null, error: { message: 'count unavailable' } },
      { data: [], error: null },
      { data: [], error: null },
    ]);

    const context = await getWebsiteContext();

    expect(context.totalBooks).toBeNull();
    expect(context.recentBooks).toEqual([]);
  });

  it('returns safe static context when schema detection throws', async () => {
    mocks.detectBookSchemaCapabilities.mockRejectedValueOnce(new Error('schema unavailable'));

    const context = await getWebsiteContext();

    expect(context.totalBooks).toBeNull();
    expect(context.genres).toContain('Fiction');
    expect(context.features).toContain('Digital Library');
    expect(context.recentBooks).toEqual([]);
  });

  it('searches with all supported text fields, filters hidden books, and respects the requested limit', async () => {
    const builder = queueBookQueries([
      {
        data: [
          book('1', 'Visible One'),
          { ...book('2', 'Archived'), catalog_status: 'archived' },
          book('3', 'Visible Two'),
          book('4', 'Visible Three'),
        ],
        error: null,
      },
    ])[0];

    const results = await searchRelevantBooks('space opera', 2);

    expect(results.map((item) => item.id)).toEqual(['1', '3']);
    expect(builder.or).toHaveBeenCalledWith(
      'title.ilike.%space opera%,author.ilike.%space opera%,description.ilike.%space opera%,genre.ilike.%space opera%',
    );
    expect(builder.limit).toHaveBeenCalledWith(4);
    expect(mocks.applyPublicBookFilter).toHaveBeenCalledWith(builder, {
      hasStatus: true,
      hasCatalogStatus: true,
      checked: true,
    });
  });

  it('returns an empty search result and logs when the book query fails', async () => {
    queueBookQueries([{ data: null, error: { message: 'database unavailable' } }]);

    await expect(searchRelevantBooks('missing')).resolves.toEqual([]);
    expect(console.error).toHaveBeenCalledWith('Error searching books:', { message: 'database unavailable' });
  });

  it('returns book summaries for the requested IDs', async () => {
    const summaries = [{ book_id: 'book-1', content: 'A summary' }];
    const builder = queueBookQueries([{ data: summaries, error: null }])[0];

    await expect(getBookSummaries(['book-1', 'book-2'])).resolves.toEqual(summaries);
    expect(mocks.from).toHaveBeenCalledWith('book_summaries');
    expect(builder.select).toHaveBeenCalledWith('content, book_id, books_library(title, author)');
    expect(builder.in).toHaveBeenCalledWith('book_id', ['book-1', 'book-2']);
    expect(builder.limit).toHaveBeenCalledWith(3);
  });

  it('returns an empty summary list and logs when the summary query fails', async () => {
    queueBookQueries([{ data: null, error: { message: 'summary query failed' } }]);

    await expect(getBookSummaries(['book-1'])).resolves.toEqual([]);
    expect(console.error).toHaveBeenCalledWith('Error fetching book summaries:', { message: 'summary query failed' });
  });

  it('inserts all initial training examples for the supplied user', async () => {
    const inserted: Array<{ table: string; payload: any }> = [];
    mocks.from.mockImplementation((table: string) => ({
      insert: vi.fn((payload: any) => {
        inserted.push({ table, payload });
        return Promise.resolve({ error: null });
      }),
    }));

    await populateInitialTrainingData('reader-7');

    expect(inserted).toHaveLength(8);
    expect(inserted.every((entry) => entry.table === 'gemini_training_data')).toBe(true);
    expect(inserted.every((entry) => entry.payload.user_id === 'reader-7')).toBe(true);
    const categories = inserted.map((entry) => JSON.parse(entry.payload.prompt).category);
    expect(categories).toEqual([
      'platform_overview',
      'book_discovery',
      'features',
      'download_process',
      'genre_specific',
      'progress_tracking',
      'author_connection',
      'genres',
    ]);
  });

  it('stops after a rejected training insert and reports the failure without throwing', async () => {
    let insertCount = 0;
    mocks.from.mockImplementation(() => ({
      insert: vi.fn(() => {
        insertCount += 1;
        return insertCount === 2 ? Promise.reject(new Error('insert failed')) : Promise.resolve({ error: null });
      }),
    }));

    await expect(populateInitialTrainingData('reader-7')).resolves.toBeUndefined();
    expect(insertCount).toBe(2);
    expect(console.error).toHaveBeenCalledWith('Error populating training data:', expect.any(Error));
  });
});
