// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';
import { fetchPaginatedRows, slugify } from '../../scripts/seoBuildUtils.mjs';

describe('shared SEO build helpers', () => {
  it('keeps Unicode author slugs consistent and handles empty values', () => {
    expect(slugify('  Munshi Premchand  ')).toBe('munshi-premchand');
    expect(slugify('मुनशी प्रेमचंद')).toBe('मुनशी-प्रेमचंद');
    expect(slugify('')).toBe('');
    expect(slugify(null)).toBe('');
  });

  it('fetches all rows in bounded pages and stops on a short page', async () => {
    const rows = Array.from({ length: 1001 }, (_, index) => ({ id: index + 1 }));
    const range = vi.fn(async (start: number, end: number) => ({
      data: rows.slice(start, end + 1),
      error: null,
    }));
    const result = await fetchPaginatedRows({ range }, 'books', 2000);
    expect(result.data).toHaveLength(1001);
    expect(result.error).toBeNull();
    expect(range).toHaveBeenNthCalledWith(1, 0, 999);
    expect(range).toHaveBeenNthCalledWith(2, 1000, 1999);
  });

  it('returns backend errors without masking them', async () => {
    const error = new Error('permission denied');
    const range = vi.fn().mockResolvedValue({ data: null, error });
    await expect(fetchPaginatedRows({ range }, 'authors', 1000)).resolves.toEqual({ data: null, error });
    expect(range).toHaveBeenCalledTimes(1);
  });

  it('calls the safety-cap callback when the configured maximum is reached', async () => {
    const range = vi.fn().mockResolvedValue({ data: [{ id: 1 }, { id: 2 }], error: null });
    const onLimit = vi.fn();
    const result = await fetchPaginatedRows({ range }, 'books', 2, onLimit, 2);
    expect(result.data).toEqual([{ id: 1 }, { id: 2 }]);
    expect(onLimit).toHaveBeenCalledWith('books', 2);
  });
});
