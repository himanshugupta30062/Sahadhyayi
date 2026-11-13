import { describe, expect, it } from 'vitest';
import {
  isValidIsbn10,
  isValidIsbn13,
  isbn10ToIsbn13,
  formatIsbn,
  getCanonicalIsbn,
  parseBookSeries,
  compareSeriesVolumes,
  buildSeriesNavigation,
  deduplicateSeriesVolumes,
  mergeEditionMetadata,
  getEditionReadingContext,
} from './bookSeriesAndEditions';
import type { Edition, SeriesVolume } from '@/types/bookCatalog';
import type { BookshelfItem } from '@/hooks/useUserBookshelf';

describe('bookSeriesAndEditions utilities', () => {
  describe('ISBN validation & conversion', () => {
    it('validates ISBN-10 with valid check digits and X', () => {
      expect(isValidIsbn10('0-306-40615-2')).toBe(true);
      expect(isValidIsbn10('080442957X')).toBe(true);
      expect(isValidIsbn10('0804429570')).toBe(false);
      expect(isValidIsbn10('')).toBe(false);
      expect(isValidIsbn10('12345')).toBe(false);
    });

    it('validates ISBN-13 with valid check digits', () => {
      expect(isValidIsbn13('978-0-306-40615-7')).toBe(true);
      expect(isValidIsbn13('9780306406157')).toBe(true);
      expect(isValidIsbn13('9780306406158')).toBe(false);
      expect(isValidIsbn13('invalid')).toBe(false);
    });

    it('converts valid ISBN-10 to canonical ISBN-13', () => {
      // 0306406152 -> 9780306406157
      expect(isbn10ToIsbn13('0-306-40615-2')).toBe('9780306406157');
      expect(isbn10ToIsbn13('invalid')).toBeNull();
    });

    it('formats ISBN into standard hyphenated representation', () => {
      expect(formatIsbn('9780306406157')).toBe('978-0-306-40615-7');
      expect(formatIsbn('0306406152')).toBe('0-306-40615-2');
      expect(formatIsbn('')).toBe('');
    });

    it('extracts canonical ISBN-13 preferring converted or verified values', () => {
      expect(getCanonicalIsbn('0-306-40615-2')).toBe('9780306406157');
      expect(getCanonicalIsbn('978-0-306-40615-7')).toBe('9780306406157');
      expect(getCanonicalIsbn('bad-isbn')).toBeNull();
    });
  });

  describe('Series parsing & reading order', () => {
    it('parses parenthetical series names and volume numbers', () => {
      const parsed1 = parseBookSeries('Dune (Dune Chronicles, #1)');
      expect(parsed1).toEqual({
        seriesName: 'Dune Chronicles',
        volumeNumber: 1,
        rawSequence: '1',
        totalVolumes: null,
        isStandalone: false,
      });

      const parsed2 = parseBookSeries('The Fellowship of the Ring (The Lord of the Rings, Book 1 of 3)');
      expect(parsed2).toEqual({
        seriesName: 'The Lord of the Rings',
        volumeNumber: 1,
        rawSequence: '1',
        totalVolumes: 3,
        isStandalone: false,
      });
    });

    it('handles Roman numerals, prequels and novellas', () => {
      const parsedRoman = parseBookSeries('Star Wars (The Thrawn Trilogy, Vol. II)');
      expect(parsedRoman?.volumeNumber).toBe(2);

      const parsedPrequel = parseBookSeries('The Silmarillion (The Lord of the Rings, Prequel)');
      expect(parsedPrequel?.volumeNumber).toBe(0);
      expect(parsedPrequel?.rawSequence?.toLowerCase()).toBe('prequel');
    });

    it('handles Hindi series and numbering', () => {
      const parsedHindi = parseBookSeries('महाभारत (महागाथा, भाग २)');
      expect(parsedHindi?.seriesName).toBe('महागाथा');
      expect(parsedHindi?.volumeNumber).toBe(2);
    });

    it('handles description fallback and standalone books', () => {
      const parsedDesc = parseBookSeries('Leviathan Wakes', 'Book 1 of The Expanse series. An interplanetary thriller.');
      expect(parsedDesc?.seriesName).toBe('The Expanse');
      expect(parsedDesc?.volumeNumber).toBe(1);

      const standalone = parseBookSeries('To Kill a Mockingbird');
      expect(standalone).toBeNull();
    });

    it('correctly sorts volumes in reading order', () => {
      const volumes: SeriesVolume[] = [
        { bookId: 'b3', title: 'The Return of the King', seriesName: 'LotR', sequenceNumber: 3 },
        { bookId: 'b0', title: 'The Silmarillion', seriesName: 'LotR', sequenceNumber: 0, rawSequence: 'Prequel' },
        { bookId: 'b1', title: 'The Fellowship of the Ring', seriesName: 'LotR', sequenceNumber: 1 },
        { bookId: 'b2', title: 'The Two Towers', seriesName: 'LotR', sequenceNumber: 2 },
      ];

      const sorted = [...volumes].sort(compareSeriesVolumes);
      expect(sorted.map(v => v.bookId)).toEqual(['b0', 'b1', 'b2', 'b3']);
    });

    it('builds previous and next volume navigation links', () => {
      const volumes: SeriesVolume[] = [
        { bookId: 'v1', title: 'Dune', seriesName: 'Dune', sequenceNumber: 1 },
        { bookId: 'v2', title: 'Dune Messiah', seriesName: 'Dune', sequenceNumber: 2 },
        { bookId: 'v3', title: 'Children of Dune', seriesName: 'Dune', sequenceNumber: 3 },
      ];

      const navMiddle = buildSeriesNavigation(volumes, 'v2');
      expect(navMiddle.prevVolume?.bookId).toBe('v1');
      expect(navMiddle.nextVolume?.bookId).toBe('v3');

      const navFirst = buildSeriesNavigation(volumes, 'v1');
      expect(navFirst.prevVolume).toBeNull();
      expect(navFirst.nextVolume?.bookId).toBe('v2');
    });

    it('deduplicates alternative editions from cluttering series list', () => {
      const volumes: SeriesVolume[] = [
        { bookId: 'v1_paper', title: 'Dune (Paperback)', author: 'Frank Herbert', seriesName: 'Dune', sequenceNumber: 1 },
        { bookId: 'v1_hard', title: 'Dune (Hardcover)', author: 'Frank Herbert', seriesName: 'Dune', sequenceNumber: 1 },
        { bookId: 'v2', title: 'Dune Messiah', author: 'Frank Herbert', seriesName: 'Dune', sequenceNumber: 2 },
      ];

      const deduped = deduplicateSeriesVolumes(volumes);
      expect(deduped.length).toBe(2);
      expect(deduped[0].bookId).toBe('v1_paper');
      expect(deduped[1].bookId).toBe('v2');
    });
  });

  describe('Safe metadata merging', () => {
    it('preserves existing user edits and prevents overwrite with empty values', () => {
      const existing: Partial<Edition> = {
        title: 'Original Title',
        author: 'Original Author',
        coverImageUrl: 'https://example.com/cover.jpg',
        description: 'A detailed synopsis written by user.',
        pages: 350,
        isbn13: '9780306406157',
      };

      const incoming: Partial<Edition> = {
        title: 'Incoming Title',
        coverImageUrl: '',
        description: '',
        pages: 0,
      };

      const merged = mergeEditionMetadata(existing, incoming, { preferExistingUserEdits: true });
      expect(merged.title).toBe('Original Title');
      expect(merged.coverImageUrl).toBe('https://example.com/cover.jpg');
      expect(merged.description).toBe('A detailed synopsis written by user.');
      expect(merged.pages).toBe(350);
      expect(merged.isbn13).toBe('9780306406157');
    });

    it('backfills missing fields from incoming data safely', () => {
      const existing: Partial<Edition> = {
        title: 'Book Title',
        author: 'Book Author',
      };

      const incoming: Partial<Edition> = {
        publisher: 'Penguin Classics',
        publicationYear: 2021,
        pages: 420,
        isbn13: '9780306406157',
      };

      const merged = mergeEditionMetadata(existing, incoming);
      expect(merged.publisher).toBe('Penguin Classics');
      expect(merged.publicationYear).toBe(2021);
      expect(merged.pages).toBe(420);
      expect(merged.isbn13).toBe('9780306406157');
    });
  });

  describe('Edition reading context & shelf preservation', () => {
    const mockEditions: Edition[] = [
      {
        id: 'ed_paperback_2018',
        workId: 'dune',
        title: 'Dune',
        author: 'Frank Herbert',
        format: 'Paperback',
        publicationYear: 2018,
        language: 'English',
        pages: 600,
        accessStatus: 'open_access',
        licenseEvidence: { type: 'public_domain', confidence: 'high' },
        qualityScore: 90,
        qualityBreakdown: { metadataCompleteness: 10, editorialAssurance: 15, verifiedAccess: 15, licenseLegitimacy: 25, presentation: 5, readingUsability: 5, demotions: 0 },
        qualityReasons: ['Verified'],
        isPreferredEdition: true,
        assets: [],
        sources: [],
      },
      {
        id: 'ed_hardcover_2021',
        workId: 'dune',
        title: 'Dune: Deluxe Edition',
        author: 'Frank Herbert',
        format: 'Hardcover',
        publicationYear: 2021,
        language: 'English',
        pages: 650,
        accessStatus: 'open_access',
        licenseEvidence: { type: 'public_domain', confidence: 'high' },
        qualityScore: 95,
        qualityBreakdown: { metadataCompleteness: 10, editorialAssurance: 15, verifiedAccess: 15, licenseLegitimacy: 25, presentation: 5, readingUsability: 5, demotions: 0 },
        qualityReasons: ['Verified'],
        isPreferredEdition: false,
        assets: [],
        sources: [],
      },
    ];

    it('identifies when current edition is directly shelved', () => {
      const userShelves: BookshelfItem[] = [
        {
          id: 'shelf_1',
          user_id: 'u1',
          book_id: 'ed_paperback_2018',
          status: 'reading',
          added_at: '2026-01-01',
          progress: 50,
        },
      ];

      const context = getEditionReadingContext('ed_paperback_2018', mockEditions, userShelves);
      expect(context.isCurrentEditionShelved).toBe(true);
      expect(context.hasOtherShelvedEdition).toBe(false);
      expect(context.currentShelfItem?.progress).toBe(50);
    });

    it('detects when another edition is on the shelf and preserves reading history', () => {
      const userShelves: BookshelfItem[] = [
        {
          id: 'shelf_1',
          user_id: 'u1',
          book_id: 'ed_paperback_2018',
          status: 'reading',
          added_at: '2026-01-01',
          progress: 50,
        },
      ];

      // User is currently viewing the 2021 Hardcover edition
      const context = getEditionReadingContext('ed_hardcover_2021', mockEditions, userShelves);
      expect(context.isCurrentEditionShelved).toBe(false);
      expect(context.hasOtherShelvedEdition).toBe(true);
      expect(context.otherShelvedEdition?.id).toBe('ed_paperback_2018');
      expect(context.noticeMessage).toContain('You have another edition of this work');
      expect(context.noticeMessage).toContain('Paperback, 2018');
    });
  });
});

