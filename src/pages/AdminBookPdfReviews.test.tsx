// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

const mocks = vi.hoisted(() => ({
  submissions: [] as any[],
  queueLoading: false,
  queueError: null as unknown,
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
    return { data: mocks.submissions, isLoading: mocks.queueLoading, isFetching: false, error: mocks.queueError };
  },
}));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    from: (table: string) => {
      mocks.from(table);
      const query: any = {
        select: (...args: unknown[]) => { mocks.select(...args); return query; },
        order: (...args: unknown[]) => { mocks.order(...args); return query; },
        limit: (...args: unknown[]) => { mocks.limit(...args); return Promise.resolve({ data: mocks.submissions, error: null }); },
      };
      return query;
    },
    functions: { invoke: (...args: unknown[]) => mocks.invoke(...args) },
  },
}));

vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock('@/components/SEO', () => ({ default: () => null }));

import AdminBookPdfReviews from '@/pages/AdminBookPdfReviews';

const submission = (overrides: Record<string, unknown> = {}) => ({
  id: 'submission-1',
  original_filename: 'source.pdf',
  file_size_bytes: 2 * 1024 * 1024,
  submitted_title: 'A Test Book',
  submitted_author: 'A Test Author',
  status: 'needs_review',
  rejection_reason: null,
  created_at: '2026-10-20T12:00:00Z',
  published_book_id: null,
  ...overrides,
});

const renderPage = () => render(<AdminBookPdfReviews />);

