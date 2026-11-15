import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AuthenticatedActions from '@/components/library/AuthenticatedActions';
import * as authHelpers from '@/contexts/authHelpers';
import * as bookshelfHooks from '@/hooks/useUserBookshelf';

describe('AuthenticatedActions', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const mockBook = {
    id: 'book-1',
    title: 'War and Peace',
    author: 'Leo Tolstoy',
    pdf_url: '/pdfs/war-and-peace.pdf',
  };

  it('renders sign in button and download pdf button when user is logged out', () => {
    vi.spyOn(authHelpers, 'useAuth').mockReturnValue({ user: null } as any);
    vi.spyOn(bookshelfHooks, 'useUserBookshelf').mockReturnValue({ data: [] } as any);
    vi.spyOn(bookshelfHooks, 'useAddToBookshelf').mockReturnValue({ mutate: vi.fn(), isPending: false } as any);

    const onDownloadPDF = vi.fn();

    render(
      <MemoryRouter>
        <AuthenticatedActions book={mockBook as any} onDownloadPDF={onDownloadPDF} />
      </MemoryRouter>
    );

    expect(screen.getByText('Sign in to Add to Shelf')).toBeInTheDocument();
    const pdfBtn = screen.getByRole('button', { name: /download pdf/i });
    expect(pdfBtn).toBeInTheDocument();

    fireEvent.click(pdfBtn);
    expect(onDownloadPDF).toHaveBeenCalledWith(mockBook);
  });

  it('renders Add to Shelf button and handles click for authenticated user', () => {
    const mutate = vi.fn();
    vi.spyOn(authHelpers, 'useAuth').mockReturnValue({ user: { id: 'u1' } } as any);
    vi.spyOn(bookshelfHooks, 'useUserBookshelf').mockReturnValue({ data: [] } as any);
    vi.spyOn(bookshelfHooks, 'useAddToBookshelf').mockReturnValue({ mutate, isPending: false } as any);

    render(
      <MemoryRouter>
        <AuthenticatedActions book={mockBook as any} />
      </MemoryRouter>
    );

    const addBtn = screen.getByRole('button', { name: /add war and peace to your shelf/i });
    expect(addBtn).toBeInTheDocument();

    fireEvent.click(addBtn);
    expect(mutate).toHaveBeenCalledWith(
      { bookId: 'book-1', status: 'reading' },
      expect.any(Object)
    );
  });

  it('renders Added state when book is already in shelf', () => {
    vi.spyOn(authHelpers, 'useAuth').mockReturnValue({ user: { id: 'u1' } } as any);
    vi.spyOn(bookshelfHooks, 'useUserBookshelf').mockReturnValue({
      data: [{ book_id: 'book-1' }],
    } as any);
    vi.spyOn(bookshelfHooks, 'useAddToBookshelf').mockReturnValue({ mutate: vi.fn(), isPending: false } as any);

    render(
      <MemoryRouter>
        <AuthenticatedActions book={mockBook as any} />
      </MemoryRouter>
    );

    expect(screen.getByText('Added')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /war and peace is already in your shelf/i })).toBeDisabled();
  });
});
