// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  isVerifiedPdf,
  hasValidCover,
  hasCompleteMetadata,
  hasOtherVerifiedFullText,
  isOnlineReader,
  isNonBookDocument,
  getBookResourceType,
  hasUnverifiedOrBrokenLink,
  isMetadataOnly,
  getBookCompletenessScore,
  compareLibraryBooks,
  sortBooksByCompleteness,
  getAuthorDiversificationKey,
  getTitleDiversificationKey,
  diversifyBooksPerPage,
  useAllLibraryBooks,
  useLibraryBooks,
  useBooksByGenre,
  useGenres,
} from './useLibraryBooks';
import { supabase } from '@/integrations/supabase/client-universal';

vi.mock('@/integrations/supabase/client-universal', () => {
  const fromMock = vi.fn();
  return {
    supabase: {
      from: fromMock,
    },
  };
});

describe('useLibraryBooks utility functions', () => {
  describe('isVerifiedPdf', () => {
    it('returns false for empty or broken records', () => {
      expect(isVerifiedPdf(null)).toBe(false);
      expect(isVerifiedPdf({})).toBe(false);
      expect(isVerifiedPdf({ isBrokenLink: true, pdf_url: 'https://example.com/book.pdf' })).toBe(false);
      expect(isVerifiedPdf({ accessStatus: 'access_unverified', pdf_url: 'https://example.com/book.pdf' })).toBe(false);
    });

    it('evaluates assets array when present', () => {
      expect(
        isVerifiedPdf({
          assets: [{ format: 'pdf', verified: false, downloadUrl: 'https://example.com/test.pdf' }],
        })
      ).toBe(false);

      expect(
        isVerifiedPdf({
          assets: [{ format: 'pdf', verified: true, downloadUrl: 'https://books.google.com/test.pdf' }],
        })
      ).toBe(false);

      expect(
        isVerifiedPdf({
          assets: [{ format: 'pdf', verified: true, downloadUrl: 'https://example.com/404.pdf' }],
        })
      ).toBe(false);

      expect(
        isVerifiedPdf({
          assets: [{ format: 'pdf', verified: true, downloadUrl: 'https://example.com/valid.pdf' }],
        })
      ).toBe(true);
    });

    it('rejects Google Previews and invalid URL patterns', () => {
      expect(isVerifiedPdf({ isGooglePreview: true, pdf_url: 'https://example.com/doc.pdf' })).toBe(false);
      expect(isVerifiedPdf({ accessStatus: 'preview_only', pdf_url: 'https://example.com/doc.pdf' })).toBe(false);
      expect(isVerifiedPdf({ pdf_url: 'https://books.google.com/preview' })).toBe(false);
      expect(isVerifiedPdf({ pdf_url: '#' })).toBe(false);
      expect(isVerifiedPdf({ pdf_url: 'javascript:void(0)' })).toBe(false);
      expect(isVerifiedPdf({ pdf_url: 'https://example.com/broken-link' })).toBe(false);
      expect(isVerifiedPdf({ pdf_url: 'ftp://invalid-protocol.com/book.pdf' })).toBe(false);
    });

    it('accepts direct .pdf extensions and trusted hosts', () => {
      expect(isVerifiedPdf({ pdf_url: 'https://cdn.example.com/book.pdf' })).toBe(true);
      expect(isVerifiedPdf({ pdf_url: 'https://cdn.example.com/book.pdf?token=123' })).toBe(true);
      expect(isVerifiedPdf({ pdf_url: '/storage/books/test.pdf' })).toBe(true);
      expect(isVerifiedPdf({ pdf_url: 'https://supabase.co/storage/v1/object/public/doc' })).toBe(true);
      expect(isVerifiedPdf({ pdf_url: 'https://www.gutenberg.org/files/123' })).toBe(true);
      expect(isVerifiedPdf({ pdf_url: 'https://open.umn.edu/opentextbooks/textbooks/1' })).toBe(true);
      expect(isVerifiedPdf({ pdf_url: 'https://openstax.org/details/books/physics' })).toBe(true);
      expect(isVerifiedPdf({ pdf_url: 'https://archive.org/download/item123' })).toBe(true);
      expect(isVerifiedPdf({ pdf_url: 'https://ncert.nic.in/textbook/pdf' })).toBe(true);
      expect(isVerifiedPdf({ pdf_url: 'https://doabooks.org/handle/123' })).toBe(true);
      expect(isVerifiedPdf({ pdf_url: 'https://example.com/doc', accessStatus: 'verified_full_text' })).toBe(true);
      expect(isVerifiedPdf({ pdf_url: 'https://example.com/doc', accessStatus: 'open_textbook' })).toBe(true);
      expect(isVerifiedPdf({ pdf_url: 'https://example.com/doc', accessStatus: 'public_domain' })).toBe(true);
    });
  });

  describe('hasValidCover', () => {
    it('returns false for missing, invalid, or placeholder covers', () => {
      expect(hasValidCover(null)).toBe(false);
      expect(hasValidCover({})).toBe(false);
      expect(hasValidCover({ cover_image_url: '' })).toBe(false);
      expect(hasValidCover({ cover_image_url: 'https://example.com/placeholder-book.png' })).toBe(false);
      expect(hasValidCover({ cover_image_url: 'https://example.com/default_cover.jpg' })).toBe(false);
      expect(hasValidCover({ cover_image_url: 'https://example.com/no-cover.png' })).toBe(false);
      expect(hasValidCover({ cover_image_url: '#' })).toBe(false);
      expect(hasValidCover({ cover_image_url: 'javascript:void(0)' })).toBe(false);
    });

    it('returns true for legitimate cover URLs', () => {
      expect(hasValidCover({ cover_image_url: 'https://covers.openlibrary.org/b/id/12345-M.jpg' })).toBe(true);
      expect(hasValidCover({ coverImageUrl: 'https://supabase.co/storage/v1/object/public/covers/art.webp' })).toBe(true);
    });
  });

  describe('hasCompleteMetadata', () => {
    const validBook = {
      title: 'War and Peace',
      author: 'Leo Tolstoy',
      cover_image_url: 'https://example.com/covers/war-and-peace.jpg',
      description: 'A comprehensive chronicle of Russian society during the Napoleonic era with historical philosophy.',
      language: 'English',
    };

    it('validates complete metadata successfully', () => {
      expect(hasCompleteMetadata(validBook)).toBe(true);
    });

    it('fails when title is invalid or placeholder', () => {
      expect(hasCompleteMetadata(null)).toBe(false);
      expect(hasCompleteMetadata({ ...validBook, title: '' })).toBe(false);
      expect(hasCompleteMetadata({ ...validBook, title: 'a' })).toBe(false);
      expect(hasCompleteMetadata({ ...validBook, title: 'untitled' })).toBe(false);
      expect(hasCompleteMetadata({ ...validBook, title: 'Sample' })).toBe(false);
    });

    it('fails when author is missing or anonymous', () => {
      expect(hasCompleteMetadata({ ...validBook, author: '' })).toBe(false);
      expect(hasCompleteMetadata({ ...validBook, author: 'Unknown Author' })).toBe(false);
      expect(hasCompleteMetadata({ ...validBook, author: 'anonymous' })).toBe(false);
    });

    it('fails when cover is invalid', () => {
      expect(hasCompleteMetadata({ ...validBook, cover_image_url: '' })).toBe(false);
    });

    it('fails when description is too short or language is missing', () => {
      expect(hasCompleteMetadata({ ...validBook, description: 'Too short' })).toBe(false);
      expect(hasCompleteMetadata({ ...validBook, language: '' })).toBe(false);
    });
  });

  describe('hasOtherVerifiedFullText', () => {
    it('identifies EPUB and official HTML readers', () => {
      expect(hasOtherVerifiedFullText(null)).toBe(false);
      // If already verified PDF, returns false
      expect(hasOtherVerifiedFullText({ pdf_url: 'https://example.com/book.pdf' })).toBe(false);
      expect(hasOtherVerifiedFullText({ isBrokenLink: true, epub_url: 'https://example.com/book.epub' })).toBe(false);
      expect(hasOtherVerifiedFullText({ accessStatus: 'preview_only', epub_url: 'https://example.com/book.epub' })).toBe(false);

      expect(hasOtherVerifiedFullText({ epub_url: 'https://example.com/book.epub' })).toBe(true);
      expect(hasOtherVerifiedFullText({ epubUrl: '/local/book.epub' })).toBe(true);
      expect(
        hasOtherVerifiedFullText({
          assets: [{ format: 'epub', verified: true, downloadUrl: 'https://example.com/item.epub' }],
        })
      ).toBe(true);
      expect(hasOtherVerifiedFullText({ accessStatus: 'carefully_edited' })).toBe(true);
      expect(hasOtherVerifiedFullText({ accessStatus: 'official_reader' })).toBe(true);
      expect(hasOtherVerifiedFullText({ pdf_url: 'https://standardebooks.org/opds/books/1' })).toBe(true);
    });
  });

  describe('isOnlineReader', () => {
    it('detects online reader interfaces', () => {
      expect(isOnlineReader(null)).toBe(false);
      expect(isOnlineReader({ pdf_url: 'https://example.com/book.pdf' })).toBe(false);
      expect(isOnlineReader({ isBrokenLink: true })).toBe(false);

      expect(isOnlineReader({ isGooglePreview: true, preview_url: 'https://books.google.com/books' })).toBe(true);
      expect(isOnlineReader({ external_url: 'https://archive.org/stream/book-id' })).toBe(true);
      expect(isOnlineReader({ external_url: 'https://openlibrary.org/books/OL123M' })).toBe(true);
      expect(isOnlineReader({ external_url: 'https://hathitrust.org/record/123' })).toBe(true);
      expect(isOnlineReader({ external_url: 'https://read.amazon.com/sample' })).toBe(true);
      expect(isOnlineReader({ external_url: 'https://play.google.com/books/reader/id' })).toBe(true);

      expect(
        isOnlineReader({
          assets: [{ format: 'web_reader', verified: true, readerUrl: 'https://reader.example.com/book' }],
        })
      ).toBe(true);
    });
  });

  describe('isNonBookDocument', () => {
    it('correctly flags academic papers, technical reports, and government archives', () => {
      expect(isNonBookDocument(null)).toBe(false);
      expect(isNonBookDocument({ title: 'Standard Fiction Novel', author: 'Author' })).toBe(false);

      expect(isNonBookDocument({ pdf_url: 'https://arxiv.org/pdf/arxiv-1234.5678' })).toBe(true);
      expect(isNonBookDocument({ pdf_url: 'https://nasa_ntrs/report' })).toBe(true);
      expect(isNonBookDocument({ title: 'A Systematic Review and Meta-Analysis of Clinical Trials' })).toBe(true);
      expect(
        isNonBookDocument({
          title: 'Quantum Entanglement Study',
          description: 'This paper provides a literature review and doi:10.1234/test of quantum states.',
          genre: 'Technology Research',
          pdf_url: 'https://example.com/paper.pdf',
        })
      ).toBe(true);
      expect(isNonBookDocument({ title: 'NASA Technical Reports Server Memorandum' })).toBe(true);
      expect(isNonBookDocument({ title: 'CIA Reading Room Declassified Brief' })).toBe(true);
      expect(isNonBookDocument({ author: 'Central Intelligence Agency' })).toBe(true);
      expect(isNonBookDocument({ author: 'National Aeronautics and Space Administration' })).toBe(true);
      expect(isNonBookDocument({ genre: 'Peer-reviewed Research Paper' })).toBe(true);
    });
  });

  describe('getBookResourceType and hasUnverifiedOrBrokenLink', () => {
    it('classifies resources into expected types', () => {
      expect(getBookResourceType(null)).toBe('no_reading_resource');
      expect(getBookResourceType({ isBrokenLink: true })).toBe('no_reading_resource');
      expect(getBookResourceType({ pdf_url: 'https://example.com/book.pdf' })).toBe('verified_direct_pdf');
      expect(getBookResourceType({ external_url: 'https://books.google.com/details' })).toBe('online_reader');
      expect(getBookResourceType({ external_url: 'https://goodreads.com/book/show/1' })).toBe('external_book_page');
      expect(getBookResourceType({ title: 'Ghost Book' })).toBe('no_reading_resource');
    });

    it('identifies unverified or broken reading links', () => {
      expect(hasUnverifiedOrBrokenLink(null)).toBe(false);
      expect(hasUnverifiedOrBrokenLink({ pdf_url: 'https://example.com/book.pdf' })).toBe(false);
      expect(hasUnverifiedOrBrokenLink({ isBrokenLink: true })).toBe(true);
      expect(hasUnverifiedOrBrokenLink({ accessStatus: 'access_unverified' })).toBe(true);
      expect(hasUnverifiedOrBrokenLink({ pdf_url: 'https://example.com/broken-url' })).toBe(true);
      expect(hasUnverifiedOrBrokenLink({ pdf_url: '#' })).toBe(true);
    });

    it('identifies metadata-only books', () => {
      expect(isMetadataOnly(null)).toBe(false);
      expect(isMetadataOnly({ title: 'No link' })).toBe(true);
      expect(isMetadataOnly({ pdf_url: 'https://example.com/book.pdf' })).toBe(false);
    });
  });

  describe('getBookCompletenessScore and compareLibraryBooks', () => {
    it('ranks genuine verified books above metadata-only and academic documents', () => {
      const tier1Book = {
        id: '1',
        title: 'Complete Novel',
        author: 'Jane Austen',
        cover_image_url: 'https://example.com/cover.jpg',
        description: 'A wonderful novel exploring society and manners across Regency England with great wit.',
        language: 'English',
        pdf_url: 'https://example.com/novel.pdf',
        isbn: '9780141439518',
        publication_year: 1813,
        pages: 350,
        genre: 'Classic Literature',
        qualityScore: 90,
      };

      const docBook = {
        id: '2',
        title: 'NASA Technical Reports Volume 1',
        author: 'NASA',
        pdf_url: 'https://example.com/nasa_ntrs/123.pdf',
      };

      const ghostBook = {
        id: '3',
        title: '',
        description: '',
      };

      const score1 = getBookCompletenessScore(tier1Book);
      const scoreDoc = getBookCompletenessScore(docBook);
      const scoreGhost = getBookCompletenessScore(ghostBook);

      expect(score1).toBeGreaterThan(10000);
      expect(scoreDoc).toBeLessThan(4000);
      expect(scoreGhost).toBe(0);

      const sorted = sortBooksByCompleteness([ghostBook, docBook, tier1Book]);
      expect(sorted[0].id).toBe('1');
      expect(sorted[1].id).toBe('2');
      expect(sorted[2].id).toBe('3');
    });

    it('resolves ties deterministically by created_at, then title, then ID', () => {
      const a = { id: 'b', title: 'Same Title', created_at: '2026-01-02T00:00:00Z' };
      const b = { id: 'a', title: 'Same Title', created_at: '2026-01-01T00:00:00Z' };
      expect(compareLibraryBooks(a, b)).toBeLessThan(0); // a is newer

      const c = { id: '1', title: 'Alpha Title', created_at: '2026-01-01T00:00:00Z' };
      const d = { id: '2', title: 'Beta Title', created_at: '2026-01-01T00:00:00Z' };
      expect(compareLibraryBooks(c, d)).toBeLessThan(0); // Alpha comes before Beta

      const e = { id: 'id-1', title: 'Identical', created_at: '2026-01-01T00:00:00Z' };
      const f = { id: 'id-2', title: 'Identical', created_at: '2026-01-01T00:00:00Z' };
      expect(compareLibraryBooks(e, f)).toBeLessThan(0); // id-1 before id-2
    });
  });

  describe('diversifyBooksPerPage', () => {
    it('handles edge cases gracefully', () => {
      expect(diversifyBooksPerPage([])).toEqual([]);
      expect(diversifyBooksPerPage(null as any)).toEqual([]);
      expect(diversifyBooksPerPage([{ id: '1' }])).toEqual([{ id: '1' }]);
      expect(diversifyBooksPerPage([{ id: '1' }], -1)).toEqual([{ id: '1' }]);
    });

    it('diversifies books by author and title across pages', () => {
      const books = [
        { id: '1', author: 'Stephen Hawking', title: 'A Brief History of Time' },
        { id: '2', author: 'Stephen Hawking', title: 'The Universe in a Nutshell' },
        { id: '3', author: 'Isaac Asimov', title: 'Foundation' },
        { id: '4', author: 'Arthur C. Clarke', title: '2001: A Space Odyssey' },
        { id: '5', author: 'Stephen Hawking', title: 'Black Holes' },
      ];

      // Page size of 3
      const diversified = diversifyBooksPerPage(books, 3);
      expect(diversified.length).toBe(5);

      // On Page 1 (indices 0..2), only 1 Stephen Hawking book should appear
      const page1 = diversified.slice(0, 3);
      const hawkingInPage1 = page1.filter((b) => getAuthorDiversificationKey(b.author, b.title) === 'stephen hawking');
      expect(hawkingInPage1.length).toBe(1);
    });

    it('correctly maps diversification keys for biography subjects and institutions', () => {
      expect(getAuthorDiversificationKey(null, 'The Extraordinary Life of Albert Einstein: A Genius')).toBe('albert einstein');
      expect(getAuthorDiversificationKey('NASA Technical Reports', 'Technical Memorandum')).toBe('nasa technical reports');
      expect(getAuthorDiversificationKey('NASA', 'General Book')).toBe('nasa');
      expect(getAuthorDiversificationKey(null, 'NCERT Class 10 Science')).toBe('ncert');
      expect(getTitleDiversificationKey('The Republic (Oxford Classics Edition)')).toBe('the republic');
    });
  });
});

