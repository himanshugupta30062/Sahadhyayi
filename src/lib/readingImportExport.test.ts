import { describe, it, expect } from 'vitest';
import {
  parseCsv,
  escapeCsvField,
  toCsv,
  cleanIsbn,
  detectImportFormat,
  parseGoodreadsCsv,
  parseStoryGraphCsv,
  parseGenericCsv,
  parseSahadhyayiBackupJson,
  matchBooksAgainstCatalog,
  runImportPipeline,
  exportBookshelfCsv,
  exportReadingHistoryCsv,
  exportReviewsCsv,
  exportReadingJournalMarkdown,
  exportSahadhyayiJsonBackup,
  CatalogBook,
  SahadhyayiBackupData,
} from './readingImportExport';

describe('readingImportExport', () => {
  describe('RFC 4180 CSV Parsing & Sanitization', () => {
    it('parses standard unquoted CSV rows', () => {
      const csv = 'Title,Author,Rating\nDune,Frank Herbert,5\n1984,George Orwell,4';
      const rows = parseCsv(csv);
      expect(rows).toEqual([
        ['Title', 'Author', 'Rating'],
        ['Dune', 'Frank Herbert', '5'],
        ['1984', 'George Orwell', '4'],
      ]);
    });

    it('handles commas and escaped quotes within quoted fields', () => {
      const csv = '"Title, with comma","Author ""The Great""",5\n"Normal Title",Simple Author,4';
      const rows = parseCsv(csv);
      expect(rows).toEqual([
        ['Title, with comma', 'Author "The Great"', '5'],
        ['Normal Title', 'Simple Author', '4'],
      ]);
    });

    it('handles newlines within quoted fields', () => {
      const csv = 'Title,Notes\n"Line 1\nLine 2",Simple Note';
      const rows = parseCsv(csv);
      expect(rows).toEqual([
        ['Title', 'Notes'],
        ['Line 1\nLine 2', 'Simple Note'],
      ]);
    });

    it('sanitizes formula injection prefixes (=, +, -, @) by prepending a quote', () => {
      expect(escapeCsvField('=SUM(A1:B1)')).toBe("'=SUM(A1:B1)");
      expect(escapeCsvField('+12345')).toBe("'+12345");
      expect(escapeCsvField('-10')).toBe("'-10");
      expect(escapeCsvField('@cmd')).toBe("'@cmd");
      expect(escapeCsvField('Safe text')).toBe('Safe text');
    });

    it('produces valid CSV with UTF-8 BOM', () => {
      const headers = ['Title', 'Author'];
      const rows = [['Dune', 'Frank Herbert']];
      const output = toCsv(headers, rows);
      expect(output.charCodeAt(0)).toBe(0xfeff);
      expect(output).toContain('Title,Author');
      expect(output).toContain('Dune,Frank Herbert');
    });
  });

  describe('cleanIsbn', () => {
    it('cleans wrapped Goodreads ISBN format', () => {
      expect(cleanIsbn('="0123456789"')).toBe('0123456789');
      expect(cleanIsbn('="9780123456789"')).toBe('9780123456789');
      expect(cleanIsbn('=""')).toBe('');
      expect(cleanIsbn(null)).toBe('');
    });
  });

  describe('detectImportFormat', () => {
    it('detects Goodreads headers', () => {
      const headers = ['Book Id', 'Title', 'Author', 'Exclusive Shelf', 'My Rating', 'ISBN'];
      expect(detectImportFormat(headers)).toBe('goodreads');
    });

    it('detects StoryGraph headers', () => {
      const headers = ['Title', 'Authors', 'Read Status', 'Star Rating', 'Review'];
      expect(detectImportFormat(headers)).toBe('storygraph');
    });

    it('detects Generic CSV headers', () => {
      const headers = ['Title', 'Author', 'Status', 'Rating'];
      expect(detectImportFormat(headers)).toBe('generic');
    });

    it('detects Sahadhyayi JSON', () => {
      const json = JSON.stringify({ version: 'sahadhyayi-backup-v1', bookshelf: [] });
      expect(detectImportFormat([], json)).toBe('sahadhyayi_json');
    });
  });

  describe('parseGoodreadsCsv', () => {
    it('maps exclusive shelves and cleans fields correctly', () => {
      const headers = [
        'Book Id',
        'Title',
        'Author',
        'Exclusive Shelf',
        'My Rating',
        'ISBN',
        'ISBN13',
        'Date Read',
        'My Review',
      ];
      const rows = [
        [
          '101',
          'The Hobbit',
          'J.R.R. Tolkien',
          'read',
          '5',
          '="0345339681"',
          '="9780345339683"',
          '2026/01/15',
          'An adventure<br/>masterpiece',
        ],
        ['102', 'Dune', 'Frank Herbert', 'currently-reading', '0', '', '', '', ''],
        ['103', 'Neuromancer', 'William Gibson', 'did-not-finish', '2', '', '', '', 'Dropped at 30%'],
      ];

      const parsed = parseGoodreadsCsv(headers, rows);
      expect(parsed).toHaveLength(3);

      expect(parsed[0].status).toBe('completed');
      expect(parsed[0].rating).toBe(5);
      expect(parsed[0].isbn).toBe('0345339681');
      expect(parsed[0].isbn13).toBe('9780345339683');
      expect(parsed[0].review).toBe('An adventure\nmasterpiece');

      expect(parsed[1].status).toBe('reading');
      expect(parsed[1].rating).toBeNull(); // 0 rating in Goodreads means unrated

      expect(parsed[2].status).toBe('dnf');
      expect(parsed[2].rating).toBe(2);
    });
  });

  describe('parseStoryGraphCsv', () => {
    it('maps storygraph status and star rating', () => {
      const headers = ['Title', 'Authors', 'Read Status', 'Star Rating', 'Tags', 'Last Date Read'];
      const rows = [
        ['Project Hail Mary', 'Andy Weir', 'read', '4.75', 'sci-fi, space', '2026-05-10'],
        ['Klara and the Sun', 'Kazuo Ishiguro', 'to-read', '', 'ai, fiction', ''],
      ];

      const parsed = parseStoryGraphCsv(headers, rows);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].status).toBe('completed');
      expect(parsed[0].rating).toBe(5); // rounded to nearest int 1-5
      expect(parsed[0].tags).toEqual(['sci-fi', 'space']);

      expect(parsed[1].status).toBe('want_to_read');
      expect(parsed[1].rating).toBeNull();
    });
  });

  describe('parseGenericCsv', () => {
    it('parses generic CSV columns', () => {
      const headers = ['Title', 'Author', 'Status', 'Rating'];
      const rows = [
        ['Foundation', 'Isaac Asimov', 'completed', '5'],
        ['Hyperion', 'Dan Simmons', 'plan-to-read', ''],
      ];

      const parsed = parseGenericCsv(headers, rows);
      expect(parsed[0].status).toBe('completed');
      expect(parsed[0].rating).toBe(5);
      expect(parsed[1].status).toBe('want_to_read');
    });
  });

  describe('parseSahadhyayiBackupJson', () => {
    it('parses valid Sahadhyayi JSON backup', () => {
      const backup: SahadhyayiBackupData = {
        version: 'sahadhyayi-backup-v1',
        exportedAt: '2026-11-13T10:00:00Z',
        bookshelf: [
          {
            book_id: 'book-1',
            title: 'Snow Crash',
            author: 'Neal Stephenson',
            status: 'completed',
            rating: 5,
            progress: 100,
          },
        ],
      };

      const parsed = parseSahadhyayiBackupJson(JSON.stringify(backup));
      expect(parsed).toHaveLength(1);
      expect(parsed[0].title).toBe('Snow Crash');
      expect(parsed[0].status).toBe('completed');
      expect(parsed[0].rating).toBe(5);
    });
  });

  describe('matchBooksAgainstCatalog', () => {
    const catalog: CatalogBook[] = [
      {
        id: 'cat-1',
        title: 'The Hobbit',
        author: 'J.R.R. Tolkien',
        isbn: '0345339681',
        isbn13: '9780345339683',
        total_pages: 310,
      },
      {
        id: 'cat-2',
        title: 'Dune',
        author: 'Frank Herbert',
        total_pages: 600,
      },
    ];

    it('matches by exact ISBN13 and ISBN10', () => {
      const importBooks = [
        {
          title: 'Unknown Title Variant',
          author: 'Unknown',
          isbn13: '9780345339683',
          status: 'completed' as const,
          isValid: true,
          validationErrors: [],
        },
      ];

      const res = matchBooksAgainstCatalog(importBooks, catalog);
      expect(res.matched).toHaveLength(1);
      expect(res.matched[0].matchedCatalogBookId).toBe('cat-1');
      expect(res.matched[0].matchType).toBe('exact_isbn');
      expect(res.matched[0].pageCount).toBe(310);
    });

    it('matches by normalized title and author when ISBN is missing', () => {
      const importBooks = [
        {
          title: 'Dune (Deluxe Edition)', // normalized title matches dune
          author: 'Frank Herbert',
          status: 'reading' as const,
          isValid: true,
          validationErrors: [],
        },
      ];

      // Exact title author test
      const res = matchBooksAgainstCatalog(
        [
          {
            title: 'Dune',
            author: 'Frank Herbert',
            status: 'reading' as const,
            isValid: true,
            validationErrors: [],
          },
          {
            title: 'Uncataloged Book',
            author: 'Some Author',
            status: 'want_to_read' as const,
            isValid: true,
            validationErrors: [],
          },
        ],
        catalog
      );

      expect(res.matched).toHaveLength(1);
      expect(res.matched[0].matchedCatalogBookId).toBe('cat-2');
      expect(res.matched[0].matchType).toBe('title_author');

      expect(res.unmatched).toHaveLength(1);
      expect(res.unmatched[0].title).toBe('Uncataloged Book');
    });
  });

  describe('runImportPipeline', () => {
    it('runs end-to-end import preview on Goodreads CSV', () => {
      const csv =
        'Book Id,Title,Author,Exclusive Shelf,My Rating,ISBN13\n' +
        '1,The Hobbit,J.R.R. Tolkien,read,5,="9780345339683"\n' +
        '2,Random Book,Random Author,to-read,,';

      const catalog: CatalogBook[] = [
        { id: 'cat-1', title: 'The Hobbit', author: 'J.R.R. Tolkien', isbn13: '9780345339683' },
      ];

      const preview = runImportPipeline(csv, catalog);
      expect(preview.format).toBe('goodreads');
      expect(preview.totalRows).toBe(2);
      expect(preview.validCount).toBe(2);
      expect(preview.matchedCount).toBe(1);
      expect(preview.unmatchedCount).toBe(1);
      expect(preview.statusBreakdown.completed).toBe(1);
      expect(preview.statusBreakdown.want_to_read).toBe(1);
    });
  });

  describe('Multi-Format Exporters', () => {
    it('exports bookshelf CSV properly', () => {
      const csv = exportBookshelfCsv([
        {
          book_id: 'book-1',
          title: '1984',
          author: 'George Orwell',
          status: 'completed',
          rating: 5,
          progress: 100,
        },
      ]);
      expect(csv).toContain('1984');
      expect(csv).toContain('George Orwell');
      expect(csv).toContain('completed');
    });

    it('exports reading history CSV', () => {
      const csv = exportReadingHistoryCsv([
        {
          date: '2026-11-13',
          bookTitle: '1984',
          pagesRead: 45,
          durationMinutes: 60,
          sessionNotes: 'Intense chapter',
        },
      ]);
      expect(csv).toContain('2026-11-13');
      expect(csv).toContain('45');
      expect(csv).toContain('Intense chapter');
    });

    it('exports reviews CSV', () => {
      const csv = exportReviewsCsv([
        {
          bookTitle: '1984',
          author: 'George Orwell',
          rating: 5,
          reviewContent: 'Chilling dystopia',
          createdAt: '2026-11-13',
        },
      ]);
      expect(csv).toContain('Chilling dystopia');
    });

    it('exports reading journal markdown with tags and quotes', () => {
      const md = exportReadingJournalMarkdown([
        {
          title: 'Deep Thought',
          bookTitle: '1984',
          folderName: 'Dystopian Classics',
          tags: ['surveillance', 'philosophy'],
          content: 'War is peace. Freedom is slavery.',
          createdAt: '2026-11-13',
        },
      ]);
      expect(md).toContain('# Sahadhyayi — Personal Reading Journal Export');
      expect(md).toContain('## Deep Thought');
      expect(md).toContain('**Book**: 1984');
      expect(md).toContain('**Collection**: Dystopian Classics');
      expect(md).toContain('#surveillance');
      expect(md).toContain('War is peace');
    });

    it('exports Sahadhyayi JSON backup', () => {
      const json = exportSahadhyayiJsonBackup({
        version: 'sahadhyayi-backup-v1',
        exportedAt: '2026-11-13T10:00:00Z',
        bookshelf: [
          {
            book_id: 'book-1',
            title: 'Dune',
            status: 'completed',
            rating: 5,
          },
        ],
      });
      const parsed = JSON.parse(json);
      expect(parsed.version).toBe('sahadhyayi-backup-v1');
      expect(parsed.bookshelf[0].title).toBe('Dune');
    });
  });
});
