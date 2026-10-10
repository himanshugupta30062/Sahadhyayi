/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it } from 'vitest';
import {
  getProgressStorageKey,
  loadProgressLocally,
  saveProgressLocally,
} from '@/utils/readingProgressStorage';

describe('Reading Progress Storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('generates distinct storage keys for authenticated user vs guest', () => {
    expect(getProgressStorageKey('book-123', 'user-abc')).toBe('sahadhyayi_progress_user-abc_book-123');
    expect(getProgressStorageKey('book-123', null)).toBe('sahadhyayi_progress_guest_book-123');
    expect(getProgressStorageKey('book-123', undefined)).toBe('sahadhyayi_progress_guest_book-123');
  });

  it('saves and restores reading progress accurately', () => {
    saveProgressLocally(
      {
        bookId: 'book-456',
        currentPage: 42,
        totalPages: 300,
        position: 'epubcfi(/6/4[chap01]!/4/2)',
        bookmarks: ['cfi-1', 'cfi-2'],
      },
      'user-1'
    );

    const loaded = loadProgressLocally('book-456', 'user-1');
    expect(loaded).not.toBeNull();
    expect(loaded?.bookId).toBe('book-456');
    expect(loaded?.userId).toBe('user-1');
    expect(loaded?.currentPage).toBe(42);
    expect(loaded?.totalPages).toBe(300);
    expect(loaded?.position).toBe('epubcfi(/6/4[chap01]!/4/2)');
    expect(loaded?.bookmarks).toEqual(['cfi-1', 'cfi-2']);
    expect(loaded?.updatedAt).toBeGreaterThan(0);
  });

  it('falls back to legacy unkeyed localStorage when scoped key is absent', () => {
    localStorage.setItem('book-legacy-1-page', '17');
    localStorage.setItem('book-legacy-1-position', 'cfi-legacy-pos');
    localStorage.setItem('book-legacy-1-bookmarks', JSON.stringify(['bm-1']));

    const loaded = loadProgressLocally('legacy-1', 'user-2');
    expect(loaded).not.toBeNull();
    expect(loaded?.currentPage).toBe(17);
    expect(loaded?.position).toBe('cfi-legacy-pos');
    expect(loaded?.bookmarks).toEqual(['bm-1']);
  });

  it('clamps current page to minimum 1', () => {
    saveProgressLocally(
      {
        bookId: 'book-clamp',
        currentPage: -5,
        totalPages: 100,
      },
      'user-3'
    );

    const loaded = loadProgressLocally('book-clamp', 'user-3');
    expect(loaded?.currentPage).toBe(1);
  });

  it('preserves existing bookmarks and position when partially updating page', () => {
    saveProgressLocally(
      {
        bookId: 'book-partial',
        currentPage: 10,
        totalPages: 200,
        position: 'pos-1',
        bookmarks: ['bm-initial'],
      },
      'user-4'
    );

    // Update only the page
    saveProgressLocally(
      {
        bookId: 'book-partial',
        currentPage: 25,
      },
      'user-4'
    );

    const updated = loadProgressLocally('book-partial', 'user-4');
    expect(updated?.currentPage).toBe(25);
    expect(updated?.position).toBe('pos-1');
    expect(updated?.bookmarks).toEqual(['bm-initial']);
  });
});
