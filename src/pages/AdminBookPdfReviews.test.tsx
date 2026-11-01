// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

const mocks = vi.hoisted(() => ({
  submissions: [] as any[],
  books: [] as any[],
  queueLoading: false,
  queueError: null as unknown,
  booksLoading: false,
  queryOptions: [] as any[],
  invoke: vi.fn(),
  invalidateQueries: vi.fn().mockResolvedValue(undefined),
  toast: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
  useQuery: (options: any) => {
    mocks.queryOptions.push(options);
    const isQueue = options.queryKey[0] === 'admin-book-pdf-review-queue';
    return {
      data: isQueue ? mocks.submissions : mocks.books,
      isLoading: isQueue ? mocks.queueLoading : mocks.booksLoading,
      isFetching: false,
      error: isQueue ? mocks.queueError : null,
    };
  },
}));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    from: (table: string) => {
      mocks.from(table);
      const result = table === 'book_pdf_submissions' ? mocks.submissions : mocks.books;
      const query: any = {
        select: (...args: unknown[]) => { mocks.select(...args); return query; },
        order: (...args: unknown[]) => { mocks.order(...args); return query; },
        limit: (...args: unknown[]) => { mocks.limit(...args); return Promise.resolve({ data: result, error: null }); },
      };
      return query;
    },
    functions: { invoke: (...args: unknown[]) => mocks.invoke(...args) },
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mocks.toast }),
}));
vi.mock('@/components/SEO', () => ({ default: () => null }));

import AdminBookPdfReviews from '@/pages/AdminBookPdfReviews';

const submission = (overrides: Record<string, unknown> = {}) => ({
  id: 'submission-1',
  user_id: 'reader-1',
  original_filename: 'source.pdf',
  storage_path: 'reader-1/submission-1/source.pdf',
  file_size_bytes: 1024 * 1024 * 2,
  submitted_title: 'A Test Book',
  submitted_author: 'A Test Author',
  status: 'needs_review',
  rights_attested: true,
  detected_metadata: {
    detected_title: 'A Test Book',
    detected_author: 'A Test Author',
    language: 'English',
    document_type: 'book',
    content_relevance: 'high',
    readability: 'good',
    completeness_signals: 'uncertain',
    recommendation: 'needs_review',
    catalogue_candidates: [{ id: 'book-1', title: 'A Test Book', author: 'A Test Author', pdf_url: null }],
  },
  validation_findings: ['Check the edition', { source: 'automated' }],
  match_confidence: 0.91,
  rejection_reason: null,
  created_at: '2026-10-20T12:00:00Z',
  verification_model: 'gemini-2.5-flash',
  verification_completed_at: '2026-10-20T12:10:00Z',
  published_book_id: null,
  ...overrides,
});

const renderPage = () => render(<AdminBookPdfReviews />);

