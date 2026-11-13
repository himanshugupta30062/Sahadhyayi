// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BookReadingJournal from './BookReadingJournal';

vi.mock('@/contexts/authHelpers', () => ({ useAuth: () => ({ user: { id: 'u1' } }) }));
vi.mock('@/hooks/useMarginNotes', () => ({ useDeleteMarginNote: () => ({ mutate: vi.fn() }), useUpdateMarginNote: () => ({ mutateAsync: vi.fn().mockResolvedValue({ id: 'n1' }), isPending: false }), useMarginNotes: () => ({ data: [{ id: 'n1', user_id: 'u1', book_id: 'b1', page: 15, quote: 'Truth alone triumphs.', note: 'Personal reflection on truth in adversity.', visibility: 'private', created_at: new Date().toISOString() }], isLoading: false }) }));
vi.mock('@/hooks/useReaderHighlights', () => ({ useReaderHighlights: () => ({ data: [{ id: 'h1', user_id: 'u1', book_id: 'b1', text: 'The mind is everything. What you think you become.', page: 22, color: 'yellow', created_at: new Date().toISOString() }], isLoading: false }), useDeleteReaderHighlight: () => ({ mutate: vi.fn(), isPending: false }) }));
vi.mock('@/contexts/quotesHelpers', () => ({ useQuotes: () => ({ quotes: [{ id: 1, text: 'A room without books is like a body without a soul.', source: 'Cicero', bookId: 'b1', page: 5 }], addQuote: vi.fn(), removeQuote: vi.fn() }) }));
vi.mock('@/hooks/useReadingProgress', () => ({ useReadingProgress: () => ({ data: [{ id: 1, book_id: 'b1', book_title: 'Satyamev', current_page: 25, total_pages: 100 }], isLoading: false }) }));
vi.mock('@/utils/readingProgressStorage', () => ({ loadProgressLocally: () => ({ currentPage: 25, totalPages: 100 }) }));

describe('BookReadingJournal', () => {
  afterEach(cleanup);
  const renderJournal = () => render(<MemoryRouter><BookReadingJournal bookId="b1" bookTitle="Satyamev" currentPage={25} /></MemoryRouter>);

  it('renders reading progress, statistics, and unified entries', () => {
    renderJournal();
    expect(screen.getByText('Satyamev')).toBeInTheDocument();
    expect(screen.getByText(/Page 25 of 100 · 25% read/i)).toBeInTheDocument();
    expect(screen.getByText('3 total')).toBeInTheDocument();
    expect(screen.getByText('1 reflections')).toBeInTheDocument();
    expect(screen.getByText('1 highlights')).toBeInTheDocument();
    expect(screen.getByText('1 quotes')).toBeInTheDocument();
    expect(screen.getByText(/Truth alone triumphs/i)).toBeInTheDocument();
    expect(screen.getByText(/Personal reflection on truth/i)).toBeInTheDocument();
    expect(screen.getByText(/The mind is everything/i)).toBeInTheDocument();
    expect(screen.getByText(/A room without books/i)).toBeInTheDocument();
  });

  it('filters entries when a type filter is selected', () => {
    renderJournal();
    fireEvent.click(screen.getByRole('button', { name: /Highlights \(1\)/i }));
    expect(screen.getByText(/The mind is everything/i)).toBeInTheDocument();
    expect(screen.queryByText(/Personal reflection on truth/i)).not.toBeInTheDocument();
  });

  it('offers deletion for private reflections', () => {\n    vi.spyOn(window, 'confirm').mockReturnValue(true);\n    renderJournal();\n    expect(screen.getByTitle('Delete private reflection')).toBeInTheDocument();\n  });\n\n  it('opens an editor for private reflections', () => {
    renderJournal();
    fireEvent.click(screen.getByTitle('Edit private reflection'));
    expect(screen.getByRole('textbox', { name: 'Edit reflection quote' })).toHaveValue('Truth alone triumphs.');
    expect(screen.getByRole('textbox', { name: 'Edit reflection note' })).toHaveValue('Personal reflection on truth in adversity.');
    expect(screen.getByRole('spinbutton', { name: 'Edit reflection page' })).toHaveValue(15);
    expect(screen.getByRole('button', { name: /Save/i })).toBeInTheDocument();
  });

  it('searches journal text, notes, and page numbers', () => {
    renderJournal();
    fireEvent.change(screen.getByRole('textbox', { name: /Search journal entries/i }), { target: { value: 'adversity' } });
    expect(screen.getByText(/Personal reflection on truth/i)).toBeInTheDocument();
    expect(screen.queryByText(/The mind is everything/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: /Search journal entries/i }), { target: { value: '22' } });
    expect(screen.getByText(/The mind is everything/i)).toBeInTheDocument();
    expect(screen.queryByText(/Personal reflection on truth/i)).not.toBeInTheDocument();
  });
});
