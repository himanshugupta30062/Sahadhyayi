import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LibraryViewModes from './LibraryViewModes';

describe('LibraryViewModes', () => {
  it('renders total books count and changes view mode buttons', () => {
    const onViewModeChange = vi.fn();
    const onSortChange = vi.fn();

    render(
      <LibraryViewModes
        viewMode="grid"
        onViewModeChange={onViewModeChange}
        sortBy="title-asc"
        onSortChange={onSortChange}
        totalBooks={1542}
      />
    );

    expect(screen.getByText('1,542 Books')).toBeInTheDocument();

    const listBtn = screen.getByRole('button', { name: /list/i });
    fireEvent.click(listBtn);
    expect(onViewModeChange).toHaveBeenCalledWith('list');

    const bookshelfBtn = screen.getByRole('button', { name: /shelf/i });
    fireEvent.click(bookshelfBtn);
    expect(onViewModeChange).toHaveBeenCalledWith('bookshelf');
  });
});
