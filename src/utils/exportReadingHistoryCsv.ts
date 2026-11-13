import { BookshelfItem } from '@/hooks/useUserBookshelf';
import { ReadingLog } from '@/hooks/useReadingLogs';

function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return '""';
  const str = String(value);
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function generateReadingHistoryCsv(
  bookshelfItems: BookshelfItem[],
  readingLogs: ReadingLog[] = []
): string {
  const headers = [
    'Book Title',
    'Author',
    'Status',
    'Pages Read',
    'Total Pages',
    'Progress %',
    'Rating (1-5)',
    'Started Date',
    'Completed Date',
    'DNF Date',
    'DNF Reason',
    'Sessions Count',
    'Total Minutes Read',
    'Private Notes',
  ];

  const rows: string[] = [headers.map(escapeCsvField).join(',')];

  for (const item of bookshelfItems) {
    const bookTitle = item.books_library?.title || item.book?.title || 'Untitled';
    const author = item.books_library?.author || item.book?.author || 'Unknown';
    const totalPages = item.books_library?.pages || 0;
    const itemLogs = readingLogs.filter(
      (l) => l.book_id === item.book_id || (l.book_title && l.book_title === bookTitle)
    );
    const sessionCount = itemLogs.length;
    const totalMinutes = itemLogs.reduce((s, l) => s + (l.minutes_read || 0), 0);
    const totalLoggedPages = itemLogs.reduce((s, l) => s + (l.pages_read || 0), 0);
    const pagesRead = Math.max(item.dnf_page || 0, totalLoggedPages);
    const progressPercent =
      totalPages > 0 ? Math.min(100, Math.round((pagesRead / totalPages) * 100)) : 0;

    const row = [
      escapeCsvField(bookTitle),
      escapeCsvField(author),
      escapeCsvField(item.status),
      escapeCsvField(pagesRead || ''),
      escapeCsvField(totalPages || ''),
      escapeCsvField(progressPercent ? `${progressPercent}%` : ''),
      escapeCsvField(item.rating || ''),
      escapeCsvField(item.started_at ? item.started_at.slice(0, 10) : ''),
      escapeCsvField(item.completed_at ? item.completed_at.slice(0, 10) : ''),
      escapeCsvField(item.dnf_date ? item.dnf_date.slice(0, 10) : ''),
      escapeCsvField(item.dnf_reason || ''),
      escapeCsvField(sessionCount),
      escapeCsvField(totalMinutes),
      escapeCsvField(item.dnf_notes || item.notes || ''),
    ];

    rows.push(row.join(','));
  }

  // UTF-8 BOM prefix (\uFEFF) ensures international characters render correctly in Excel
  return '\uFEFF' + rows.join('\r\n');
}

export function downloadReadingHistoryCsv(
  bookshelfItems: BookshelfItem[],
  readingLogs: ReadingLog[] = [],
  filenamePrefix = 'sahadhyayi_reading_history'
): void {
  const csvContent = generateReadingHistoryCsv(bookshelfItems, readingLogs);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const dateStr = new Date().toISOString().slice(0, 10);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filenamePrefix}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