describe('AdminBookPdfReviews', () => {
  beforeEach(() => {
    mocks.submissions = [submission()];
    mocks.books = [
      { id: 'book-1', title: 'A Test Book', author: 'A Test Author', pdf_url: null },
      { id: 'book-2', title: 'Another Book', author: 'Other Author', pdf_url: null },
      { id: 'book-3', title: 'Already linked', author: 'Someone', pdf_url: 'https://cdn.example/book.pdf' },
    ];
    mocks.queueLoading = false;
    mocks.queueError = null;
    mocks.booksLoading = false;
    mocks.queryOptions = [];
    mocks.invoke.mockReset().mockResolvedValue({ data: { success: true, status: 'approved', report: { detected_title: 'A Test Book' } }, error: null });
    mocks.invalidateQueries.mockClear();
    mocks.toast.mockReset();
    mocks.from.mockReset();
    mocks.select.mockReset();
    mocks.order.mockReset();
    mocks.limit.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders the empty queue and loading and error states', () => {
    mocks.submissions = [];
    const empty = renderPage();
    expect(screen.getByRole('heading', { name: 'No submissions yet' })).toBeInTheDocument();
    empty.unmount();

    mocks.queueLoading = true;
    const loading = renderPage();
    expect(screen.getByText(/Loading submissions/)).toBeInTheDocument();
    loading.unmount();

    mocks.queueLoading = false;
    mocks.queueError = new Error('permission denied');
    renderPage();
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load the review queue');
  });

  it('shows status counts, report metadata, warnings and catalogue matches', () => {
    mocks.submissions = [
      submission(),
      submission({ id: 'submission-2', status: 'approved', published_book_id: 'book-2' }),
      submission({ id: 'submission-3', status: 'rejected' }),
    ];
    renderPage();

    expect(screen.getByRole('heading', { name: 'Book PDF Verification' })).toBeInTheDocument();
    expect(screen.getByText('Pending review').parentElement).toHaveTextContent('1');
    expect(screen.getByText('Approved').parentElement).toHaveTextContent('1');
    expect(screen.getByText('Rejected').parentElement).toHaveTextContent('1');
    expect(screen.getByText('Published').parentElement).toHaveTextContent('1');
    expect(screen.getByText('Detected title').parentElement).toHaveTextContent('A Test Book');
    expect(screen.getByText('Confidence').parentElement).toHaveTextContent('91%');
    expect(screen.getByText('Check the edition')).toBeInTheDocument();
    expect(screen.getByText('{"source":"automated"}')).toBeInTheDocument();
    expect(screen.getByText('Possible catalogue matches')).toBeInTheDocument();
    expect(screen.getByText('No PDF linked')).toBeInTheDocument();
  });

  it('loads both query sources and surfaces query errors', async () => {
    renderPage();
    const queueQuery = mocks.queryOptions.find((item) => item.queryKey[0] === 'admin-book-pdf-review-queue');
    const booksQuery = mocks.queryOptions.find((item) => item.queryKey[0] === 'admin-pdf-review-books');

    await expect(queueQuery.queryFn()).resolves.toEqual(mocks.submissions);
    await expect(booksQuery.queryFn()).resolves.toEqual(mocks.books);
    expect(mocks.from).toHaveBeenCalledWith('book_pdf_submissions');
    expect(mocks.from).toHaveBeenCalledWith('books_library');
    expect(mocks.limit).toHaveBeenCalledWith(200);
    expect(mocks.limit).toHaveBeenCalledWith(2000);
  });

  it('opens a temporary preview and shows the expiry notice', async () => {
    mocks.invoke.mockResolvedValueOnce({ data: { url: 'https://signed.example/preview' }, error: null });
    const open = vi.spyOn(window, 'open').mockImplementation(() => ({} as Window));
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Preview PDF/i }));

    await waitFor(() => expect(mocks.invoke).toHaveBeenCalledWith('review-book-pdf', {
      body: { submissionId: 'submission-1', action: 'preview' },
    }));
    expect(open).toHaveBeenCalledWith('https://signed.example/preview', '_blank', 'noopener,noreferrer');
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Temporary preview opened' }));
    expect(mocks.invalidateQueries).not.toHaveBeenCalled();
  });

  it('reports a blocked preview popup instead of claiming it opened', async () => {
    mocks.invoke.mockResolvedValueOnce({ data: { url: 'https://signed.example/preview' }, error: null });
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Preview PDF/i }));

    await waitFor(() => expect(open).toHaveBeenCalledWith('https://signed.example/preview', '_blank', 'noopener,noreferrer'));
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Action failed',
      description: 'The preview popup was blocked. Allow pop-ups and try again.',
      variant: 'destructive',
    }));
    expect(mocks.toast).not.toHaveBeenCalledWith(expect.objectContaining({ title: 'Temporary preview opened' }));
  });

  it('surfaces a server-declared review failure even when the function call has no transport error', async () => {
    mocks.invoke.mockResolvedValueOnce({
      data: { success: false, error: 'The submission is no longer eligible for review.' },
      error: null,
    });
    renderPage();
    fireEvent.change(screen.getByLabelText(/Reason/), {
      target: { value: 'The server says this submission is no longer eligible.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }));

    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Action failed',
      description: 'The submission is no longer eligible for review.',
      variant: 'destructive',
    })));
    expect(mocks.invalidateQueries).not.toHaveBeenCalled();
  });

  it('extracts a useful message from a JSON function-error response', async () => {
    const responseError = Object.assign(new Error('Edge Function returned a non-2xx status code'), {
      context: new Response(JSON.stringify({ error: 'The reviewer role is required.' }), {
        status: 403,
        headers: { 'content-type': 'application/json' },
      }),
    });
    mocks.invoke.mockResolvedValueOnce({ data: null, error: responseError });
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Preview PDF/i }));

    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Action failed',
      description: 'The reviewer role is required.',
      variant: 'destructive',
    })));
  });

  it('runs AI verification, refreshes dependent caches, and keeps the selected submission', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Run Gemini verification/i }));

    await waitFor(() => expect(mocks.invoke).toHaveBeenCalledWith('verify-book-pdf', {
      body: { submissionId: 'submission-1' },
    }));
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'AI review completed' }));
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-book-pdf-review-queue'] });
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['my-book-pdf-submissions'] });
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['books'] });
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-book-pdf-manager-books'] });
  });

  it('submits a reason for rejection and refreshes after the decision', async () => {
    renderPage();
    const reason = screen.getByLabelText(/Reason/);
    fireEvent.change(reason, { target: { value: 'The rights evidence is incomplete.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }));

    await waitFor(() => expect(mocks.invoke).toHaveBeenCalledWith('review-book-pdf', {
      body: { submissionId: 'submission-1', action: 'reject', reason: 'The rights evidence is incomplete.' },
    }));
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Review saved' }));
    expect(mocks.invalidateQueries).toHaveBeenCalled();
  });

  it('reports service failures without hiding the review queue', async () => {
    mocks.invoke.mockResolvedValueOnce({ data: null, error: new Error('review service unavailable') });
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Preview PDF/i }));

    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Action failed',
      description: 'review service unavailable',
      variant: 'destructive',
    })));
  });

  it('filters out books that already have PDFs and supports searching by title or author', () => {
    renderPage();
    const search = screen.getByLabelText(/Find book/);
    fireEvent.change(search, { target: { value: 'other author' } });
    expect(screen.queryByText('Already linked')).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Find book/)).toHaveValue('other author');
  });
});
