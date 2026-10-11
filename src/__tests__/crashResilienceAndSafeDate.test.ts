import { describe, expect, it, vi } from 'vitest';
import { safeFormatDistanceToNow } from '@/lib/dateUtils';
import { fetchCurrentReads } from '@/lib/supabase/userBooks';

vi.mock('@/integrations/supabase/client-universal', () => {
  return {
    supabase: {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user-123' } },
        }),
      },
      from: vi.fn((table: string) => {
        if (table === 'user_bookshelf') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({
              data: [
                {
                  id: 'shelf-1',
                  book_id: 'book-101',
                  status: 'reading',
                  added_at: '2026-10-12T00:00:00Z',
                },
              ],
              error: null,
            }),
          };
        }
        if (table === 'books_library') {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({
              data: [
                {
                  id: 'book-101',
                  title: 'Dune',
                  author: 'Frank Herbert',
                  cover_image_url: 'https://example.com/dune.jpg',
                },
              ],
              error: null,
            }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      }),
    },
  };
});

describe('Crash resilience and date safety', () => {
  it('safeFormatDistanceToNow handles null, undefined, invalid string without throwing', () => {
    expect(safeFormatDistanceToNow(null)).toBe('recently');
    expect(safeFormatDistanceToNow(undefined)).toBe('recently');
    expect(safeFormatDistanceToNow('')).toBe('recently');
    expect(safeFormatDistanceToNow('not-a-valid-date')).toBe('recently');
    expect(safeFormatDistanceToNow(new Date(Date.now() - 60000), { addSuffix: true })).toMatch(/minute/);
  });

  it('fetchCurrentReads safely resolves books with decoupled secondary query', async () => {
    const reads = await fetchCurrentReads();
    expect(Array.isArray(reads)).toBe(true);
    expect(reads).toHaveLength(1);
    expect(reads[0].book_id).toBe('book-101');
    expect(reads[0].books_library.title).toBe('Dune');
    expect(reads[0].books_library.author).toBe('Frank Herbert');
  });
});
