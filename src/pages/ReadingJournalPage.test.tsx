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
const mockUpdateMeta = vi.fn().mockResolvedValue(undefined);
const mockBulkAssign = vi.fn().mockResolvedValue(undefined);
const mockBulkTag = vi.fn().mockResolvedValue(undefined);

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
      { bookId: 'book-1', bookTitle: 'Meditations', totalEntriesCount: 1 },
      { bookId: 'book-2', bookTitle: 'Atomic Habits', totalEntriesCount: 1 },
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
  useJournalEntryMeta: () => ({
    data: {
      'hl-1': { favorite: true, pinned: false, tags: ['stoic'] },
      'note-1': { favorite: false, pinned: true, tags: ['habits'] },
    },
    isLoading: false,
  }),
  useUpdateJournalEntryMeta: () => ({
    mutateAsync: mockUpdateMeta,
    isPending: false,
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
  useBulkAssignEntriesCollection: () => ({
    mutateAsync: mockBulkAssign,
    isPending: false,
  }),
  useBulkTagEntries: () => ({
    mutateAsync: mockBulkTag,
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

  it('switches between Timeline View and By Book view', () => {
    render(
      <BrowserRouter>
        <ReadingJournalPage />
      </BrowserRouter>
    );

    const byBookBtn = screen.getByRole('button', { name: /By Book/i });
    fireEvent.click(byBookBtn);

    expect(screen.getAllByText(/Export Book Notes/i).length).toBeGreaterThan(0);

    const timelineBtn = screen.getByRole('button', { name: /Timeline View/i });
    fireEvent.click(timelineBtn);

    expect(screen.queryByText(/Export Book Notes/i)).not.toBeInTheDocument();
  });

  it('supports selecting entries and reveals sticky bulk action toolbar', async () => {
    render(
      <BrowserRouter>
        <ReadingJournalPage />
      </BrowserRouter>
    );

    const selectEntryBtn = screen.getByLabelText('Select entry hl-1');
    fireEvent.click(selectEntryBtn);

    expect(screen.getByText('1 selected')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Tags/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Export Selected/i })).toBeInTheDocument();

    const clearBtn = screen.getByRole('button', { name: /Clear/i });
    fireEvent.click(clearBtn);

    expect(screen.queryByText('1 selected')).not.toBeInTheDocument();
  });

  it('filters entries when toggling Favorites only and Pinned only', () => {
    render(
      <BrowserRouter>
        <ReadingJournalPage />
      </BrowserRouter>
    );

    const favBtn = screen.getByRole('button', { name: /Favorites/i });
    fireEvent.click(favBtn);

    // Only hl-1 is favorite
    expect(
      screen.getByText(/The soul becomes dyed with the color of its thoughts/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Habits are the compound interest/i)
    ).not.toBeInTheDocument();

    fireEvent.click(favBtn); // uncheck favorites

    const pinBtn = screen.getByRole('button', { name: /Pinned/i });
    fireEvent.click(pinBtn);

    // Only note-1 is pinned
    expect(
      screen.getByText(/Habits are the compound interest/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/The soul becomes dyed with the color of its thoughts/i)
    ).not.toBeInTheDocument();
  });
});
