import { describe, expect, it } from 'vitest';
import { generateReadingHistoryCsv } from './exportReadingHistoryCsv';
import { BookshelfItem } from '@/hooks/useUserBookshelf';
import { ReadingLog } from '@/hooks/useReadingLogs';

describe('exportReadingHistoryCsv', () => {
  it('generates valid CSV with escaped quotes and BOM prefix', () => {
    const mockBooks: BookshelfItem[] = [
      {
        id: '1',
        user_id: 'u1',
        book_id: 'b1',
        status: 'completed',
        rating: 5,
        started_at: '2026-01-01T00:00:00Z',
        completed_at: '2026-01-10T00:00:00Z',
        added_at: '2026-01-01T00:00:00Z',
        books_library: {
          id: 'b1',
          title: 'The "Classic" Novel, Vol 1',
          author: 'Famous, Author',
          pages: 350,
        },
      },
    ];

    const mockLogs: ReadingLog[] = [
      {
        id: 'l1',
        user_id: 'u1',
        book_id: 'b1',
        book_title: 'The "Classic" Novel, Vol 1',
        pages_read: 50,
        minutes_read: 30,
        logged_at: '2026-01-05T00:00:00Z',
      },
    ];

    const csv = generateReadingHistoryCsv(mockBooks, mockLogs);

    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"The ""Classic"" Novel, Vol 1"');
    expect(csv).toContain('"Famous, Author"');
    expect(csv).toContain('"completed"');
    expect(csv).toContain('"5"');
  });

  it('handles empty bookshelf gracefully', () => {
    const csv = generateReadingHistoryCsv([], []);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    const lines = csv.trim().split('\r\n');
    expect(lines.length).toBe(1); // Header row only
  });
});
