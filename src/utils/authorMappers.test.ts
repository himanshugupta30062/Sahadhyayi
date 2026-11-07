import { describe, expect, it } from 'vitest';
import { mapAuthorRecord, mapAuthorBook } from './authorMappers';

describe('authorMappers', () => {
  it('maps raw author record to Author domain model with default values', () => {
    const raw = {
      id: 'author-1',
      name: 'Premchand',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-02T00:00:00Z',
    };

    const author = mapAuthorRecord(raw);

    expect(author.id).toBe('author-1');
    expect(author.name).toBe('Premchand');
    expect(author.bio).toBeNull();
    expect(author.profile_image_url).toBeNull();
    expect(author.location).toBe('');
    expect(author.website_url).toBeNull();
    expect(author.social_links).toEqual({});
    expect(author.genres).toEqual([]);
    expect(author.books_count).toBe(0);
    expect(author.followers_count).toBe(0);
    expect(author.rating).toBe(0);
    expect(author.upcoming_events).toBe(0);
    expect(author.verified).toBe(false);
    expect(author.availableSlots).toEqual([]);
  });

  it('maps complete raw author record and parses numeric fields', () => {
    const raw = {
      id: 'author-2',
      name: 'Rabindranath Tagore',
      bio: 'Polymath who reshaped Bengali literature.',
      profile_image_url: 'https://example.com/tagore.jpg',
      location: 'Kolkata, India',
      website_url: 'https://tagore.org',
      social_links: { twitter: '@tagore' },
      genres: ['Poetry', 'Philosophy'],
      actual_books_count: '42',
      followers_count: '1500',
      rating: '4.85',
      upcoming_events: '3',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-02T00:00:00Z',
      verified: true,
      verification_type: 'official',
    };

    const author = mapAuthorRecord(raw);

    expect(author.name).toBe('Rabindranath Tagore');
    expect(author.books_count).toBe(42);
    expect(author.followers_count).toBe(1500);
    expect(author.rating).toBe(4.85);
    expect(author.upcoming_events).toBe(3);
    expect(author.verified).toBe(true);
    expect(author.verification_type).toBe('official');
  });

  it('maps author book record to Book domain model', () => {
    const rawBook = {
      id: 'book-1',
      title: 'Gitanjali',
      author: 'Rabindranath Tagore',
      genre: 'Poetry',
      cover_image_url: 'https://example.com/gitanjali.jpg',
      description: 'Song offerings.',
      publication_year: 1910,
      language: 'Bengali',
      pdf_url: 'https://example.com/gitanjali.pdf',
      created_at: '2025-01-01T00:00:00Z',
      isbn: '9780140183665',
      pages: 120,
    };

    const book = mapAuthorBook(rawBook);

    expect(book.id).toBe('book-1');
    expect(book.title).toBe('Gitanjali');
    expect(book.author).toBe('Rabindranath Tagore');
    expect(book.genre).toBe('Poetry');
    expect(book.publication_year).toBe(1910);
    expect(book.language).toBe('Bengali');
    expect(book.isbn).toBe('9780140183665');
    expect(book.pages).toBe(120);
  });

  it('provides fallback for missing author in author book record', () => {
    const rawBook = {
      id: 'book-2',
      title: 'Anonymous Manuscript',
      created_at: '2025-01-01T00:00:00Z',
    };

    const book = mapAuthorBook(rawBook);

    expect(book.id).toBe('book-2');
    expect(book.title).toBe('Anonymous Manuscript');
    expect(book.author).toBe('Unknown Author');
  });

  it('normalizes nullish and invalid numeric author fields safely', () => {
    const author = mapAuthorRecord({
      id: 'author-edge', name: 'Edge Author', created_at: '', updated_at: '',
      bio: '', profile_image_url: '', location: null, website_url: '',
      social_links: null, genres: null, actual_books_count: 'not-a-number',
      followers_count: 'NaN', rating: 'invalid', upcoming_events: null,
      verified: null, verification_type: null,
    });
    expect(author).toMatchObject({
      bio: null, profile_image_url: null, location: '', website_url: null,
      social_links: {}, genres: [], books_count: 0, followers_count: 0,
      rating: 0, upcoming_events: 0, verified: false,
    });
    expect(author.verification_type).toBeUndefined();
  });

  it('maps author books with optional fields missing and language fallback', () => {
    expect(mapAuthorBook({ id: 'minimal', title: 'Untitled', created_at: '' }))
      .toMatchObject({ id: 'minimal', title: 'Untitled', author: 'Unknown Author', language: 'English', price: 0 });
  });

  it('preserves explicit author book metadata and empty author fallback', () => {
    const book = mapAuthorBook({
      id: 'book-edge', title: 'A', author: '', genre: 'Fiction',
      language: '', publication_year: 2001, pages: 12, isbn: 'x',
      created_at: '', author_bio: 'Bio',
    });
    expect(book).toMatchObject({ author: 'Unknown Author', language: 'English', publication_year: 2001, pages: 12, isbn: 'x', author_bio: 'Bio' });
  });

});
