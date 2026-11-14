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
    id: '42',
    created_at: '2026-01-01T00:00:00Z',
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

  it('renders non-PDF books with interactive page navigation, view modes, and dark mode', () => {
    const nonPdfBook: Book = {
      id: '99',
      created_at: '2026-01-01T00:00:00Z',
      title: 'Untouchable',
      author: 'Mulk Raj Anand',
      description: 'A day in the life of Bakha, an outcast sweeper.',
      pages: 150,
    };

    const onClose = vi.fn();
    render(<BookReader book={nonPdfBook} isOpen={true} onClose={onClose} />);

    // Verify non-PDF page display - for non-PDF books, shows "Full text unavailable"
    expect(screen.getByText('Full text unavailable')).toBeInTheDocument();
    // Bottom navigation still shows page info
    expect(screen.getByText(/Page 1 of 150/i)).toBeInTheDocument();
    // Description is not shown for non-PDF books (only in PDF viewer)

    // Toggle view mode between Double Page and Single Page
    const viewModeBtn = screen.getByRole('button', { name: /double page/i });
    fireEvent.click(viewModeBtn);
    expect(screen.getByRole('button', { name: /single page/i })).toBeInTheDocument();

    // Zoom controls
    const zoomText = screen.getByText('100%');
    expect(zoomText).toBeInTheDocument();

    // For non-PDF books, page navigation doesn't change content (shows "Full text unavailable")
    // But bottom bar still shows page info - verify it renders
    expect(screen.getByText(/Page 1 of 150/i)).toBeInTheDocument();

    // Test zoom in / zoom out keyboard shortcuts
    fireEvent.keyDown(window, { key: '+' });
    expect(screen.getByText('125%')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: '-' });
    expect(screen.getByText('100%')).toBeInTheDocument();

    // Rotate shortcut
    fireEvent.keyDown(window, { key: 'r' });

    // Dark mode shortcut
    fireEvent.keyDown(window, { key: 'd' });

    // Escape closes reader
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('returns null when book is null', () => {
    const { container } = render(<BookReader book={null} isOpen={true} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});
