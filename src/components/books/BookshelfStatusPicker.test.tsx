// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BookshelfStatusPicker from './BookshelfStatusPicker';

const mockShelfItem = {
  id: 'shelf-1',
  user_id: 'user-1',
  book_id: 'book-1',
  status: 'reading' as const,
  up_next_position: 1,
  added_at: '2026-11-01T00:00:00Z',
};

const addToBookshelfMock = vi.fn();
const updateBookshelfMock = vi.fn();
const removeFromBookshelfMock = vi.fn();
const addToUpNextMock = vi.fn();
const removeFromUpNextMock = vi.fn();

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div data-testid="dropdown">{children}</div>,
  DropdownMenuTrigger: ({ children, asChild }: any) => <>{children}</>,
  DropdownMenuContent: ({ children }: any) => <div role="menu">{children}</div>,
  DropdownMenuItem: ({ children, onClick, disabled }: any) => (
    <button role="menuitem" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  DropdownMenuSeparator: () => <hr />,
}));

vi.mock('@/hooks/useUserBookshelf', async () => {
  const actual = await vi.importActual<any>('@/hooks/useUserBookshelf');
  return {
    ...actual,
    useUserBookshelf: () => ({
      data: [mockShelfItem],
      isLoading: false,
    }),
    useAddToBookshelf: () => ({ mutate: addToBookshelfMock, isPending: false }),
    useUpdateBookshelfItem: () => ({ mutate: updateBookshelfMock, isPending: false }),
    useRemoveFromBookshelf: () => ({ mutate: removeFromBookshelfMock, isPending: false }),
    useUpNextQueue: () => ({
      addToUpNext: { mutate: addToUpNextMock, isPending: false },
      removeFromUpNext: { mutate: removeFromUpNextMock, isPending: false },
    }),
  };
});

describe('BookshelfStatusPicker', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
    addToBookshelfMock.mockClear();
    updateBookshelfMock.mockClear();
    removeFromBookshelfMock.mockClear();
    addToUpNextMock.mockClear();
    removeFromUpNextMock.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders active shelf status and queue badge', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <BookshelfStatusPicker
            bookId="book-1"
            bookTitle="Test Book"
          />
        </BrowserRouter>
      </QueryClientProvider>
    );

    expect(screen.getAllByText('Currently Reading').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Queue #1/i)).toBeInTheDocument();
  });

  it('opens menu with options when clicked', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <BookshelfStatusPicker
            bookId="book-1"
            bookTitle="Test Book"
          />
        </BrowserRouter>
      </QueryClientProvider>
    );

    const trigger = screen.getByRole('button', { name: /Currently Reading/i });
    fireEvent.click(trigger);

    expect(screen.getByRole('menuitem', { name: /Want to Read/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Read \/ Completed/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Did Not Finish \(DNF\)/i })).toBeInTheDocument();
  });
});
