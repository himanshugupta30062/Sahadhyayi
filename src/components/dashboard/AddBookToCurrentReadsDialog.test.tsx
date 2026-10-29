// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mocks = vi.hoisted(() => ({
  user: { id: 'reader-123' } as null | { id: string },
  insert: vi.fn(),
  from: vi.fn(),
  toast: vi.fn(),
  invalidateQueries: vi.fn(),
}));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    from: (...args: unknown[]) => mocks.from(...args),
  },
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: mocks.user }),
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: (...args: unknown[]) => mocks.toast(...args),
}));

import AddBookToCurrentReadsDialog from './AddBookToCurrentReadsDialog';

const renderDialog = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  vi.spyOn(queryClient, 'invalidateQueries').mockImplementation(mocks.invalidateQueries);
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AddBookToCurrentReadsDialog />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const openDialog = () => {
  fireEvent.click(screen.getByRole('button', { name: /add book/i }));
};

const submitDialog = () => {
  const buttons = screen.getAllByRole('button', { name: /^add book$/i });
  fireEvent.click(buttons[buttons.length - 1]);
};

const fillRequiredFields = () => {
  fireEvent.change(screen.getByLabelText(/book title/i), {
    target: { value: '  The Dispossessed  ' },
  });
  fireEvent.change(screen.getByLabelText(/total pages/i), {
    target: { value: '341' },
  });
};

describe('AddBookToCurrentReadsDialog', () => {
  beforeEach(() => {
    mocks.user = { id: 'reader-123' };
    mocks.insert.mockReset().mockResolvedValue({ error: null });
    mocks.from.mockReset().mockReturnValue({ insert: mocks.insert });
    mocks.toast.mockReset();
    mocks.invalidateQueries.mockReset().mockResolvedValue(undefined);
    delete (window as Window & { checkReadingGoal?: () => boolean }).checkReadingGoal;
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('adds a trimmed book record, invalidates reading progress, and resets the form', async () => {
    renderDialog();
    openDialog();
    fillRequiredFields();
    fireEvent.change(screen.getByLabelText(/cover image url/i), {
      target: { value: ' https://example.com/cover.jpg ' },
    });
    submitDialog();

    await waitFor(() => {
      expect(mocks.from).toHaveBeenCalledWith('reading_progress');
      expect(mocks.insert).toHaveBeenCalledWith({
        user_id: 'reader-123',
        book_title: 'The Dispossessed',
        total_pages: 341,
        current_page: 1,
        cover_image_url: 'https://example.com/cover.jpg',
      });
    });
    expect(mocks.toast).toHaveBeenCalledWith({
      title: 'Success',
      description: 'Book added to your current reads!',
    });
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['reading-progress'],
    });
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Add Book to Current Reads' })).not.toBeInTheDocument();
    });
  });

  it('stores a missing optional cover URL as null', async () => {
    renderDialog();
    openDialog();
    fillRequiredFields();
    submitDialog();

    await waitFor(() => {
      expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({
        cover_image_url: null,
      }));
    });
  });

  it('does not submit when there is no signed-in user', async () => {
    mocks.user = null;
    renderDialog();
    openDialog();
    fillRequiredFields();
    submitDialog();

    await waitFor(() => expect(mocks.insert).not.toHaveBeenCalled());
    expect(mocks.toast).not.toHaveBeenCalled();
  });

  it('respects the reading-goal guard when it blocks adding a book', async () => {
    (window as Window & { checkReadingGoal?: () => boolean }).checkReadingGoal = vi.fn(() => false);
    renderDialog();
    openDialog();
    fillRequiredFields();
    submitDialog();

    await waitFor(() => expect(mocks.insert).not.toHaveBeenCalled());
    expect(mocks.toast).not.toHaveBeenCalled();
  });

  it('shows the Supabase error and keeps the dialog open when insertion fails', async () => {
    mocks.insert.mockResolvedValue({ error: new Error('Database unavailable') });
    renderDialog();
    openDialog();
    fillRequiredFields();
    submitDialog();

    await waitFor(() => {
      expect(mocks.toast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Database unavailable',
        variant: 'destructive',
      });
    });
    expect(screen.getByRole('heading', { name: 'Add Book to Current Reads' })).toBeInTheDocument();
  });

  it('shows a fallback message for non-Error insertion failures', async () => {
    mocks.insert.mockResolvedValue({ error: 'unexpected failure' });
    renderDialog();
    openDialog();
    fillRequiredFields();
    submitDialog();

    await waitFor(() => {
      expect(mocks.toast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to add book',
        variant: 'destructive',
      });
    });
  });

  it('allows the user to close the dialog without submitting', () => {
    renderDialog();
    openDialog();
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.queryByRole('heading', { name: 'Add Book to Current Reads' })).not.toBeInTheDocument();
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});
