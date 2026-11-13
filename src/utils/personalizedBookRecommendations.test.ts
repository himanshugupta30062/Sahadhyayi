import { describe, expect, it } from 'vitest';
import { rankPersonalizedBooks } from './personalizedBookRecommendations';

describe('rankPersonalizedBooks', () => {
  const catalog = [
    { id: 'a', title: 'New Fantasy', author: 'Other', genre: 'Fantasy' },
    { id: 'b', title: 'Favorite Author', author: 'Tolkien', genre: 'History' },
    { id: 'c', title: 'Already Shelved', author: 'Tolkien', genre: 'Fantasy' },
    { id: 'd', title: 'Unrelated', author: 'Someone', genre: 'Cooking' },
  ];
  const shelf = [
    { book_id: 'old', status: 'completed' as const, rating: 5, books_library: { genre: 'Fantasy', author: 'Tolkien' } },
    { book_id: 'dnf', status: 'dnf' as const, rating: 5, books_library: { genre: 'Cooking', author: 'Someone' } },
    { book_id: 'want', status: 'want_to_read' as const, books_library: { genre: 'History', author: 'Other' } },
    { book_id: 'c', status: 'reading' as const, books_library: { genre: 'Fantasy', author: 'Tolkien' } },
  ];

  it('ranks author matches above genre-only matches and explains them', () => {
    const result = rankPersonalizedBooks(catalog, shelf);
    expect(result.map((book) => book.id)).toEqual(['b', 'a']);
    expect(result[0].reason).toContain('author');
    expect(result[1].reason).toContain('genre');
  });

  it('excludes shelved books and ignores DNF and want-to-read preferences', () => {
    const result = rankPersonalizedBooks(catalog, shelf);
    expect(result.some((book) => book.id === 'c')).toBe(false);
    expect(result.some((book) => book.id === 'd')).toBe(false);
  });

  it('respects limit and returns empty for no preference matches', () => {
    expect(rankPersonalizedBooks(catalog, shelf, 1)).toHaveLength(1);
    expect(rankPersonalizedBooks(catalog, [], 8)).toEqual([]);
  });
});
