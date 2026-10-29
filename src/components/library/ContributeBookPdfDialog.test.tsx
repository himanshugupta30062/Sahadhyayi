// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ContributeBookPdfDialog from '@/components/library/ContributeBookPdfDialog';

const mocks = vi.hoisted(() => ({
  user: { id: 'reader-1' } as { id: string } | null,
  toast: vi.fn(),
  insert: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
  upload: vi.fn(),
  invalidateQueries: vi.fn(),
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: mocks.user }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
  useQuery: () => ({ data: [], isLoading: false }),
}));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    from: () => ({
      insert: mocks.insert,
      select: mocks.select,
      eq: mocks.eq,
      order: mocks.order,
      limit: mocks.limit,
    }),
    storage: {
      from: () => ({ upload: mocks.upload }),
    },
  },
}));

const makePdf = (name = 'sample.pdf', bytes = '%PDF-1.7 test body', type = 'application/pdf') =>
  new File([bytes], name, { type });

function renderDialog() {
  render(<ContributeBookPdfDialog />);
  fireEvent.click(screen.getByRole('button', { name: /Contribute a PDF/i }));
}

beforeEach(() => {
  mocks.user = { id: 'reader-1' };
  mocks.toast.mockReset();
  mocks.insert.mockReset().mockResolvedValue({ error: null });
  mocks.select.mockReset();
  mocks.eq.mockReset();
  mocks.order.mockReset();
  mocks.limit.mockReset().mockResolvedValue({ data: [], error: null });
  mocks.upload.mockReset().mockResolvedValue({ error: null });
  mocks.invalidateQueries.mockReset().mockResolvedValue(undefined);
  mocks.select.mockReturnValue({ eq: mocks.eq });
  mocks.eq.mockReturnValue({ order: mocks.order });
  mocks.order.mockReturnValue({ limit: mocks.limit });
  vi.stubGlobal('crypto', { ...globalThis.crypto, randomUUID: () => 'submission-uuid' });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('ContributeBookPdfDialog', () => {
  it('prompts signed-out visitors to sign in and does not expose the upload form', () => {
    mocks.user = null;
    renderDialog();

    expect(screen.getByText(/Sign in to submit a PDF/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/PDF file/i)).not.toBeInTheDocument();
  });

  it('requires a rights attestation before enabling submission', () => {
    renderDialog();

    expect(screen.getByRole('button', { name: /Submit for verification/i })).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/PDF file/i), {
      target: { files: [makePdf()] },
    });
    expect(screen.getByRole('button', { name: /Submit for verification/i })).toBeDisabled();
  });

  it('rejects a file without a PDF signature before writing or uploading', async () => {
    renderDialog();
    fireEvent.change(screen.getByLabelText(/PDF file/i), {
      target: { files: [makePdf('not-a-pdf.pdf', 'NOTPDF')] },
    });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Submit for verification/i }));

    expect(await screen.findByText(/valid PDF signature/i)).toBeInTheDocument();
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it('creates an owner-scoped submission and uploads only to the quarantine bucket', async () => {
    renderDialog();
    fireEvent.change(screen.getByLabelText(/PDF file/i), {
      target: { files: [makePdf()] },
    });
    fireEvent.change(screen.getByLabelText(/Book title/i), {
      target: { value: 'A Test Book' },
    });
    fireEvent.change(screen.getByLabelText(/Author/i), {
      target: { value: 'A Test Author' },
    });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Submit for verification/i }));

    await waitFor(() => expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({
      id: 'submission-uuid',
      user_id: 'reader-1',
      storage_path: 'reader-1/submission-uuid/source.pdf',
      rights_attested: true,
      status: 'uploaded',
      submitted_title: 'A Test Book',
      submitted_author: 'A Test Author',
    })));
    await waitFor(() => expect(mocks.upload).toHaveBeenCalledWith(
      'reader-1/submission-uuid/source.pdf',
      expect.any(File),
      expect.objectContaining({ contentType: 'application/pdf', upsert: false }),
    ));
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'PDF submitted privately',
    }));
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['my-book-pdf-submissions', 'reader-1'],
    });
  });

  it('does not upload when the database submission insert fails', async () => {
    mocks.insert.mockResolvedValueOnce({ error: new Error('database unavailable') });
    renderDialog();
    fireEvent.change(screen.getByLabelText(/PDF file/i), {
      target: { files: [makePdf()] },
    });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /Submit for verification/i }));

    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Submission failed',
    })));
    expect(mocks.upload).not.toHaveBeenCalled();
  });
});
