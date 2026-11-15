import { describe, expect, it } from 'vitest';
import { deriveSyncedReadingState } from '@/lib/readingProgressSync';

describe('deriveSyncedReadingState', () => {
  it('throws an error for non-finite or non-positive total pages', () => {
    expect(() => deriveSyncedReadingState(5, 0, 'reading')).toThrow(
      'Reading progress requires finite pages and a positive page count'
    );
    expect(() => deriveSyncedReadingState(NaN, 100, 'reading')).toThrow();
    expect(() => deriveSyncedReadingState(5, -10, 'reading')).toThrow();
  });

  it('clamps current page between 0 and totalPages and computes percentage', () => {
    expect(deriveSyncedReadingState(-5, 100, 'reading')).toEqual({
      percentage: 0,
      status: 'reading',
    });
    expect(deriveSyncedReadingState(50, 100, 'reading')).toEqual({
      percentage: 50,
      status: 'reading',
    });
    expect(deriveSyncedReadingState(150, 100, 'reading')).toEqual({
      percentage: 100,
      status: 'completed',
    });
  });

  it('preserves dnf status regardless of page progress', () => {
    expect(deriveSyncedReadingState(100, 100, 'dnf')).toEqual({
      percentage: 100,
      status: 'dnf',
    });
    expect(deriveSyncedReadingState(30, 100, 'dnf')).toEqual({
      percentage: 30,
      status: 'dnf',
    });
  });

  it('switches want_to_read or completed to reading when progress is in-between', () => {
    expect(deriveSyncedReadingState(10, 100, 'want_to_read')).toEqual({
      percentage: 10,
      status: 'reading',
    });
    expect(deriveSyncedReadingState(10, 100, 'completed')).toEqual({
      percentage: 10,
      status: 'reading',
    });
  });
});
