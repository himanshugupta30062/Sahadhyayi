// @vitest-environment jsdom

import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import BookReader from './BookReader';
import type { Book } from '@/hooks/useLibraryBooks';

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock('@/utils/readingProgressStorage', () => ({
  loadProgressLocally: () => null,
  saveProgressLocally: () => null,
}));

describe('Library BookReader Modal Dialog', () => {
  afterEach(() => {
    cleanup();
  });

  const sampleBook: Book = {
    id: 42,
    title: 'Gitanjali',
    author: 'Rabindranath Tagore',
    description: 'Song offerings of timeless poetry.',
    pdf_url: 'https://books.google.com/books?id=tagore123',
    pages: 120,
    cover_image_url: 'https://example.com/cover.jpg',
  };

  it('renders Google Books embed URL safely inside dialog when open', () => {
    render(<BookReader book={sampleBook} isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Gitanjali' })).toBeInTheDocument();
    expect(screen.getByText(/by Rabindranath Tagore/i)).toBeInTheDocument();

    const iframe = screen.getByTitle('Gitanjali - Reader');
    expect(iframe).toHaveAttribute(
      'src',
      'https://books.google.com/books?id=tagore123&lpg=PP1&pg=PP1&output=embed'
    );
  });

  it('switches to clean fallback view with external reading option when blocked', () => {
    render(<BookReader book={sampleBook} isOpen={true} onClose={vi.fn()} />);

    const blockedBtn = screen.getByRole('button', { name: /blocked\?/i });
    fireEvent.click(blockedBtn);

    expect(
      screen.getByRole('heading', { name: /inline preview blocked or restricted/i })
    ).toBeInTheDocument();

    const openGbooks = screen.getByRole('link', { name: /read on google books ↗/i });
    expect(openGbooks).toHaveAttribute('href', 'https://books.google.com/books?id=tagore123');
  });

  it('renders direct PDF embed URL with page navigation', () => {
    const pdfBook: Book = {
      ...sampleBook,
      pdf_url: 'https://example.com/poems.pdf',
    };

    render(<BookReader book={pdfBook} isOpen={true} onClose={vi.fn()} />);

    const iframe = screen.getByTitle('Gitanjali - Reader');
    expect(iframe.getAttribute('src')).toContain('https://example.com/poems.pdf#toolbar=1&navpanes=1&scrollbar=1&page=1');
  });
});
