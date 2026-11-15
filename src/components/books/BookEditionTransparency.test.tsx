import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { BookEditionTransparency } from '@/components/books/BookEditionTransparency';

vi.mock('@/hooks/useWorkEditions', () => ({
  useWorkEditions: () => ({
    data: [
      {
        id: 'alt-1',
        title: 'Alternate Translation',
        author: 'Jane Doe',
        publicationYear: 2021,
        language: 'English',
        accessStatus: 'verified',
      },
    ],
  }),
}));

vi.mock('./BookEditionPicker', () => ({
  BookEditionPicker: () => <button data-testid="edition-picker">Pick Edition</button>,
}));

describe('BookEditionTransparency', () => {
  afterEach(() => cleanup());

  const mockBook = {
    id: 'book-1',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    description: 'A classic romantic novel.',
    cover_image_url: '/covers/pride.jpg',
    pdf_url: '/pdfs/pride.pdf',
    isbn: '9780141439518',
    publication_year: 1813,
    pages: 432,
    genre: 'Classic Fiction',
    language: 'English',
  };

  it('renders edition quality, score, provenance, and alternative editions', () => {
    render(
      <MemoryRouter>
        <BookEditionTransparency book={mockBook} />
      </MemoryRouter>
    );

    expect(screen.getByText('Edition Quality & Provenance')).toBeInTheDocument();
    expect(screen.getByText(/Score:/)).toBeInTheDocument();
    expect(screen.getByTestId('edition-picker')).toBeInTheDocument();
    expect(screen.getByText(/Alternative Editions of this Work/)).toBeInTheDocument();
    expect(screen.getByText('Alternate Translation')).toBeInTheDocument();
  });

  it('opens report issue dialog when report button is clicked', () => {
    render(
      <MemoryRouter>
        <BookEditionTransparency book={mockBook} />
      </MemoryRouter>
    );

    const reportBtn = screen.getByRole('button', { name: /report link or error/i });
    fireEvent.click(reportBtn);

    expect(screen.getByText('Report an Issue with this Edition')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/describe the issue/i)).toBeInTheDocument();
  });
});
