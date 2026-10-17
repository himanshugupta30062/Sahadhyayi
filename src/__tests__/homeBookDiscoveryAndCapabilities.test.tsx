/** @vitest-environment jsdom */

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomeBookDiscovery from '@/components/home/HomeBookDiscovery';
import SahadhyayiCapabilities from '@/components/SahadhyayiCapabilities';

const mockUseGenres = vi.fn();
const mockUseLibraryBooks = vi.fn();

vi.mock('@/hooks/useLibraryBooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/useLibraryBooks')>();
  return {
    ...actual,
    useGenres: () => mockUseGenres(),
    useLibraryBooks: (...args: unknown[]) => mockUseLibraryBooks(...args),
  };
});

afterEach(() => {
  cleanup();
});

describe('HomeBookDiscovery component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        callback: IntersectionObserverCallback;
        constructor(callback: IntersectionObserverCallback) {
          this.callback = callback;
        }
        observe(target: Element) {
          this.callback([{ isIntersecting: true, target } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
        }
        unobserve() {}
        disconnect() {}
      }
    );
  });

  it('renders section headline, description, and link to full library', () => {
    mockUseGenres.mockReturnValue({ data: [{ name: 'Fiction' }, { name: 'Philosophy' }] });
    mockUseLibraryBooks.mockReturnValue({ data: [], isLoading: false, isError: false });

    render(
      <MemoryRouter>
        <HomeBookDiscovery />
      </MemoryRouter>
    );

    expect(screen.getByText('Discover your next read')).toBeInTheDocument();
    expect(
      screen.getByText('Find books worth your time, explore new ideas, and discover stories that stay with you.')
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /explore the library/i })).toHaveAttribute('href', '/library');
  });

  it('renders real genre filter pills with accessible aria-pressed state', () => {
    mockUseGenres.mockReturnValue({ data: [{ name: 'Science Fiction' }, { name: 'Classics' }] });
    mockUseLibraryBooks.mockReturnValue({ data: [], isLoading: false, isError: false });

    render(
      <MemoryRouter>
        <HomeBookDiscovery />
      </MemoryRouter>
    );

    const allPill = screen.getByRole('button', { name: /all/i });
    expect(allPill).toHaveAttribute('aria-pressed', 'true');

    const sciFiPill = screen.getByRole('button', { name: /science fiction/i });
    expect(sciFiPill).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders real book cards linking to /book/:id', async () => {
    mockUseGenres.mockReturnValue({ data: [] });
    mockUseLibraryBooks.mockReturnValue({
      data: [
        {
          id: 'book-101',
          title: 'The Bhagavad Gita',
          author: 'Vyasa',
          genre: 'Philosophy',
          cover_image_url: 'https://example.com/cover.jpg',
        },
      ],
      isLoading: false,
      isError: false,
    });

    render(
      <MemoryRouter>
        <HomeBookDiscovery />
      </MemoryRouter>
    );

    expect(screen.getByText('The Bhagavad Gita')).toBeInTheDocument();
    expect(screen.getByText('Vyasa')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /the bhagavad gita by vyasa/i })).toHaveAttribute(
      'href',
      '/book/book-101'
    );
    expect(mockUseLibraryBooks).toHaveBeenCalledWith(undefined, 600, {
      requireCover: true,
      genre: 'All',
    });
    await waitFor(() => {
      expect(screen.getByRole('img', { name: 'Cover of The Bhagavad Gita' })).toHaveAttribute(
        'src',
        'https://example.com/cover.jpg'
      );
    });
  });

  it('does not display generated template covers for catalog records without a stored cover URL', () => {
    mockUseGenres.mockReturnValue({ data: [] });
    mockUseLibraryBooks.mockReturnValue({
      data: [
        {
          id: 'book-no-cover',
          title: 'A Book Without Stored Cover Art',
          author: 'A. Reader',
          genre: 'Fiction',
          cover_image_url: null,
        },
      ],
      isLoading: false,
      isError: false,
    });

    render(
      <MemoryRouter>
        <HomeBookDiscovery />
      </MemoryRouter>
    );

    expect(screen.queryByText('A Book Without Stored Cover Art')).not.toBeInTheDocument();
    expect(screen.getByText('No real covers available in this category yet')).toBeInTheDocument();
    expect(screen.queryByText('Cover unavailable')).not.toBeInTheDocument();
  });

  it('renders graceful error state with retry and open full library link when query fails', () => {
    const mockRefetch = vi.fn();
    mockUseGenres.mockReturnValue({ data: [] });
    mockUseLibraryBooks.mockReturnValue({
      data: [],
      isLoading: false,
      isError: true,
      refetch: mockRefetch,
    });

    render(
      <MemoryRouter>
        <HomeBookDiscovery />
      </MemoryRouter>
    );

    expect(screen.getByText('Unable to load library books')).toBeInTheDocument();
    expect(
      screen.getByText('A temporary network issue prevented loading books. You can still explore the complete digital catalog.')
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open full library/i })).toHaveAttribute('href', '/library');

    const tryAgainBtn = screen.getByRole('button', { name: /try again/i });
    tryAgainBtn.click();
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('deduplicates multiple books by the same author to their single most complete work', () => {
    mockUseGenres.mockReturnValue({ data: [] });
    mockUseLibraryBooks.mockReturnValue({
      data: [
        {
          id: 'book-basic',
          title: 'Author Work Draft',
          author: 'Michael T. Nolan',
          genre: 'Philosophy',
          cover_image_url: 'https://example.com/cover1.jpg',
          description: 'Short snippet',
        },
        {
          id: 'book-masterpiece',
          title: 'Author Work Masterpiece Edition',
          author: 'Michael T. Nolan',
          genre: 'Philosophy',
          cover_image_url: 'https://example.com/cover2.jpg',
          description: 'A comprehensive, complete, definitive master edition with scholarly notes and indexes.',
          page_count: 520,
          publication_year: 2021,
          isbn: '978-0123456789',
          pdf_url: 'https://example.com/reader.pdf',
        },
        {
          id: 'book-other',
          title: 'Meditations',
          author: 'Marcus Aurelius',
          genre: 'Philosophy',
          cover_image_url: 'https://example.com/cover3.jpg',
          description: 'Personal writings of the Roman Emperor.',
        },
      ],
      isLoading: false,
      isError: false,
    });

    render(
      <MemoryRouter>
        <HomeBookDiscovery />
      </MemoryRouter>
    );

    // The masterpiece edition should be selected and displayed
    expect(screen.getAllByText('Author Work Masterpiece Edition').length).toBeGreaterThan(0);
    // The inferior draft edition by the same author should NOT be present in either track
    expect(screen.queryAllByText('Author Work Draft')).toHaveLength(0);
    // The other author's work should be present
    expect(screen.getAllByText('Meditations').length).toBeGreaterThan(0);
  });

  it('provides accessible pause and resume controls for the continuous marquee', () => {
    mockUseGenres.mockReturnValue({ data: [] });
    mockUseLibraryBooks.mockReturnValue({
      data: [
        {
          id: 'book-1',
          title: 'First Great Book',
          author: 'First Author',
          genre: 'Fiction',
          cover_image_url: 'https://example.com/c1.jpg',
        },
        {
          id: 'book-2',
          title: 'Second Great Book',
          author: 'Second Author',
          genre: 'Philosophy',
          cover_image_url: 'https://example.com/c2.jpg',
        },
      ],
      isLoading: false,
      isError: false,
    });

    render(
      <MemoryRouter>
        <HomeBookDiscovery />
      </MemoryRouter>
    );

    const pauseBtn = screen.getByRole('button', { name: /pause book carousel animation/i });
    expect(pauseBtn).toBeInTheDocument();
    expect(pauseBtn).toHaveTextContent('Pause');

    // Click pause
    fireEvent.click(pauseBtn);

    const resumeBtn = screen.getByRole('button', { name: /resume book carousel animation/i });
    expect(resumeBtn).toBeInTheDocument();
    expect(resumeBtn).toHaveTextContent('Resume');

    // Click resume
    fireEvent.click(resumeBtn);

    expect(screen.getByRole('button', { name: /pause book carousel animation/i })).toBeInTheDocument();
  });

  it('renders all available database genres in the filter bar without capping at 5', () => {
    mockUseGenres.mockReturnValue({
      data: [
        { name: 'Fiction' },
        { name: 'Philosophy' },
        { name: 'Science' },
        { name: 'History' },
        { name: 'Psychology' },
        { name: 'Biography & Autobiography' },
        { name: 'Poetry' },
        { name: 'Art' },
      ],
    });
    mockUseLibraryBooks.mockReturnValue({ data: [], isLoading: false, isError: false });

    render(
      <MemoryRouter>
        <HomeBookDiscovery />
      </MemoryRouter>
    );

    // All 8 database genres + All pill should be present
    expect(screen.getByRole('button', { name: /^all$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^fiction$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^philosophy$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^science$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^history$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^psychology$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^biography & autobiography$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^poetry$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^art$/i })).toBeInTheDocument();
  });

  it('prevents a prolific author (such as Stephen Hawking) from dominating the carousel', () => {
    mockUseGenres.mockReturnValue({ data: [] });
    mockUseLibraryBooks.mockReturnValue({
      data: [
        {
          id: 'hawking-1',
          title: 'A Brief History of Time',
          author: 'Stephen Hawking',
          genre: 'Science',
          cover_image_url: 'https://example.com/h1.jpg',
          description: 'A landmark volume in science writing by one of the great minds of our time.',
          pages: 256,
          publication_year: 1988,
          pdf_url: 'https://example.com/h1.pdf',
        },
        {
          id: 'hawking-2',
          title: 'The Theory of Everything',
          author: 'Stephen Hawking',
          genre: 'Science',
          cover_image_url: 'https://example.com/h2.jpg',
          description: 'Lectures on theoretical physics and black holes.',
          pages: 180,
          publication_year: 2002,
        },
        {
          id: 'hawking-3',
          title: 'Brief Answers to the Big Questions',
          author: 'Stephen Hawking',
          genre: 'Science',
          cover_image_url: 'https://example.com/h3.jpg',
          description: 'Reflections on the universe.',
          pages: 200,
        },
        {
          id: 'dostoevsky-1',
          title: 'Crime and Punishment',
          author: 'Fyodor Dostoevsky',
          genre: 'Fiction',
          cover_image_url: 'https://example.com/d1.jpg',
          description: 'A masterpiece of Russian literature.',
          pages: 545,
          pdf_url: 'https://example.com/d1.pdf',
        },
        {
          id: 'plato-1',
          title: 'The Republic',
          author: 'Plato',
          genre: 'Philosophy',
          cover_image_url: 'https://example.com/p1.jpg',
          description: 'Classical philosophical dialogue.',
          pages: 416,
          pdf_url: 'https://example.com/p1.pdf',
        },
      ],
      isLoading: false,
      isError: false,
    });

    render(
      <MemoryRouter>
        <HomeBookDiscovery />
      </MemoryRouter>
    );

    // Hawking's highest scoring masterpiece should be present
    expect(screen.getAllByText('A Brief History of Time').length).toBeGreaterThan(0);

    // Other works by Stephen Hawking should NOT be present in the initial selection
    expect(screen.queryAllByText('The Theory of Everything')).toHaveLength(0);
    expect(screen.queryAllByText('Brief Answers to the Big Questions')).toHaveLength(0);

    // Other authors should be present
    expect(screen.getAllByText('Crime and Punishment').length).toBeGreaterThan(0);
    expect(screen.getAllByText('The Republic').length).toBeGreaterThan(0);
  });

  it('filters books accurately when a genre pill is clicked', () => {
    mockUseGenres.mockReturnValue({
      data: [{ name: 'Philosophy' }, { name: 'Science' }],
    });
    mockUseLibraryBooks.mockImplementation((_query, _limit, options) => {
      const selected = options?.genre;
      const allMockBooks = [
        {
          id: 'p-1',
          title: 'Meditations',
          author: 'Marcus Aurelius',
          genre: 'Philosophy',
          cover_image_url: 'https://example.com/med.jpg',
          description: 'Stoic philosophy reflections.',
        },
        {
          id: 's-1',
          title: 'Cosmos',
          author: 'Carl Sagan',
          genre: 'Science',
          cover_image_url: 'https://example.com/cos.jpg',
          description: 'A personal voyage through astronomy.',
        },
      ];
      const data = selected && selected !== 'All'
        ? allMockBooks.filter((b) => b.genre.toLowerCase() === selected.toLowerCase())
        : allMockBooks;
      return { data, isLoading: false, isError: false };
    });

    render(
      <MemoryRouter>
        <HomeBookDiscovery />
      </MemoryRouter>
    );

    // Initially in "All"
    expect(screen.getAllByText('Meditations').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Cosmos').length).toBeGreaterThan(0);

    // Click Philosophy pill
    const philPill = screen.getByRole('button', { name: /^philosophy$/i });
    fireEvent.click(philPill);

    expect(philPill).toHaveAttribute('aria-pressed', 'true');
    expect(mockUseLibraryBooks).toHaveBeenCalledWith(undefined, 600, {
      requireCover: true,
      genre: 'Philosophy',
    });
  });
});


describe('SahadhyayiCapabilities component', () => {
  it('renders all 4 core capabilities linking to valid routes without fabricated percentage stats', () => {
    render(
      <MemoryRouter>
        <SahadhyayiCapabilities />
      </MemoryRouter>
    );

    expect(screen.getByText('Built for deeper reading')).toBeInTheDocument();

    // Verify all 4 capabilities are present
    expect(screen.getByText('Local Reader Map')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /local reader map/i })).toHaveAttribute('href', '/map');

    expect(screen.getByText('Author Connect')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /author connect/i })).toHaveAttribute('href', '/authors');

    expect(screen.getByText('Articles & Editorial')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /articles & editorial/i })).toHaveAttribute('href', '/articles');

    expect(screen.getByText('Quizzes & Challenges')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /quizzes & challenges/i })).toHaveAttribute('href', '/games');

    // Confirm zero unsupported numerical claims or multipliers exist
    expect(screen.queryByText(/3x/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/40%/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/25%/i)).not.toBeInTheDocument();
  });
});
