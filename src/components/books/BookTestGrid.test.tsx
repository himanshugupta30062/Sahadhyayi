// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import BookTestGrid from './BookTestGrid';

describe('BookTestGrid', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders loading skeletons when loading is true', () => {
    const { container } = render(<BookTestGrid books={[]} loading={true} />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(8);
  });

  it('renders empty state when no books are found', () => {
    render(<BookTestGrid books={[]} loading={false} />);
    expect(screen.getByRole('heading', { name: 'No Books Found' })).toBeInTheDocument();
    expect(screen.getByText(/Try searching for books/i)).toBeInTheDocument();
  });

  it('renders book cards with details when books are provided', () => {
    const books = [
      {
        id: 'book-1',
        title: 'Brave New World',
        author: 'Aldous Huxley',
        genre: 'Dystopian',
        publication_year: 1932,
        pages: 311,
        language: 'French',
        isbn: '978-0060850524',
        description: 'A dystopian social science fiction novel.',
      },
    ];

    render(<BookTestGrid books={books} loading={false} />);

    expect(screen.getByRole('heading', { name: 'Brave New World' })).toBeInTheDocument();
    expect(screen.getByText('by Aldous Huxley')).toBeInTheDocument();
    expect(screen.getByText('Dystopian')).toBeInTheDocument();
    expect(screen.getByText('French')).toBeInTheDocument();
    expect(screen.getByText('1932')).toBeInTheDocument();
    expect(screen.getByText('311 pages')).toBeInTheDocument();
    expect(screen.getByText('ISBN: 978-0060850524')).toBeInTheDocument();
    expect(screen.getByText('A dystopian social science fiction novel.')).toBeInTheDocument();
  });
});

