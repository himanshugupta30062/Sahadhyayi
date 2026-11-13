// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import UpNextQueue from './UpNextQueue';
import { BookshelfItem } from '@/hooks/useUserBookshelf';

const startReadingMock = vi.fn();
const removeMock = vi.fn();
const reorderMock = vi.fn();

vi.mock('@/hooks/useUserBookshelf', async () => {
  const actual = await vi.importActual<any>('@/hooks/useUserBookshelf');
  return {
    ...actual,
    useUpNextQueue: () => ({
      startReadingFromQueue: { mutate: startReadingMock, isPending: false },
      removeFromUpNext: { mutate: removeMock, isPending: false },
      reorderUpNext: { mutate: reorderMock, isPending: false },
    }),
  };
});

describe('UpNextQueue', () => {
  let queryClient: QueryClient;

  const mockItems: BookshelfItem[] = [
    {
      id: 'queue-1',
      user_id: 'u1',
      book_id: 'b1',
      status: 'want_to_read',
      up_next_position: 1,
      added_at: '2026-11-01T00:00:00Z',
      books_library: {
        id: 'b1',
        title: 'Midnight Children',
        author: 'Salman Rushdie',
      },
    },
    {
      id: 'queue-2',
      user_id: 'u1',
      book_id: 'b2',
      status: 'want_to_read',
      up_next_position: 2,
      added_at: '2026-11-02T00:00:00Z',
      books_library: {
        id: 'b2',
        title: 'A Suitable Boy',
        author: 'Vikram Seth',
      },
    },
  ];

  beforeEach(() => {
    queryClient = new QueryClient();
    startReadingMock.mockClear();
    removeMock.mockClear();
    reorderMock.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders queued items and empty slots up to 5', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <UpNextQueue bookshelfItems={mockItems} />
        </BrowserRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('Up Next Reading Queue')).toBeInTheDocument();
    expect(screen.getByText(/2 of 5 slots/i)).toBeInTheDocument();
    expect(screen.getByText('Midnight Children')).toBeInTheDocument();
    expect(screen.getByText('A Suitable Boy')).toBeInTheDocument();

    const emptySlots = screen.getAllByText('Empty Slot');
    expect(emptySlots.length).toBe(3);
  });

  it('triggers startReadingFromQueue when Start Reading is clicked', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <UpNextQueue bookshelfItems={mockItems} />
        </BrowserRouter>
      </QueryClientProvider>
    );

    const startButtons = screen.getAllByRole('button', { name: /Start Reading/i });
    expect(startButtons.length).toBe(2);

    fireEvent.click(startButtons[0]);
    expect(startReadingMock).toHaveBeenCalledWith(
      expect.objectContaining({
        bookshelfItemId: 'queue-1',
      })
    );
  });

  it('triggers removeFromUpNext when remove button is clicked', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <UpNextQueue bookshelfItems={mockItems} />
        </BrowserRouter>
      </QueryClientProvider>
    );

    const removeButtons = screen.getAllByRole('button', { name: /Remove from Up Next/i });
    fireEvent.click(removeButtons[0]);

    expect(removeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        bookshelfItemId: 'queue-1',
      })
    );
  });
});
