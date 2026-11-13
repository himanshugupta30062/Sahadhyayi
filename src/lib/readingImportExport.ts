/**
 * Sahadhyayi — Reading Import and Export Engine
 * Supports Goodreads CSV, StoryGraph CSV, Generic CSV, and Sahadhyayi JSON backups.
 * Fully RFC 4180 compliant with formula injection protection and catalog matching.
 */

export type ReadingStatus = 'want_to_read' | 'reading' | 'completed' | 'dnf';

export type ImportSourceFormat = 'goodreads' | 'storygraph' | 'generic' | 'sahadhyayi_json' | 'unknown';

export interface ParsedImportBook {
  externalId?: string;
  title: string;
  author: string;
  additionalAuthors?: string;
  isbn?: string;
  isbn13?: string;
  status: ReadingStatus;
  rating?: number | null;
  dateRead?: string | null;
  dateAdded?: string | null;
  review?: string | null;
  pageCount?: number | null;
  pagesRead?: number | null;
  tags?: string[];
  matchedCatalogBookId?: string | null;
  matchType?: 'exact_isbn' | 'title_author' | 'manual' | 'unmatched';
  isValid: boolean;
  validationErrors: string[];
}

export interface CatalogBook {
  id: string;
  title: string;
  author?: string | null;
  isbn?: string | null;
  isbn13?: string | null;
  cover_image_url?: string | null;
  total_pages?: number | null;
}

export interface ImportPreviewSummary {
  format: ImportSourceFormat;
  totalRows: number;
  validCount: number;
  invalidCount: number;
  matchedCount: number;
  unmatchedCount: number;
  statusBreakdown: Record<ReadingStatus, number>;
  books: ParsedImportBook[];
}

export interface SahadhyayiBackupData {
  version: 'sahadhyayi-backup-v1';
  exportedAt: string;
  user?: {
    id: string;
    email?: string;
    displayName?: string;
  };
  bookshelf?: Array<{
    book_id: string;
    title: string;
    author?: string | null;
    status: ReadingStatus;
    rating?: number | null;
    progress?: number | null;
    added_at?: string;
    completed_at?: string | null;
    notes?: string | null;
  }>;
  reviews?: Array<{
    book_id: string;
    title: string;
    rating: number;
    review_content?: string | null;
    created_at?: string;
  }>;
  journalEntries?: Array<{
    id?: string;
    book_id?: string | null;
    title?: string;
    content: string;
    created_at?: string;
    tags?: string[];
    is_pinned?: boolean;
    folder_id?: string | null;
  }>;
  readingGoals?: Array<{
    year: number;
    target_books?: number;
    target_pages?: number;
  }>;
}

// ----------------------------------------------------------------------
// 1. RFC 4180 CSV Parsing & Sanitization
// ----------------------------------------------------------------------

/**
 * Parses raw CSV string handling quoted fields, commas inside quotes,
 * escaped quotes (""), and CRLF/LF line breaks according to RFC 4180.
 */
export const parseCsv = (csvText: string): string[][] => {
  if (!csvText || typeof csvText !== 'string') return [];

  // Remove leading UTF-8 BOM if present
  let cleanText = csvText;
  if (cleanText.charCodeAt(0) === 0xfeff) {
    cleanText = cleanText.slice(1);
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;

  while (i < cleanText.length) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote: "" -> "
          currentField += '"';
          i += 2;
          continue;
        } else {
          // Closing quote
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        currentField += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
        i++;
        continue;
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i++; // consume LF
        }
        currentRow.push(currentField);
        currentField = '';
        rows.push(currentRow);
        currentRow = [];
        i++;
        continue;
      } else if (char === '\n') {
        currentRow.push(currentField);
        currentField = '';
        rows.push(currentRow);
        currentRow = [];
        i++;
        continue;
      } else {
        currentField += char;
        i++;
        continue;
      }
    }
  }

  // Push last field & row if present
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  // Filter out any purely empty trailing row
  return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0].trim().length > 0));
};

/**
 * Sanitizes a field against CSV formula injection (=, +, -, @, tab, cr).
 * If a dangerous prefix is found, prepend a single quote (').
 * Also wraps with double quotes if field contains commas, quotes, or newlines.
 */
export const escapeCsvField = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  let str = String(value);

  // Prevent spreadsheet formula injection
  const dangerousPrefixes = ['=', '+', '-', '@', '\t', '\r'];
  if (dangerousPrefixes.some((p) => str.startsWith(p))) {
    str = `'${str}`;
  }

  // If contains quotes, commas, newlines, wrap in quotes and escape internal quotes
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
};

