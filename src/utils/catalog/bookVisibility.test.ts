import { beforeEach, describe, expect, it, vi } from 'vitest';

const limit = vi.fn();
const select = vi.fn(() => ({ limit }));
const from = vi.fn(() => ({ select }));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: { from },
}));

const loadModule = async () => import('./bookVisibility');

describe('book visibility and schema capability helpers', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('returns no archived IDs initially and rejects empty IDs', async () => {
    const visibility = await loadModule();
    expect(visibility.getLocalArchivedBookIds()).toEqual([]);
    expect(visibility.isBookArchivedInLocalVault()).toBe(false);
    expect(visibility.isBookArchivedInLocalVault(null)).toBe(false);
    expect(visibility.isBookArchivedInLocalVault('missing')).toBe(false);
  });

  it('records and removes archived IDs in memory and local storage', async () => {
    const visibility = await loadModule();
    visibility.recordArchivedBookId('book-1');
    visibility.recordArchivedBookId('book-1');
    expect(visibility.isBookArchivedInLocalVault('book-1')).toBe(true);
    expect(visibility.getLocalArchivedBookIds()).toEqual(['book-1']);
    expect(JSON.parse(localStorage.getItem('sahadhyayi_archived_book_ids_v1') || '[]')).toEqual(['book-1']);

    visibility.removeArchivedBookId('book-1');
    expect(visibility.isBookArchivedInLocalVault('book-1')).toBe(false);
    expect(visibility.getLocalArchivedBookIds()).toEqual([]);
    expect(localStorage.getItem('sahadhyayi_archived_book_ids_v1')).toBe('[]');
  });

  it('does not add empty archive IDs', async () => {
    const visibility = await loadModule();
    visibility.recordArchivedBookId('');
    visibility.removeArchivedBookId('');
    expect(visibility.getLocalArchivedBookIds()).toEqual([]);
  });

  it.each([null, undefined, false, 0, 'book'])('rejects invalid book records: %s', async (book) => {
    const visibility = await loadModule();
    expect(visibility.isBookPubliclyVisible(book)).toBe(false);
  });

  it('keeps legacy and explicitly active books publicly visible', async () => {
    const visibility = await loadModule();
    expect(visibility.isBookPubliclyVisible({ id: 'legacy' })).toBe(true);
    expect(visibility.isBookPubliclyVisible({ status: 'active', catalog_status: 'ACTIVE' })).toBe(true);
    expect(visibility.isBookPubliclyVisible({ status: null, catalog_status: undefined })).toBe(true);
  });

  it.each([
    { catalog_status: 'archived' },
    { catalog_status: ' needs_review ' },
    { status: 'superseded' },
    { status: 'junk' },
    { is_archived: true },
  ])('hides non-public book states: %o', async (book) => {
    const visibility = await loadModule();
    expect(visibility.isBookPubliclyVisible(book)).toBe(false);
  });

  it('hides books registered in the local archive vault', async () => {
    const visibility = await loadModule();
    visibility.recordArchivedBookId('archived-book');
    expect(visibility.isBookPubliclyVisible({ id: 'archived-book', status: 'active' })).toBe(false);
  });

  it('filters invalid and non-public entries without changing visible records', async () => {
    const visibility = await loadModule();
    const visible = { id: 'visible', status: 'active' };
    visibility.recordArchivedBookId('local-only');
    expect(visibility.filterPublicBooks([
      visible,
      { id: 'archived', status: 'archived' },
      { id: 'local-only' },
      null,
    ])).toEqual([visible]);
    expect(visibility.filterPublicBooks(null as never)).toEqual([]);
  });

  it('returns baseline columns by default and adds supported status columns', async () => {
    const visibility = await loadModule();
    expect(visibility.getPublicBookSelectColumns()).toBe(visibility.BASE_BOOK_SELECT_COLUMNS);
    expect(visibility.getPublicBookSelectColumns({
      hasStatus: true,
      hasCatalogStatus: true,
      checked: true,
    })).toBe(`${visibility.BASE_BOOK_SELECT_COLUMNS},status,catalog_status`);
    expect(visibility.getPublicBookSelectColumns({
      hasStatus: false,
      hasCatalogStatus: true,
      checked: true,
    })).toBe(`${visibility.BASE_BOOK_SELECT_COLUMNS},catalog_status`);
  });

  it('deduplicates schema probes and persists successful capabilities', async () => {
    sessionStorage.setItem('sahadhyayi_schema_caps_v1', JSON.stringify({
      hasStatus: false,
      hasCatalogStatus: false,
      checked: false,
    }));
    const visibility = await loadModule();
    limit.mockResolvedValue({ error: null });

    const [first, second] = await Promise.all([
      visibility.detectBookSchemaCapabilities(),
      visibility.detectBookSchemaCapabilities(),
    ]);

    expect(first).toEqual({ hasStatus: true, hasCatalogStatus: true, checked: true });
    expect(second).toEqual(first);
    expect(from).toHaveBeenCalledTimes(1);
    expect(select).toHaveBeenCalledWith('status, catalog_status');
    expect(JSON.parse(sessionStorage.getItem('sahadhyayi_schema_caps_v1') || '{}')).toEqual(first);
  });

  it('falls back to unsupported columns when the schema probe fails', async () => {
    sessionStorage.setItem('sahadhyayi_schema_caps_v1', JSON.stringify({
      hasStatus: false,
      hasCatalogStatus: false,
      checked: false,
    }));
    const visibility = await loadModule();
    limit.mockResolvedValue({ error: { message: 'column does not exist' } });
    await expect(visibility.detectBookSchemaCapabilities()).resolves.toEqual({
      hasStatus: false,
      hasCatalogStatus: false,
      checked: true,
    });
  });

  it('allows callers to set and reset schema capabilities', async () => {
    const visibility = await loadModule();
    visibility.setDetectedBookSchemaCapabilities({ hasStatus: true });
    expect(visibility.getPublicBookSelectColumns()).toBe(`${visibility.BASE_BOOK_SELECT_COLUMNS},status`);
    expect(sessionStorage.getItem('sahadhyayi_schema_caps_v1')).not.toBeNull();

    visibility.resetBookSchemaCapabilities();
    expect(visibility.getPublicBookSelectColumns()).toBe(visibility.BASE_BOOK_SELECT_COLUMNS);
    expect(sessionStorage.getItem('sahadhyayi_schema_caps_v1')).toBeNull();
  });

  it('applies only the filters supported by the detected schema', async () => {
    const visibility = await loadModule();
    const query = { or: vi.fn(function (this: unknown) { return this; }), not: vi.fn(function (this: unknown) { return this; }) };
    visibility.applyPublicBookFilter(query, {
      hasStatus: true,
      hasCatalogStatus: true,
      checked: true,
    });
    expect(query.or).toHaveBeenNthCalledWith(1, 'catalog_status.is.null,catalog_status.eq.active');
    expect(query.or).toHaveBeenNthCalledWith(2, 'status.is.null,status.eq.active');
  });

  it('excludes locally archived IDs from database queries when the list is safe to pass', async () => {
    const visibility = await loadModule();
    visibility.recordArchivedBookId('book-1');
    const query = { or: vi.fn(function (this: unknown) { return this; }), not: vi.fn(function (this: unknown) { return this; }) };
    visibility.applyPublicBookFilter(query, { hasStatus: false, hasCatalogStatus: false, checked: true });
    expect(query.not).toHaveBeenCalledWith('id', 'in', '(book-1)');
  });

  it('does not construct an oversized local archive exclusion filter', async () => {
    const visibility = await loadModule();
    for (let index = 0; index < 101; index += 1) visibility.recordArchivedBookId(`book-${index}`);
    const query = { or: vi.fn(function (this: unknown) { return this; }), not: vi.fn(function (this: unknown) { return this; }) };
    visibility.applyPublicBookFilter(query, { hasStatus: false, hasCatalogStatus: false, checked: true });
    expect(query.not).not.toHaveBeenCalled();
  });
});