describe('useLibraryBooks React Query Hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('useAllLibraryBooks fetches and batches catalog data', async () => {
    const mockData = [
      { id: 'b1', title: 'Pride and Prejudice', author: 'Jane Austen', genre: 'Romance', created_at: '2026-01-01' },
      { id: 'b2', title: 'Emma', author: 'Jane Austen', genre: 'Romance', created_at: '2026-01-02' },
    ];

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        neq: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      }),
    });

    const { result } = renderHook(() => useAllLibraryBooks(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.length).toBe(2);
    expect(result.current.data?.[0].title).toBeDefined();
  });

  it('useLibraryBooks applies requireCover, genre and query filters', async () => {
    const mockBooks = [
      { id: 'b10', title: '1984', author: 'George Orwell', genre: 'Dystopian', cover_image_url: 'https://example.com/1984.jpg' },
    ];

    const rangeMock = vi.fn().mockResolvedValue({ data: mockBooks, error: null });
    const limitMock = vi.fn().mockReturnValue({ then: (resolve: any) => Promise.resolve({ data: mockBooks, error: null }).then(resolve) });

    const queryMock: any = {
      neq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: limitMock,
      range: rangeMock,
    };

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue(queryMock),
    });

    const { result } = renderHook(
      () => useLibraryBooks('1984', 10, { requireCover: true, genre: 'Dystopian' }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.length).toBe(1);
    expect(result.current.data?.[0].title).toBe('1984');
  });

  it('useBooksByGenre queries by specific genre and Hindi language', async () => {
    const mockBooks = [{ id: 'h1', title: 'Godaan', author: 'Premchand', genre: 'Fiction', language: 'Hindi' }];

    const queryMock: any = {
      neq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      then: (resolve: any) => Promise.resolve({ data: mockBooks, error: null }).then(resolve),
    };

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue(queryMock),
    });

    const { result } = renderHook(() => useBooksByGenre('Hindi'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.length).toBe(1);
    expect(result.current.data?.[0].title).toBe('Godaan');
  });

  it('useGenres fetches and de-duplicates genres from database', async () => {
    const mockGenres = [
      { genre: 'Fiction' },
      { genre: 'Philosophy' },
      { genre: 'Fiction' },
    ];

    const queryMock: any = {
      neq: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      then: (resolve: any) => Promise.resolve({ data: mockGenres, error: null }).then(resolve),
    };

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue(queryMock),
    });

    const { result } = renderHook(() => useGenres(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.length).toBe(2);
    expect(result.current.data?.map((g) => g.name)).toEqual(['Fiction', 'Philosophy']);
  });
});
