// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mocks = vi.hoisted(() => ({
  user: null as null | { id: string },
  addQuote: vi.fn(),
  toast: vi.fn(),
  saveProgress: vi.fn(),
  markChapterRead: vi.fn(),
  searchExternalSources: vi.fn(),
  loadProgressLocally: vi.fn(),
  saveProgressLocally: vi.fn(),
  getDocument: vi.fn(),
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: mocks.user }),
}));

vi.mock('@/contexts/quotesHelpers', () => ({
  useQuotes: () => ({ addQuote: mocks.addQuote }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock('@/hooks/useReadingProgress', () => ({
  useReadingProgress: () => ({ data: [] }),
  useSaveReadingProgress: () => ({ mutate: mocks.saveProgress, mutateAsync: mocks.saveProgress }),
}));

vi.mock('@/hooks/useAudioSummaries', () => ({
  useAudioSummary: () => ({ data: null, isLoading: false }),
}));

vi.mock('@/hooks/useChapterProgress', () => ({
  useChapterProgress: () => ({ data: [] }),
  useMarkChapterAsRead: () => ({ mutate: mocks.markChapterRead, mutateAsync: mocks.markChapterRead }),
}));

vi.mock('@/hooks/useReaderBookmarks', () => ({
  useReaderBookmarks: () => ({ data: [] }),
  useAddReaderBookmark: () => ({ mutate: vi.fn(), isPending: false }),
  useRemoveReaderBookmark: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('@/utils/searchExternalSources', () => ({
  searchExternalSources: (...args: unknown[]) => mocks.searchExternalSources(...args),
}));

vi.mock('@/utils/readingProgressStorage', () => ({
  loadProgressLocally: (...args: unknown[]) => mocks.loadProgressLocally(...args),
  saveProgressLocally: (...args: unknown[]) => mocks.saveProgressLocally(...args),
}));

vi.mock('@/components/social/margins/AddMarginNoteDialog', () => ({
  AddMarginNoteDialog: () => <button type="button">Add Margin Note</button>,
}));

vi.mock('./ReaderMarginDrawer', () => ({
  ReaderMarginDrawer: () => <button type="button">Open Margins</button>,
}));

import BookReader from './BookReader';

const renderReader = (pdfUrl?: string, initialEntry = '/book/book-1') => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <BookReader bookId="book-1" bookTitle="The Dispossessed" pdfUrl={pdfUrl} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('BookReader', () => {
  beforeEach(() => {
    mocks.user = null;
    mocks.addQuote.mockReset();
    mocks.toast.mockReset();
    mocks.saveProgress.mockReset();
    mocks.markChapterRead.mockReset();
    mocks.searchExternalSources.mockReset().mockResolvedValue([]);
    mocks.loadProgressLocally.mockReset().mockReturnValue(null);
    mocks.saveProgressLocally.mockReset();
    mocks.getDocument.mockReset().mockReturnValue({
      promise: Promise.resolve({ numPages: 100 }),
    });
    (window as any).pdfjsLib = {
      GlobalWorkerOptions: {},
      getDocument: (...args: unknown[]) => mocks.getDocument(...args),
    };
  });

  afterEach(() => {
    cleanup();
    delete (window as any).pdfjsLib;
    vi.restoreAllMocks();
  });

  it('shows source-search guidance and opens an external search when no reading link exists', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    renderReader();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'No reading link available yet' })).toBeInTheDocument();
    });
    expect(mocks.searchExternalSources).toHaveBeenCalledWith('The Dispossessed');

    fireEvent.click(screen.getByRole('button', { name: 'Search Google' }));
    expect(open).toHaveBeenCalledWith(
      'https://www.google.com/search?q=The%20Dispossessed%20read%20online',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('renders a PDF reader, restores the requested page, and updates reader settings', async () => {
    renderReader('https://example.com/book.pdf', '/book/book-1?page=4');

    expect(screen.getByRole('heading', { name: 'Read Book' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getAllByText('Page 4 of 100').length).toBeGreaterThan(1);
    });
    expect(mocks.getDocument).toHaveBeenCalledWith('https://example.com/book.pdf');

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(screen.getByText('Reading Theme')).toBeInTheDocument();

    const darkButton = screen.getByRole('button', { name: /Dark/ });
    fireEvent.click(darkButton);
    expect(darkButton.className).toContain('bg-gray-900');

    const fontSize = screen.getByText('16');
    const fontButtons = fontSize.parentElement?.querySelectorAll('button');
    expect(fontButtons).toHaveLength(2);
    fireEvent.click(fontButtons![1]);
    expect(screen.getByText('18')).toBeInTheDocument();
  });

  it('restores saved local reading progress when the reader is signed in', async () => {
    mocks.user = { id: 'reader-1' };
    mocks.loadProgressLocally.mockReturnValue({ currentPage: 12, totalPages: 100, bookmarks: ['page-12'] });
    renderReader('https://example.com/book.pdf');

    await waitFor(() => {
      expect(screen.getAllByText('Page 12 of 100').length).toBeGreaterThan(1);
    });
    expect(mocks.loadProgressLocally).toHaveBeenCalledWith('book-1', 'reader-1');
    expect(screen.getByText('1 Bookmarks')).toBeInTheDocument();
  });

  it('renders Google Books preview when embeddable is available, keeping toolbar and margin notes active', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'fqiEEQAAQBAJ',
        volumeInfo: { title: 'The Dispossessed' },
        accessInfo: { embeddable: true, viewability: 'PARTIAL' },
      }),
    } as any);

    renderReader('https://books.google.com/books?id=fqiEEQAAQBAJ');

    await waitFor(() => {
      expect(screen.getByText(/Google Books Online Preview/i)).toBeInTheDocument();
    });

    // Check iframe embed src
    const iframe = screen.getByTitle('The Dispossessed');
    expect(iframe).toHaveAttribute(
      'src',
      'https://books.google.com/books?id=fqiEEQAAQBAJ&lpg=PP1&pg=PP1&output=embed'
    );

    // Toolbar and Margin Note buttons remain available
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open Margins' })).toBeInTheDocument();

    global.fetch = originalFetch;
  });

  it('displays clean publisher restricted fallback instead of blank iframe when Google Books preview is restricted', async () => {
    const originalFetch = global.fetch;
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'restricted-id',
        volumeInfo: { title: 'The Dispossessed', previewLink: 'https://books.google.com/preview' },
        accessInfo: { embeddable: false, viewability: 'NO_PAGES' },
      }),
    } as any);

    renderReader('https://books.google.com/books?id=restricted-id');

    await waitFor(() => {
      expect(screen.getByText(/Publisher Preview Restricted/i)).toBeInTheDocument();
    });

    const readBtn = screen.getByRole('button', { name: /Read on Google Books/i });
    expect(readBtn).toBeInTheDocument();

    fireEvent.click(readBtn);
    expect(windowOpenSpy).toHaveBeenCalledWith(
      'https://books.google.com/preview',
      '_blank',
      'noopener,noreferrer'
    );

    global.fetch = originalFetch;
  });

  it('allows user to toggle fallback and retry when Google Books preview is blocked by browser', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'blocked-id',
        volumeInfo: { title: 'The Dispossessed' },
        accessInfo: { embeddable: true, viewability: 'PARTIAL' },
      }),
    } as any);

    renderReader('https://books.google.com/books?id=blocked-id');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Preview Blocked\?/i })).toBeInTheDocument();
    });

    // User reports preview is blocked
    fireEvent.click(screen.getByRole('button', { name: /Preview Blocked\?/i }));

    expect(screen.getByText(/Embedded Preview Blocked by Browser/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Read on Google Books/i })).toBeInTheDocument();

    // User clicks Retry Preview
    fireEvent.click(screen.getByRole('button', { name: /Retry Preview/i }));
    await waitFor(() => {
      expect(screen.getByTitle('The Dispossessed')).toBeInTheDocument();
    });

    global.fetch = originalFetch;
  });

  it('preserves query and signed authentication parameters on direct PDF embeds', async () => {
    const signedPdfUrl =
      'https://example.com/vault/manuscript.pdf?X-Amz-Security-Token=sec987&X-Amz-Signature=sig456';
    renderReader(signedPdfUrl, '/book/book-1?page=3');

    await waitFor(() => {
      expect(screen.getByTitle('The Dispossessed')).toBeInTheDocument();
    });

    const iframe = screen.getByTitle('The Dispossessed');
    const src = iframe.getAttribute('src');

    // Signed parameters are strictly preserved
    expect(src).toContain('X-Amz-Security-Token=sec987');
    expect(src).toContain('X-Amz-Signature=sig456');
    expect(src).toContain('#toolbar=1&navpanes=1&scrollbar=1&page=3');
  });

  it('renders a clean fallback with external opening and download options when PDF embedding is blocked', async () => {
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    renderReader('https://example.com/blocked-book.pdf');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Preview blocked\?/i })).toBeInTheDocument();
    });

    // Trigger blocked state
    fireEvent.click(screen.getByRole('button', { name: /Preview blocked\?/i }));

    expect(screen.getByText(/Inline PDF Preview Restricted/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Open PDF in New Window/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download PDF/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Open PDF in New Window/i }));
    expect(windowOpenSpy).toHaveBeenCalledWith(
      'https://example.com/blocked-book.pdf',
      '_blank',
      'noopener,noreferrer'
    );
  });
});
