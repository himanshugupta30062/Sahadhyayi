import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BookFilterDropdown } from './BookFilterDropdown';

vi.mock('@/hooks/useUserBookshelf', () => ({
  useUserBookshelf: () => ({
    data: [
      {
        books_library: {
          id: 'b-1',
          title: 'The Great Gatsby',
          author: 'F. Scott Fitzgerald',
          cover_image_url: 'https://example.com/gatsby.jpg',
        },
      },
      {
        books_library: {
          id: 'b-2',
          title: 'Moby Dick',
          author: 'Herman Melville',
          cover_image_url: 'https://example.com/moby.jpg',
        },
      },
    ],
  }),
}));

describe('BookFilterDropdown', () => {
  it('renders trigger button and shows bookshelf books when opened', () => {
    const onBookSelect = vi.fn();
    render(
      <BookFilterDropdown selectedBookId={null} onBookSelect={onBookSelect} />
    );

    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeInTheDocument();

    fireEvent.click(trigger);
    expect(screen.getByText('The Great Gatsby')).toBeInTheDocument();
    expect(screen.getByText('Moby Dick')).toBeInTheDocument();
  });
});
