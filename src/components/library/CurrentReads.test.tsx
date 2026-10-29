// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
  user: null as null | { id: string },
  books: [] as any[],
  isLoading: false,
  error: null as unknown,
  updateLastOpenedAt: vi.fn(),
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: mocks.user }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: mocks.books,
    isLoading: mocks.isLoading,
    error: mocks.error,
  }),
}));

vi.mock('@/lib/supabase/userBooks', () => ({
  fetchCurrentReads: vi.fn(),
  updateLastOpenedAt: (...args: unknown[]) => mocks.updateLastOpenedAt(...args),
}));

import CurrentReads from './CurrentReads';

const LocationDisplay = () => {
  const location = useLocation();
  return <output aria-label="current route">{location.pathname}</output>;
};

const renderReads = () => render(
  <MemoryRouter initialEntries={['/dashboard']}>
    <CurrentReads />
    <LocationDisplay />
  </MemoryRouter>,
);

const readItem = (overrides: Record<string, any> = {}) => ({
  id: 'read-1',
  book_id: 'book-1',
  progress: 73.6,
  books_library: {
    title: 'The Dispossessed',
    author: 'Ursula K. Le Guin',
    cover_image_url: 'https://example.com/cover.jpg',
  },
  ...overrides,
});

describe('Library CurrentReads', () => {
  beforeEach(() => {
    mocks.user = { id: 'reader-1' };
    mocks.books = [];
    mocks.isLoading = false;
    mocks.error = null;
    mocks.updateLastOpenedAt.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('prompts signed-out visitors to sign in', () => {
    mocks.user = null;
    renderReads();

    expect(screen.getByRole('heading', { name: 'Your Current Reads' })).toBeInTheDocument();
    expect(screen.getByText('Sign in to track your reading progress.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign In' })).toHaveAttribute('href', '/signin');
  });

  it('renders three loading placeholders while current reads are loading', () => {
    mocks.isLoading = true;
    renderReads();

    expect(document.querySelectorAll('.animate-pulse')).toHaveLength(3);
    expect(screen.queryByText('No books in progress')).not.toBeInTheDocument();
  });

  it('shows a recoverable error state when the query fails', () => {
    mocks.error = new Error('network unavailable');
    renderReads();

    expect(screen.getByRole('heading', { name: 'Unable to load reading progress' })).toBeInTheDocument();
    expect(screen.getByText('A temporary issue prevented loading your books.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('shows an empty state with a link to the library', () => {
    renderReads();

    expect(screen.getByText('No books in progress')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Start reading a book' })).toHaveAttribute('href', '/library');
  });

  it('renders book metadata, rounds progress, and navigates after recording the open', async () => {
    mocks.books = [readItem()];
    renderReads();

    expect(screen.getByText('The Dispossessed')).toBeInTheDocument();
    expect(screen.getByText('Ursula K. Le Guin')).toBeInTheDocument();
    expect(screen.getByText('74%')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'The Dispossessed' })).toHaveAttribute(
      'src',
      'https://example.com/cover.jpg',
    );

    fireEvent.click(screen.getByRole('button', { name: /The Dispossessed/ }));

    await waitFor(() => expect(mocks.updateLastOpenedAt).toHaveBeenCalledWith('read-1'));
    expect(screen.getByLabelText('current route')).toHaveTextContent('/book/book-1');
  });

  it('supports the space key and continues navigation if last-opened tracking fails', async () => {
    mocks.books = [readItem()];
    mocks.updateLastOpenedAt.mockRejectedValue(new Error('tracking failed'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderReads();

    fireEvent.keyDown(screen.getByRole('button', { name: /The Dispossessed/ }), { key: ' ' });

    await waitFor(() => {
      expect(mocks.updateLastOpenedAt).toHaveBeenCalledWith('read-1');
      expect(screen.getByLabelText('current route')).toHaveTextContent('/book/book-1');
    });
    expect(console.error).toHaveBeenCalledWith('Failed to update last opened time', expect.any(Error));
  });

  it('uses safe metadata fallbacks when a related library record is missing', () => {
    mocks.books = [readItem({ id: 'read-2', book_id: 'book-2', progress: null, books_library: [] })];
    renderReads();

    expect(screen.getByText('Untitled Book')).toBeInTheDocument();
    expect(screen.getByText('Unknown author')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});
