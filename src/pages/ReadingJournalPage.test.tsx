// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ReadingJournalPage from './ReadingJournalPage';

const mockCreateCollection = vi.fn().mockResolvedValue({ id: 'col-new', name: 'Poetry' });
const mockRenameCollection = vi.fn().mockResolvedValue({ id: 'col-1', name: 'Renamed' });
const mockDeleteCollection = vi.fn().mockResolvedValue(undefined);
const mockAssignCollection = vi.fn().mockResolvedValue(undefined);
const mockUpdateHighlight = vi.fn().mockResolvedValue(undefined);

vi.mock('@/hooks/useReadingJournal', () => ({
  useReadingJournal: () => ({
    entries: [
      {
        id: 'hl-1',
        type: 'highlight',
        bookId: 'book-1',
        bookTitle: 'Meditations',
        page: 42,
        text: 'The soul becomes dyed with the color of its thoughts.',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'note-1',
        type: 'reflection',
        bookId: 'book-2',
        bookTitle: 'Atomic Habits',
        page: 15,
        text: 'Habits are the compound interest of self-improvement.',
        note: 'Focus on small 1% gains daily.',
        createdAt: '2026-01-02T00:00:00.000Z',
      },
    ],
    bookSummaries: [
      { bookId: 'book-1', bookTitle: 'Meditations' },
      { bookId: 'book-2', bookTitle: 'Atomic Habits' },
    ],
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useReaderHighlights', () => ({
  useUpdateReaderHighlight: () => ({
    mutateAsync: mockUpdateHighlight,
    isPending: false,
  }),
}));

vi.mock('@/hooks/useJournalCollections', () => ({
  useJournalCollections: () => ({
    data: [
      {
        id: 'col-1',
        user_id: 'reader-1',
        name: 'Philosophy',
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      },
    ],
    isLoading: false,
  }),
  useJournalEntryMappings: () => ({
    data: {
      'hl-1': 'col-1',
    },
    isLoading: false,
  }),
  useCreateJournalCollection: () => ({
    mutateAsync: mockCreateCollection,
    isPending: false,
  }),
  useRenameJournalCollection: () => ({
    mutateAsync: mockRenameCollection,
    isPending: false,
  }),
  useDeleteJournalCollection: () => ({
    mutateAsync: mockDeleteCollection,
    isPending: false,
  }),
  useAssignEntryCollection: () => ({
    mutateAsync: mockAssignCollection,
    isPending: false,
  }),
}));

describe('ReadingJournalPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders journal entries with book titles and text', () => {
    render(
      <BrowserRouter>
        <ReadingJournalPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Reading Journal')).toBeInTheDocument();
    expect(screen.getByText(/Meditations/i)).toBeInTheDocument();
    expect(screen.getByText(/Atomic Habits/i)).toBeInTheDocument();
    expect(
      screen.getByText(/The soul becomes dyed with the color of its thoughts/i)
    ).toBeInTheDocument();
  });

  it('filters entries by search query', async () => {
    render(
      <BrowserRouter>
        <ReadingJournalPage />
      </BrowserRouter>
    );

    const searchInput = screen.getByLabelText('Search journal');
    fireEvent.change(searchInput, { target: { value: 'compound interest' } });

    expect(
      screen.getByText(/Habits are the compound interest/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/The soul becomes dyed with the color of its thoughts/i)
    ).not.toBeInTheDocument();
  });

  it('creates a new collection when submitting the new collection form', async () => {
    render(
      <BrowserRouter>
        <ReadingJournalPage />
      </BrowserRouter>
    );

    const input = screen.getByPlaceholderText(/New collection name/i);
    const button = screen.getByText('Create collection');

    fireEvent.change(input, { target: { value: 'Poetry' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockCreateCollection).toHaveBeenCalledWith({ name: 'Poetry' });
    });
  });
});
