import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import BookCard from '@/components/books/BookCard';
import * as authHelpers from '@/contexts/authHelpers';
import * as bookshelfHooks from '@/hooks/useUserBookshelf';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('BookCard', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const mockBook = {
    id: 'b-101',
    title: 'Atomic Habits',
    author: 'James Clear',
    description: 'An easy and proven way to build good habits.',
    cover_image_url: '/covers/habits.jpg',
  };

  it('redirects unauthenticated user to signin when Add to Shelf is clicked', () => {
    vi.spyOn(authHelpers, 'useAuth').mockReturnValue({ user: null } as any);
    vi.spyOn(bookshelfHooks, 'useUserBookshelf').mockReturnValue({ data: [] } as any);
    vi.spyOn(bookshelfHooks, 'useAddToBookshelf').mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    render(
      <MemoryRouter>
        <BookCard book={mockBook} />
      </MemoryRouter>
    );

    expect(screen.getByText('Atomic Habits')).toBeInTheDocument();
    expect(screen.getByText('by James Clear')).toBeInTheDocument();

    const addBtn = screen.getByRole('button', { name: /add to shelf/i });
    fireEvent.click(addBtn);

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining('/signin?redirect=')
    );
  });

  it('triggers addToBookshelf mutation when authenticated user adds book', () => {
    const mutate = vi.fn();
    vi.spyOn(authHelpers, 'useAuth').mockReturnValue({ user: { id: 'u-1' } } as any);
    vi.spyOn(bookshelfHooks, 'useUserBookshelf').mockReturnValue({ data: [] } as any);
    vi.spyOn(bookshelfHooks, 'useAddToBookshelf').mockReturnValue({
      mutate,
      isPending: false,
    } as any);

    const onAdded = vi.fn();
    render(
      <MemoryRouter>
        <BookCard book={mockBook} onAdded={onAdded} />
      </MemoryRouter>
    );

    const addBtn = screen.getByRole('button', { name: /add to shelf/i });
    fireEvent.click(addBtn);

    expect(mutate).toHaveBeenCalledWith(
      { bookId: 'b-101' },
      expect.any(Object)
    );
  });

  it('shows In Library badge and disabled Added button when book is in shelf', () => {
    vi.spyOn(authHelpers, 'useAuth').mockReturnValue({ user: { id: 'u-1' } } as any);
    vi.spyOn(bookshelfHooks, 'useUserBookshelf').mockReturnValue({
      data: [{ book_id: 'b-101' }],
    } as any);
    vi.spyOn(bookshelfHooks, 'useAddToBookshelf').mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    render(
      <MemoryRouter>
        <BookCard book={mockBook} />
      </MemoryRouter>
    );

    expect(screen.getByText('In Library')).toBeInTheDocument();
    const addedBtn = screen.getByRole('button', { name: /added/i });
    expect(addedBtn).toBeDisabled();
  });
});
