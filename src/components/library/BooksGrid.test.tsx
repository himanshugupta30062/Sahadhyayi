import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BooksGrid from './BooksGrid';
import type { Book } from '@/hooks/useLibraryBooks';

vi.mock('./BookCard', () => ({
  default: ({ book }: { book: Book }) => <div data-testid="book-card">{book.title}</div>,
}));

describe('BooksGrid', () => {
  it('renders "No Books Found" placeholder when empty', () => {
    render(<BooksGrid books={[]} />);
    expect(screen.getByText('No Books Found')).toBeInTheDocument();
  });

  it('renders list of BookCard items when books are provided', () => {
    const books = [
      { id: '1', title: 'Book One', author: 'Author A' },
      { id: '2', title: 'Book Two', author: 'Author B' },
    ] as unknown as Book[];

    render(
      <MemoryRouter>
        <BooksGrid books={books} />
      </MemoryRouter>
    );

    const cards = screen.getAllByTestId('book-card');
    expect(cards.length).toBe(2);
    expect(screen.getByText('Book One')).toBeInTheDocument();
    expect(screen.getByText('Book Two')).toBeInTheDocument();
  });
});
