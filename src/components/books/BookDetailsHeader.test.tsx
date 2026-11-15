import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import BookDetailsHeader from '@/components/books/BookDetailsHeader';

describe('BookDetailsHeader', () => {
  afterEach(() => cleanup());

  it('renders title and back to library navigation link', () => {
    render(
      <MemoryRouter>
        <BookDetailsHeader title="Atomic Habits" />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Atomic Habits');
    const backLink = screen.getByRole('link', { name: /back to library/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/library');
  });
});
