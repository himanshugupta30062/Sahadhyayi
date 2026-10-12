/** @vitest-environment jsdom */

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomeBookDiscovery from '@/components/home/HomeBookDiscovery';
import SahadhyayiCapabilities from '@/components/SahadhyayiCapabilities';

const mockUseGenres = vi.fn();
const mockUseLibraryBooks = vi.fn();

vi.mock('@/hooks/useLibraryBooks', () => ({
  useGenres: () => mockUseGenres(),
  useLibraryBooks: (...args: unknown[]) => mockUseLibraryBooks(...args),
}));

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
    expect(mockUseLibraryBooks).toHaveBeenCalledWith(undefined, 80, {
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
