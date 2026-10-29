// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';

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

const renderReader = (pdfUrl?: string, initialEntry = '/book/book-1') => render(
  <MemoryRouter initialEntries={[initialEntry]}>
    <BookReader bookId="book-1" bookTitle="The Dispossessed" pdfUrl={pdfUrl} />
  </MemoryRouter>,
);

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
      expect(screen.getByText('Page 4 of 100')).toBeInTheDocument();
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
      expect(screen.getByText('Page 12 of 100')).toBeInTheDocument();
    });
    expect(mocks.loadProgressLocally).toHaveBeenCalledWith('book-1', 'reader-1');
    expect(screen.getByText('1 Bookmarks')).toBeInTheDocument();
  });
});