/**
 * Formats a 2D array into an RFC 4180 CSV string with UTF-8 BOM.
 */
export const toCsv = (headers: string[], rows: (string | number | null | undefined)[][]): string => {
  const headerLine = headers.map(escapeCsvField).join(',');
  const rowLines = rows.map((row) => row.map(escapeCsvField).join(','));
  return `\uFEFF${[headerLine, ...rowLines].join('\r\n')}`;
};

// ----------------------------------------------------------------------
// 2. Format Detection
// ----------------------------------------------------------------------

const normalizeHeader = (h: string): string =>
  h.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

export const detectImportFormat = (
  headers: string[],
  rawText?: string
): ImportSourceFormat => {
  if (rawText && rawText.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(rawText);
      if (parsed.version === 'sahadhyayi-backup-v1' || Array.isArray(parsed.bookshelf)) {
        return 'sahadhyayi_json';
      }
    } catch {
      // not valid JSON, fallback to headers check
    }
  }

  const normalized = new Set(headers.map(normalizeHeader));

  // Goodreads standard headers
  if (
    normalized.has('bookid') &&
    normalized.has('title') &&
    normalized.has('author') &&
    (normalized.has('exclusiveshelf') || normalized.has('myrating'))
  ) {
    return 'goodreads';
  }

  // StoryGraph standard headers
  if (
    (normalized.has('title') && normalized.has('authors') && normalized.has('readstatus')) ||
    (normalized.has('readstatus') && normalized.has('starrating'))
  ) {
    return 'storygraph';
  }

  // Generic CSV with minimum viable headers
  if (normalized.has('title') && (normalized.has('author') || normalized.has('authors'))) {
    return 'generic';
  }

  return 'unknown';
};

// ----------------------------------------------------------------------
// 3. String & Field Cleaning Utilities
// ----------------------------------------------------------------------

/**
 * Cleans Goodreads wrapped ISBNs like `="0123456789"` or `=0123456789`
 */
