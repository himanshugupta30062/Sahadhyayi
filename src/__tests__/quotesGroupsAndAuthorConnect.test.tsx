/** @vitest-environment jsdom */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import QuotesPage from '@/pages/Quotes';
import ReadingGroupsDirectory from '@/components/groups/ReadingGroupsDirectory';
import AuthorConnect from '@/pages/AuthorConnect';

// Mock auth
vi.mock('@/contexts/authHelpers', () => ({
  useAuth: vi.fn(() => ({ user: null })),
}));

// Mock quotes context
const mockAddQuote = vi.fn();
const mockRemoveQuote = vi.fn();
vi.mock('@/contexts/quotesHelpers', () => ({
  useQuotes: vi.fn(() => ({
    quotes: [],
    addQuote: mockAddQuote,
    removeQuote: mockRemoveQuote,
  })),
}));

// Mock reader highlights
vi.mock('@/hooks/useReaderHighlights', () => ({
  useReaderHighlights: vi.fn(() => ({ data: [], isLoading: false })),
  useDeleteReaderHighlight: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}));

// Mock reading journal
vi.mock('@/hooks/useReadingJournal', () => ({
  useReadingJournal: vi.fn(() => ({
    bookSummaries: [],
    entries: [],
    isLoading: false,
  })),
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({ toast: vi.fn() })),
}));

// Mock useGroups to return curated groups by default
vi.mock('@/hooks/useGroupManagement', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/useGroupManagement')>();
  const { CURATED_READING_GROUPS } = await import('@/data/curatedReadingGroups');
  return {
    ...actual,
    useGroups: vi.fn(() => ({
      data: CURATED_READING_GROUPS,
      isLoading: false,
      error: null,
    })),
    useCreateGroup: vi.fn(() => ({ mutateAsync: vi.fn() })),
    useJoinGroup: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
    useLeaveGroup: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
    useUpdateGroup: vi.fn(() => ({ mutateAsync: vi.fn() })),
    useDeleteGroup: vi.fn(() => ({ mutateAsync: vi.fn() })),
  };
});

vi.mock('@/hooks/useUserGroups', () => ({
  useUserJoinedGroups: vi.fn(() => ({ data: [], isLoading: false, error: null })),
}));

// Mock useAuthors
vi.mock('@/hooks/useAuthors', () => ({
  useAuthors: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
}));

describe('Quotes, Groups, and Author Connect Pages', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe('Quotes Page (/quotes)', () => {
    it('initializes to quotes tab on /quotes route and renders curated literary quotes', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/quotes']}>
            <Routes>
              <Route path="/quotes" element={<QuotesPage />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      );

      // Verify page title and header
      expect(screen.getByRole('heading', { level: 1, name: /literary quotes/i })).toBeInTheDocument();

      // Verify curated literary quote from Tagore is present
      expect(screen.getByText(/Rabindranath Tagore/i)).toBeInTheDocument();
      expect(screen.getByText(/Gitanjali/i)).toBeInTheDocument();

      // Verify Save a Quote card is present
      expect(screen.getByPlaceholderText(/enter an inspiring quote/i)).toBeInTheDocument();
    });

    it('allows 1-click saving of curated quotes to personal library', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/quotes']}>
            <Routes>
              <Route path="/quotes" element={<QuotesPage />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      );

      // Click "Save to Quotes" button on first curated quote
      const saveButtons = screen.getAllByRole('button', { name: /save to quotes/i });
      expect(saveButtons.length).toBeGreaterThan(0);
      fireEvent.click(saveButtons[0]);

      expect(mockAddQuote).toHaveBeenCalledTimes(1);
    });
  });

  describe('Reading Groups Directory (/groups)', () => {
    it('renders vibrant curated reading circles without showing an empty page', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/groups']}>
            <ReadingGroupsDirectory />
          </MemoryRouter>
        </QueryClientProvider>
      );

      // Verify circles are present
      expect(screen.getByText(/Indian Classics & Epics Circle/i)).toBeInTheDocument();
      expect(screen.getByText(/Philosophy & Deep Thoughts/i)).toBeInTheDocument();
      expect(screen.getByText(/Speculative & Science Fiction Guild/i)).toBeInTheDocument();

      // Verify focus books are rendered
      expect(screen.getAllByText(/The Mahabharata/i).length).toBeGreaterThan(0);
    });
  });

  describe('Author Connect Page (/author-connect)', () => {
    it('renders verified authors with mentorship topics and live session scheduling', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/author-connect']}>
            <AuthorConnect />
          </MemoryRouter>
        </QueryClientProvider>
      );

      // Verify header and value pillars
      expect(screen.getByRole('heading', { level: 1, name: /connect with authors/i })).toBeInTheDocument();
      expect(screen.getByText(/1-on-1 manuscript guidance/i)).toBeInTheDocument();

      // Verify mentor authors
      expect(screen.getByRole('heading', { name: /Dr. Ramachandra Guha/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Priya Sharma/i })).toBeInTheDocument();

      // Verify schedule session buttons exist
      const scheduleButtons = screen.getAllByRole('button', { name: /schedule session/i });
      expect(scheduleButtons.length).toBeGreaterThan(0);
    });

    it('filters authors based on search input', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/author-connect']}>
            <AuthorConnect />
          </MemoryRouter>
        </QueryClientProvider>
      );

      const searchInput = screen.getByPlaceholderText(/search by author name/i);
      fireEvent.change(searchInput, { target: { value: 'Guha' } });

      expect(screen.getByRole('heading', { name: /Dr. Ramachandra Guha/i })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: /Dr. Rajesh Kumar/i })).not.toBeInTheDocument();
    });
  });
});