describe('AdminBookPdfReviews', () => {
  beforeEach(() => {
    mocks.submissions = [submission()];
    mocks.queueLoading = false;
    mocks.queueError = null;
    mocks.queryOptions = [];
    mocks.invoke.mockReset().mockResolvedValue({ data: { success: true, status: 'approved', targetBookId: 'book-1', pdfUrl: 'https://storage.example/book.pdf' }, error: null });
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

  it('renders empty, loading and error states', () => {
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

  it('loads the admin queue', async () => {
    renderPage();
    const queueQuery = mocks.queryOptions.find((item) => item.queryKey[0] === 'admin-book-pdf-review-queue');
    expect(queueQuery).toBeDefined();
    if (queueQuery) await expect(queueQuery.queryFn()).resolves.toEqual(mocks.submissions);
    expect(mocks.from).toHaveBeenCalledWith('book_pdf_submissions');
    expect(mocks.limit).toHaveBeenCalledWith(200);
  });

  it('keeps approved-but-unpublished submissions in Pending and offers a publication retry', () => {
    mocks.submissions = [submission({ status: 'approved', published_book_id: null })];
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Pending', exact: true }));
    expect(screen.getAllByText('approved · publication incomplete')[0]).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retry Library publication/i })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Published', exact: true }));
    expect(screen.getByText('No matching submissions')).toBeInTheDocument();
  });

  it('does not report approval as published unless the server returns a book ID and PDF URL', async () => {
    vi.spyOn(window, 'open').mockImplementation(() => ({} as Window));
    mocks.invoke
      .mockResolvedValueOnce({ data: { url: 'https://signed.example/preview' }, error: null })
      .mockResolvedValueOnce({ data: { success: true, status: 'approved' }, error: null });
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /View PDF/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Approve & Add to Library/i })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: /Approve & Add to Library/i }));

    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Action failed',
      description: expect.stringMatching(/publication could not be confirmed/i),
      variant: 'destructive',
    })));
  });

  it('requires a private preview before enabling approval', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => ({} as Window));
    renderPage();
    const approve = screen.getByRole('button', { name: /Approve & Add to Library/i });
    expect(approve).toBeDisabled();

    mocks.invoke.mockResolvedValueOnce({ data: { url: 'https://signed.example/preview' }, error: null });
    fireEvent.click(screen.getByRole('button', { name: /View PDF/i }));
    await waitFor(() => expect(open).toHaveBeenCalledWith('https://signed.example/preview', '_blank', 'noopener,noreferrer'));
    expect(approve).toBeEnabled();
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Private PDF preview opened' }));
  });

  it('keeps approval available and exposes a secure link and inline preview when the preview popup is blocked', async () => {
    vi.spyOn(window, 'open').mockImplementation(() => null);
    mocks.invoke.mockResolvedValueOnce({ data: { url: 'https://signed.example/preview' }, error: null });
    renderPage();
    const approve = screen.getByRole('button', { name: /Approve & Add to Library/i });
    expect(approve).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /View PDF/i }));
    await waitFor(() => expect(screen.getByRole('link', { name: /Open PDF preview/i })).toHaveAttribute('href', 'https://signed.example/preview'));
    expect(approve).toBeEnabled();
    expect(screen.getByTitle(/Private PDF Preview/i)).toBeInTheDocument();
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Preview link ready',
      description: expect.stringMatching(/browser blocked/i),
    }));
  });

  it('publishes in one approval action after previewing', async () => {
    vi.spyOn(window, 'open').mockImplementation(() => ({} as Window));
    mocks.invoke.mockResolvedValueOnce({ data: { url: 'https://signed.example/preview' }, error: null });
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /View PDF/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Approve & Add to Library/i })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: /Approve & Add to Library/i }));

    await waitFor(() => expect(mocks.invoke).toHaveBeenLastCalledWith('review-book-pdf', {
      body: { submissionId: 'submission-1', action: 'approve' },
    }));
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Added to Library' }));
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['books'] });
  });

  it('requires a rejection reason and submits reject action', async () => {
    renderPage();
    const reason = screen.getByLabelText(/Rejection reason/i);
    fireEvent.change(reason, { target: { value: 'The file is incomplete.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }));
    await waitFor(() => expect(mocks.invoke).toHaveBeenCalledWith('review-book-pdf', {
      body: { submissionId: 'submission-1', action: 'reject', reason: 'The file is incomplete.' },
    }));
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Submission rejected' }));
  });

  it('shows already-published submissions without review actions', () => {
    mocks.submissions = [submission({ status: 'approved', published_book_id: 'book-1' })];
    renderPage();
    expect(screen.getByText('This PDF is live in the Library.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Approve & Add to Library/i })).not.toBeInTheDocument();
  });

  it('extracts a useful message from a JSON function error', async () => {
    const responseError = Object.assign(new Error('Edge Function returned a non-2xx status code'), {
      context: new Response(JSON.stringify({ error: 'The reviewer role is required.' }), {
        status: 403,
        headers: { 'content-type': 'application/json' },
      }),
    });
    mocks.invoke.mockResolvedValueOnce({ data: null, error: responseError });
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /View PDF/i }));
    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Action failed',
      description: 'The reviewer role is required.',
      variant: 'destructive',
    })));
  });

  it('filters submissions by search query and status', () => {
    mocks.submissions = [
      submission({ id: 'sub-1', submitted_title: 'Alice in Wonderland', status: 'uploaded' }),
      submission({ id: 'sub-2', submitted_title: 'Frankenstein', status: 'rejected' }),
      submission({ id: 'sub-3', submitted_title: 'Moby Dick', status: 'approved', published_book_id: 'book-moby' }),
    ];
    renderPage();

    // Default shows all
    expect(screen.getAllByText('Alice in Wonderland').length).toBeGreaterThan(0);
    expect(screen.getByText('Frankenstein')).toBeInTheDocument();
    expect(screen.getByText('Moby Dick')).toBeInTheDocument();

    // Search filter
    const searchInput = screen.getByPlaceholderText(/Search by title, author, user ID or filename/i);
    fireEvent.change(searchInput, { target: { value: 'Frank' } });
    expect(screen.getAllByText('Frankenstein').length).toBeGreaterThan(0);
    expect(screen.queryByText('Alice in Wonderland')).not.toBeInTheDocument();

    // Clear search and test status filter button
    fireEvent.change(searchInput, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Rejected' }));
    expect(screen.getAllByText('Frankenstein').length).toBeGreaterThan(0);
    expect(screen.queryByText('Alice in Wonderland')).not.toBeInTheDocument();
  });

  it('runs queue health audit and reconciliation', async () => {
    mocks.invoke.mockImplementation((fn: string, options: any) => {
      if (options?.body?.action === 'audit_queue') {
        return Promise.resolve({
          data: {
            success: true,
            totalAudited: 1,
            issues: [
              {
                submissionId: 'sub-1',
                title: 'Alice in Wonderland',
                type: 'unlinked_published',
                message: 'Submission approved but missing pdf_url',
                autoFixable: true,
              },
            ],
          },
          error: null,
        });
      }
      if (options?.body?.action === 'reconcile_queue') {
        return Promise.resolve({
          data: { success: true, fixedCount: 1 },
          error: null,
        });
      }
      return Promise.resolve({ data: { success: true }, error: null });
    });

    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Queue Health & Audit/i }));

    await waitFor(() => {
      expect(screen.getByText(/Queue Health & Reconciliation Report/i)).toBeInTheDocument();
      expect(screen.getByText(/Submission approved but missing pdf_url/i)).toBeInTheDocument();
    });

    const reconcileBtn = screen.getByRole('button', { name: /Run Safe Reconciliation/i });
    fireEvent.click(reconcileBtn);

    await waitFor(() => {
      expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Reconciliation complete',
        description: 'Successfully resolved 1 discrepancy records.',
      }));
    });
  });
});
