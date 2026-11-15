import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AddBookDialog from '@/components/AddBookDialog';

describe('AddBookDialog', () => {
  afterEach(() => cleanup());

  it('opens dialog, filters books by search term, and triggers onAddBook', () => {
    const onAddBook = vi.fn();
    render(<AddBookDialog onAddBook={onAddBook} />);

    const openBtn = screen.getByRole('button', { name: /add book/i });
    fireEvent.click(openBtn);

    expect(screen.getByText('Add Book to Your Shelf')).toBeInTheDocument();
    expect(screen.getByText('The Alchemist')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/search books/i);
    fireEvent.change(searchInput, { target: { value: '1984' } });

    expect(screen.getByText('1984')).toBeInTheDocument();
    expect(screen.queryByText('The Alchemist')).not.toBeInTheDocument();

    const addBookBtn = screen.getByRole('button', { name: /add to shelf/i });
    fireEvent.click(addBookBtn);

    expect(onAddBook).toHaveBeenCalledWith(
      expect.objectContaining({ title: '1984', author: 'George Orwell' })
    );
  });
});
