/** @vitest-environment jsdom */

import React from 'react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { genreOverlap, cosineSimilarity, matchScore, type ReadingDna } from '@/lib/readingDna';
import { ReadingDnaCard, DnaStrip } from '@/components/social/dna/ReadingDnaCard';
import { safeFormatDistanceToNow } from '@/lib/dateUtils';

describe('Tab Navigation and Component Crash Resilience', () => {
  describe('Reading DNA calculation resilience', () => {
    it('handles null and undefined DNA objects in matchScore without throwing', () => {
      expect(matchScore(null, null)).toBe(0);
      expect(matchScore(undefined, undefined)).toBe(0);
      expect(matchScore({} as any, null)).toBe(0);
    });

    it('handles null, undefined, or empty genres in genreOverlap without throwing', () => {
      const emptyDna: ReadingDna = {
        user_id: 'u1',
        genres: undefined as any,
        moods: undefined as any,
        pace: null,
        themes: undefined as any,
        summary: null,
        signature_color: null,
        generated_at: '2026-01-01',
      };
      const validDna: ReadingDna = {
        user_id: 'u2',
        genres: [{ name: 'Sci-Fi', weight: 0.8 }],
        moods: ['epic'],
        pace: 'fast',
        themes: ['space'],
        summary: 'Reader',
        signature_color: '#333',
        generated_at: '2026-01-01',
      };

      expect(genreOverlap(emptyDna, validDna)).toBe(0);
      expect(genreOverlap(emptyDna, emptyDna)).toBe(0);
      expect(cosineSimilarity(undefined, ['epic'])).toBe(0);
      expect(cosineSimilarity(null, null)).toBe(0);
      expect(matchScore(emptyDna, validDna)).toBe(0);
    });

    it('renders ReadingDnaCard safely with incomplete or null genres/moods/themes', () => {
      const incompleteDna: ReadingDna = {
        user_id: 'u1',
        genres: undefined as any,
        moods: undefined as any,
        pace: null,
        themes: undefined as any,
        summary: null,
        signature_color: null,
        generated_at: '2026-01-01',
      };

      const { container } = render(<ReadingDnaCard dna={incompleteDna} mine />);
      expect(screen.getByText('Your Reading DNA')).toBeInTheDocument();
      expect(screen.getAllByText('Steady').length).toBeGreaterThan(0);
      expect(container).toBeInTheDocument();
    });

    it('renders DnaStrip safely when genres array is undefined', () => {
      const incompleteDna: ReadingDna = {
        user_id: 'u1',
        genres: undefined as any,
        moods: [],
        pace: null,
        themes: [],
        summary: null,
        signature_color: null,
        generated_at: '2026-01-01',
      };

      const { container } = render(<DnaStrip dna={incompleteDna} />);
      expect(container).toBeInTheDocument();
    });
  });

  describe('Date formatting safety across tabs and groups', () => {
    it('safeFormatDistanceToNow gracefully handles null, undefined, empty, and invalid dates', () => {
      expect(safeFormatDistanceToNow(null)).toBe('recently');
      expect(safeFormatDistanceToNow(undefined)).toBe('recently');
      expect(safeFormatDistanceToNow('')).toBe('recently');
      expect(safeFormatDistanceToNow('invalid-time-format')).toBe('recently');
      expect(safeFormatDistanceToNow('NaN')).toBe('recently');
    });

    it('safeFormatDistanceToNow formats valid timestamps correctly', () => {
      const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      expect(safeFormatDistanceToNow(fiveMinsAgo, { addSuffix: true })).toMatch(/minute/i);
    });
  });
});
