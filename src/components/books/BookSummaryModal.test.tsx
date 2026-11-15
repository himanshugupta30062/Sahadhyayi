import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BookSummaryModal from './BookSummaryModal';

describe('BookSummaryModal', () => {
  it('returns null when book is null', () => {
    const { container } = render(
      <BookSummaryModal isOpen={true} onClose={vi.fn()} book={null} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal dialog with detailed summary when book is provided', () => {
    const onClose = vi.fn();
    const book = {
      title: 'War and Peace',
      author: 'Leo Tolstoy',
      description: 'An epic chronicle of Russian society during the Napoleonic era.',
    };

    render(<BookSummaryModal isOpen={true} onClose={onClose} book={book} />);

    expect(screen.getByText(/detailed summary - war and peace/i)).toBeInTheDocument();
    expect(screen.getByText(/an epic chronicle of russian society/i)).toBeInTheDocument();

    const closeBtns = screen.getAllByRole('button', { name: /close/i });
    expect(closeBtns.length).toBeGreaterThan(0);
    fireEvent.click(closeBtns[0]);
    expect(onClose).toHaveBeenCalled();
  });
});
