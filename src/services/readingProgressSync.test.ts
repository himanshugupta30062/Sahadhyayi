import { describe, expect, it, beforeEach } from 'vitest';
import {
  normalizeProgressValues,
  computeSynchronizedStatus,
  getNextRequestSequence,
  isLatestRequestSequence,
  resetRequestSequence,
} from './readingProgressSync';

describe('readingProgressSync domain service', () => {
  beforeEach(() => {
    resetRequestSequence();
  });

  describe('normalizeProgressValues', () => {
    it('normalizes valid page and total page numbers and computes percentage', () => {
      const result = normalizeProgressValues({
        bookId: 'book-1',
        bookTitle: 'The Great Gatsby',
        currentPage: 50,
        totalPages: 200,
      });

      expect(result.bookId).toBe('book-1');
      expect(result.bookTitle).toBe('The Great Gatsby');
      expect(result.currentPage).toBe(50);
      expect(result.totalPages).toBe(200);
      expect(result.percentage).toBe(25);
      expect(result.status).toBe('reading');
      expect(result.isCompleted).toBe(false);
    });

    it('clamps current page to total pages and transitions to completed when final page reached', () => {
      const result = normalizeProgressValues({
        bookId: 'book-1',
        bookTitle: 'The Great Gatsby',
        currentPage: 250,
        totalPages: 200,
      });

      expect(result.currentPage).toBe(200);
      expect(result.totalPages).toBe(200);
      expect(result.percentage).toBe(100);
      expect(result.status).toBe('completed');
      expect(result.isCompleted).toBe(true);
      expect(result.completedAt).toBeDefined();
    });

    it('normalizes fractional page numbers', () => {
      const result = normalizeProgressValues({
        bookId: 'book-1',
        bookTitle: 'Test Book',
        currentPage: 0.8,
        totalPages: 5.9,
      });

      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(5);
      expect(result.percentage).toBe(20);
    });

    it('calculates page number when given percentage input', () => {
      const result = normalizeProgressValues({
        bookId: 'book-1',
        bookTitle: 'Test Book',
        totalPages: 400,
        percentage: 75,
      });

      expect(result.currentPage).toBe(300);
      expect(result.totalPages).toBe(400);
      expect(result.percentage).toBe(75);
      expect(result.status).toBe('reading');
    });

    it('handles books with unknown page count gracefully', () => {
      const result = normalizeProgressValues({
        bookId: 'book-unknown',
        bookTitle: 'Manuscript',
        percentage: 45,
      });

      expect(result.percentage).toBe(45);
      expect(result.currentPage).toBe(45);
      expect(result.totalPages).toBe(100);
      expect(result.status).toBe('reading');
    });

    it('rejects invalid inputs with descriptive errors', () => {
      expect(() =>
        normalizeProgressValues({
          bookId: '  ',
          currentPage: 10,
          totalPages: 100,
        }),
      ).toThrow('Book ID is required');

      expect(() =>
        normalizeProgressValues({
          bookId: 'book-1',
          currentPage: Number.NaN,
          totalPages: 100,
        }),
      ).toThrow('Current page must be a positive number');

      expect(() =>
        normalizeProgressValues({
          bookId: 'book-1',
          currentPage: -5,
          totalPages: 100,
        }),
      ).toThrow('Current page must be a positive number');

      expect(() =>
        normalizeProgressValues({
          bookId: 'book-1',
          currentPage: 10,
          totalPages: 0,
        }),
      ).toThrow('Total pages must be a positive number');

      expect(() =>
        normalizeProgressValues({
          bookId: 'book-1',
          percentage: Number.NaN,
        }),
      ).toThrow('Percentage must be a finite number');
    });
  });

  describe('computeSynchronizedStatus', () => {
    it('transitions want_to_read to reading when reading starts', () => {
      const transition = computeSynchronizedStatus('want_to_read', 10, 200);
      expect(transition.status).toBe('reading');
      expect(transition.isCompleted).toBe(false);
      expect(transition.completedAt).toBeNull();
    });

    it('transitions reading to completed when final page is reached', () => {
      const transition = computeSynchronizedStatus('reading', 200, 200);
      expect(transition.status).toBe('completed');
      expect(transition.isCompleted).toBe(true);
      expect(transition.completedAt).toBeTruthy();
    });

    it('strictly preserves DNF status when browsing pages', () => {
      const transition = computeSynchronizedStatus('dnf', 50, 200);
      expect(transition.status).toBe('dnf');
      expect(transition.isCompleted).toBe(false);
    });

    it('respects explicit status override', () => {
      const transition = computeSynchronizedStatus('reading', 50, 200, 'completed');
      expect(transition.status).toBe('completed');
      expect(transition.isCompleted).toBe(true);
      expect(transition.completedAt).toBeTruthy();
    });
  });

  describe('request sequencing and out-of-order protection', () => {
    it('tracks sequential mutations per book and detects stale responses', () => {
      const bookId = 'book-race-1';

      const seq1 = getNextRequestSequence(bookId);
      expect(seq1).toBe(1);
      expect(isLatestRequestSequence(bookId, seq1)).toBe(true);

      const seq2 = getNextRequestSequence(bookId);
      expect(seq2).toBe(2);

      // seq1 is now stale!
      expect(isLatestRequestSequence(bookId, seq1)).toBe(false);
      expect(isLatestRequestSequence(bookId, seq2)).toBe(true);
    });

    it('isolates sequences across different books', () => {
      const seqA1 = getNextRequestSequence('book-A');
      const seqB1 = getNextRequestSequence('book-B');

      expect(seqA1).toBe(1);
      expect(seqB1).toBe(1);

      expect(isLatestRequestSequence('book-A', seqA1)).toBe(true);
      expect(isLatestRequestSequence('book-B', seqB1)).toBe(true);
    });
  });
});