export const cleanIsbn = (val?: string | null): string => {
  if (!val) return '';
  return val.replace(/^[="']+/, '').replace(/["']+$/, '').replace(/[^0-9Xx]/g, '').trim();
};

export const normalizeString = (str?: string | null): string =>
  (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const parseRatingNumber = (val?: string | number | null): number | null => {
  if (val === null || val === undefined || val === '') return null;
  const num = typeof val === 'number' ? val : parseFloat(String(val).trim());
  if (isNaN(num) || num <= 0) return null;
  return Math.min(5, Math.max(1, Math.round(num)));
};

export const parseNumberOrNull = (val?: string | number | null): number | null => {
  if (val === null || val === undefined || val === '') return null;
  const num = typeof val === 'number' ? val : parseInt(String(val).trim(), 10);
  return isNaN(num) || num <= 0 ? null : num;
};

// ----------------------------------------------------------------------
// 4. Parsers for Specific Sources
// ----------------------------------------------------------------------

export const parseGoodreadsCsv = (headers: string[], rows: string[][]): ParsedImportBook[] => {
  const colMap = new Map<string, number>();
  headers.forEach((h, idx) => colMap.set(normalizeHeader(h), idx));

  const get = (row: string[], colName: string) => {
    const idx = colMap.get(normalizeHeader(colName));
    return idx !== undefined && idx < row.length ? row[idx].trim() : '';
  };

  return rows.map((row) => {
    const title = get(row, 'Title');
    const author = get(row, 'Author');
    const additionalAuthors = get(row, 'Additional Authors');
    const externalId = get(row, 'Book Id');
    const rawIsbn = get(row, 'ISBN');
    const rawIsbn13 = get(row, 'ISBN13');
    const shelf = get(row, 'Exclusive Shelf').toLowerCase();
    const ratingRaw = get(row, 'My Rating');
    const dateRead = get(row, 'Date Read');
    const dateAdded = get(row, 'Date Added');
    const review = get(row, 'My Review');
    const pageCountRaw = get(row, 'Number of Pages');

    let status: ReadingStatus = 'want_to_read';
    if (shelf === 'read') status = 'completed';
    else if (shelf === 'currently-reading') status = 'reading';
    else if (shelf === 'to-read') status = 'want_to_read';
    else if (shelf === 'did-not-finish' || shelf === 'dnf') status = 'dnf';

    const validationErrors: string[] = [];
    if (!title) validationErrors.push('Missing book title');

    return {
      externalId: externalId || undefined,
      title: title || 'Untitled Book',
      author: author || 'Unknown Author',
      additionalAuthors: additionalAuthors || undefined,
      isbn: cleanIsbn(rawIsbn) || undefined,
      isbn13: cleanIsbn(rawIsbn13) || undefined,
      status,
      rating: parseRatingNumber(ratingRaw),
      dateRead: dateRead || null,
      dateAdded: dateAdded || null,
      review: review ? review.replace(/<br\s*\/?>/gi, '\n') : null,
      pageCount: parseNumberOrNull(pageCountRaw),
      isValid: validationErrors.length === 0,
      validationErrors,
    };
  });
};

export const parseStoryGraphCsv = (headers: string[], rows: string[][]): ParsedImportBook[] => {
  const colMap = new Map<string, number>();
  headers.forEach((h, idx) => colMap.set(normalizeHeader(h), idx));

  const get = (row: string[], colName: string) => {
    const idx = colMap.get(normalizeHeader(colName));
    return idx !== undefined && idx < row.length ? row[idx].trim() : '';
  };

  return rows.map((row) => {
    const title = get(row, 'Title');
    const author = get(row, 'Authors') || get(row, 'Author');
    const isbnRaw = get(row, 'ISBN/UID') || get(row, 'ISBN');
    const statusRaw = get(row, 'Read Status').toLowerCase();
    const starRating = get(row, 'Star Rating');
    const dateRead = get(row, 'Last Date Read') || get(row, 'Date Read');
    const dateAdded = get(row, 'Date Added');
    const review = get(row, 'Review');
    const tagsRaw = get(row, 'Tags');

    let status: ReadingStatus = 'want_to_read';
    if (statusRaw === 'read') status = 'completed';
    else if (statusRaw === 'currently-reading') status = 'reading';
    else if (statusRaw === 'to-read') status = 'want_to_read';
    else if (statusRaw === 'did-not-finish' || statusRaw === 'dnf') status = 'dnf';

    const isbnClean = cleanIsbn(isbnRaw);
    const validationErrors: string[] = [];
    if (!title) validationErrors.push('Missing book title');

    return {
      title: title || 'Untitled Book',
      author: author || 'Unknown Author',
      isbn: isbnClean.length === 10 ? isbnClean : undefined,
      isbn13: isbnClean.length === 13 ? isbnClean : undefined,
      status,
      rating: parseRatingNumber(starRating),
      dateRead: dateRead || null,
      dateAdded: dateAdded || null,
      review: review || null,
      tags: tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
      isValid: validationErrors.length === 0,
      validationErrors,
    };
  });
};

export const parseGenericCsv = (headers: string[], rows: string[][]): ParsedImportBook[] => {
  const colMap = new Map<string, number>();
  headers.forEach((h, idx) => colMap.set(normalizeHeader(h), idx));

  const get = (row: string[], colName: string) => {
    const idx = colMap.get(normalizeHeader(colName));
    return idx !== undefined && idx < row.length ? row[idx].trim() : '';
  };

  return rows.map((row) => {
    const title = get(row, 'Title');
    const author = get(row, 'Author') || get(row, 'Authors');
    const rawStatus = get(row, 'Status').toLowerCase();
    const ratingRaw = get(row, 'Rating') || get(row, 'My Rating');
    const isbnRaw = get(row, 'ISBN') || get(row, 'ISBN13');
    const dateRead = get(row, 'Date Read') || get(row, 'Completed At');
    const dateAdded = get(row, 'Date Added') || get(row, 'Added At');
    const review = get(row, 'Review') || get(row, 'Notes');
    const pagesRaw = get(row, 'Pages') || get(row, 'Page Count');

    let status: ReadingStatus = 'want_to_read';
    if (['read', 'completed', 'finished'].includes(rawStatus)) status = 'completed';
    else if (['reading', 'currently-reading', 'current'].includes(rawStatus)) status = 'reading';
    else if (['want_to_read', 'to-read', 'plan-to-read'].includes(rawStatus)) status = 'want_to_read';
    else if (['dnf', 'did-not-finish', 'abandoned'].includes(rawStatus)) status = 'dnf';

    const isbnClean = cleanIsbn(isbnRaw);
    const validationErrors: string[] = [];
    if (!title) validationErrors.push('Missing book title');

    return {
      title: title || 'Untitled Book',
      author: author || 'Unknown Author',
      isbn: isbnClean.length === 10 ? isbnClean : undefined,
      isbn13: isbnClean.length === 13 ? isbnClean : undefined,
      status,
      rating: parseRatingNumber(ratingRaw),
      dateRead: dateRead || null,
      dateAdded: dateAdded || null,
      review: review || null,
      pageCount: parseNumberOrNull(pagesRaw),
      isValid: validationErrors.length === 0,
      validationErrors,
    };
  });
};

export const parseSahadhyayiBackupJson = (jsonText: string): ParsedImportBook[] => {
  try {
    const data: SahadhyayiBackupData = JSON.parse(jsonText);
    const shelfItems = data.bookshelf || [];

    return shelfItems.map((item) => ({
      externalId: item.book_id,
      title: item.title || 'Untitled Book',
      author: item.author || 'Unknown Author',
      status: item.status || 'want_to_read',
      rating: item.rating ?? null,
      pagesRead: item.progress ?? null,
      dateRead: item.completed_at || null,
      dateAdded: item.added_at || null,
      review: item.notes || null,
      isValid: Boolean(item.title),
      validationErrors: item.title ? [] : ['Missing book title'],
    }));
  } catch {
    return [];
  }
};

// ----------------------------------------------------------------------
// 5. Catalog Matching Engine
// ----------------------------------------------------------------------

export const matchBooksAgainstCatalog = (
  importedBooks: ParsedImportBook[],
  catalog: CatalogBook[]
): {
  matched: ParsedImportBook[];
  unmatched: ParsedImportBook[];
  all: ParsedImportBook[];
} => {
  // Index catalog by ISBN13, ISBN10, and normalized Title+Author
  const isbn13Map = new Map<string, CatalogBook>();
  const isbn10Map = new Map<string, CatalogBook>();
  const titleAuthorMap = new Map<string, CatalogBook>();

  catalog.forEach((b) => {
    if (b.isbn13) isbn13Map.set(cleanIsbn(b.isbn13), b);
    if (b.isbn) isbn10Map.set(cleanIsbn(b.isbn), b);

    const normKey = `${normalizeString(b.title)}|${normalizeString(b.author)}`;
    if (!titleAuthorMap.has(normKey)) {
      titleAuthorMap.set(normKey, b);
    }
  });

  const matched: ParsedImportBook[] = [];
  const unmatched: ParsedImportBook[] = [];
  const all: ParsedImportBook[] = [];

  importedBooks.forEach((book) => {
    let matchedCatalog: CatalogBook | undefined;
    let matchType: 'exact_isbn' | 'title_author' | 'unmatched' = 'unmatched';

    // 1. Try ISBN-13
    if (book.isbn13 && isbn13Map.has(book.isbn13)) {
      matchedCatalog = isbn13Map.get(book.isbn13);
      matchType = 'exact_isbn';
    }

    // 2. Try ISBN-10
    if (!matchedCatalog && book.isbn && isbn10Map.has(book.isbn)) {
      matchedCatalog = isbn10Map.get(book.isbn);
      matchType = 'exact_isbn';
    }

    // 3. Try Normalized Title + Author
    if (!matchedCatalog) {
      const key = `${normalizeString(book.title)}|${normalizeString(book.author)}`;
      if (titleAuthorMap.has(key)) {
        matchedCatalog = titleAuthorMap.get(key);
        matchType = 'title_author';
      }
    }

    const processed: ParsedImportBook = {
      ...book,
      matchedCatalogBookId: matchedCatalog?.id || null,
      matchType,
      pageCount: book.pageCount || matchedCatalog?.total_pages || null,
    };

    all.push(processed);
    if (matchedCatalog) {
      matched.push(processed);
    } else {
      unmatched.push(processed);
    }
  });

  return { matched, unmatched, all };
};

// ----------------------------------------------------------------------
// 6. High-Level Import Pipeline Runner
// ----------------------------------------------------------------------

export const runImportPipeline = (
  rawContent: string,
  catalog: CatalogBook[] = []
): ImportPreviewSummary => {
  let parsedBooks: ParsedImportBook[] = [];
  let format: ImportSourceFormat = 'unknown';

  if (rawContent.trim().startsWith('{')) {
    format = 'sahadhyayi_json';
    parsedBooks = parseSahadhyayiBackupJson(rawContent);
  } else {
    const rows = parseCsv(rawContent);
    if (rows.length === 0) {
      return {
        format: 'unknown',
        totalRows: 0,
        validCount: 0,
        invalidCount: 0,
        matchedCount: 0,
        unmatchedCount: 0,
        statusBreakdown: { want_to_read: 0, reading: 0, completed: 0, dnf: 0 },
        books: [],
      };
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);
    format = detectImportFormat(headers, rawContent);

    if (format === 'goodreads') {
      parsedBooks = parseGoodreadsCsv(headers, dataRows);
    } else if (format === 'storygraph') {
      parsedBooks = parseStoryGraphCsv(headers, dataRows);
    } else {
      parsedBooks = parseGenericCsv(headers, dataRows);
    }
  }

  const { all, matched, unmatched } = matchBooksAgainstCatalog(parsedBooks, catalog);

  const statusBreakdown: Record<ReadingStatus, number> = {
    want_to_read: 0,
    reading: 0,
    completed: 0,
    dnf: 0,
  };

  let validCount = 0;
  let invalidCount = 0;

  all.forEach((b) => {
    if (b.isValid) validCount++;
    else invalidCount++;
    statusBreakdown[b.status] = (statusBreakdown[b.status] || 0) + 1;
  });

  return {
    format,
    totalRows: all.length,
    validCount,
    invalidCount,
    matchedCount: matched.length,
    unmatchedCount: unmatched.length,
    statusBreakdown,
    books: all,
  };
};

// ----------------------------------------------------------------------
// 7. Multi-Format Exporters
// ----------------------------------------------------------------------

export interface ExportableBookshelfItem {
  id?: string;
  book_id: string;
  title: string;
  author?: string | null;
  isbn?: string | null;
  isbn13?: string | null;
  status: ReadingStatus | string;
  rating?: number | null;
  progress?: number | null;
  added_at?: string;
  completed_at?: string | null;
  notes?: string | null;
}

export const exportBookshelfCsv = (items: ExportableBookshelfItem[]): string => {
  const headers = [
    'Book ID',
    'Title',
    'Author',
    'ISBN',
    'ISBN13',
    'Status',
    'Rating',
    'Progress (%)',
    'Date Added',
    'Date Completed',
    'Notes',
  ];

  const rows = items.map((b) => [
    b.book_id,
    b.title,
    b.author || '',
    b.isbn || '',
    b.isbn13 || '',
    b.status,
    b.rating ?? '',
    b.progress ?? '',
    b.added_at || '',
    b.completed_at || '',
    b.notes || '',
  ]);

  return toCsv(headers, rows);
};

export interface ExportableHistoryLog {
  id?: string;
  bookTitle: string;
  author?: string | null;
  date: string;
  pagesRead?: number | null;
  durationMinutes?: number | null;
  sessionNotes?: string | null;
}

export const exportReadingHistoryCsv = (logs: ExportableHistoryLog[]): string => {
  const headers = [
    'Date',
    'Book Title',
    'Author',
    'Pages Read',
    'Duration (Minutes)',
    'Session Notes',
  ];

  const rows = logs.map((l) => [
    l.date,
    l.bookTitle,
    l.author || '',
    l.pagesRead ?? '',
    l.durationMinutes ?? '',
    l.sessionNotes || '',
  ]);

  return toCsv(headers, rows);
};

export interface ExportableReview {
  bookTitle: string;
  author?: string | null;
  rating: number;
  reviewContent?: string | null;
  createdAt: string;
}

export const exportReviewsCsv = (reviews: ExportableReview[]): string => {
  const headers = ['Book Title', 'Author', 'Rating', 'Review Content', 'Created At'];
  const rows = reviews.map((r) => [
    r.bookTitle,
    r.author || '',
    r.rating,
    r.reviewContent || '',
    r.createdAt,
  ]);
  return toCsv(headers, rows);
};

export interface ExportableJournalEntry {
  title?: string;
  bookTitle?: string | null;
  content: string;
  createdAt: string;
  tags?: string[];
  folderName?: string | null;
}

export const exportReadingJournalMarkdown = (entries: ExportableJournalEntry[]): string => {
  const header = `# Sahadhyayi — Personal Reading Journal Export\nExported on: ${new Date().toISOString()}\n\n---\n\n`;

  const body = entries
    .map((e, idx) => {
      const title = e.title || `Journal Entry #${idx + 1}`;
      const bookLine = e.bookTitle ? `**Book**: ${e.bookTitle}\n` : '';
      const folderLine = e.folderName ? `**Collection**: ${e.folderName}\n` : '';
      const tagsLine = e.tags && e.tags.length > 0 ? `**Tags**: ${e.tags.map((t) => `#${t}`).join(' ')}\n` : '';
      const dateLine = `**Date**: ${e.createdAt}\n`;

      return `## ${title}\n${dateLine}${bookLine}${folderLine}${tagsLine}\n${e.content}\n\n---`;
    })
    .join('\n\n');

  return header + body;
};

export const exportSahadhyayiJsonBackup = (data: SahadhyayiBackupData): string => {
  return JSON.stringify(data, null, 2);
};

/**
 * Triggers a client-side file download via Blob and dynamic anchor.
 */
export const downloadExportFile = (
  content: string,
  filename: string,
  mimeType = 'text/csv;charset=utf-8;'
): void => {
  if (typeof window === 'undefined') return;

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
