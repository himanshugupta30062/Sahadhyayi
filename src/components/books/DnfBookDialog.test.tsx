// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DnfBookDialog from './DnfBookDialog';
import { BookshelfItem } from '@/hooks/useUserBookshelf';

const mutateMock = vi.fn();

vi.mock('@/hooks/useUserBookshelf', async () => {
  const actual = await vi.importActual<any>('@/hooks/useUserBookshelf');
  return {
    ...actual,
    useMarkAsDnf: () => ({
      mutate: mutateMock,
      isPending: false,
    }),
  };
});

describe('DnfBookDialog', () => {
  let queryClient: QueryClient;

  const mockItem: BookshelfItem = {
    id: 'shelf-100',
    user_id: 'user-1',
    book_id: 'book-100',
    status: 'reading',
    added_at: '2026-11-01T00:00:00.000Z',
    books_library: {
      id: 'book-100',
      title: 'The Great Indian Novel',
      author: 'Shashi Tharoor',
      pages: 420,
    },
  };

  beforeEach(() => {
    queryClient = new QueryClient();
    mutateMock.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders book details and initial stopped page', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <DnfBookDialog
          open={true}
          onOpenChange={vi.fn()}
          bookshelfItem={mockItem}
          currentPage={120}
          totalPages={420}
        />
      </QueryClientProvider>
    );

    expect(screen.getByText('Did Not Finish (DNF)')).toBeInTheDocument();
    expect(screen.getByText(/The Great Indian Novel/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('120')).toBeInTheDocument();
  });

  it('submits DNF mutation with stopped page and reflection note', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <DnfBookDialog
          open={true}
          onOpenChange={vi.fn()}
          bookshelfItem={mockItem}
          currentPage={150}
          totalPages={420}
        />
      </QueryClientProvider>
    );

    const notesTextarea = screen.getByPlaceholderText(/What didn't work for you/i);
    fireEvent.change(notesTextarea, { target: { value: 'Could not connect with characters' } });

    const submitBtn = screen.getByRole('button', { name: /Move to DNF/i });
    fireEvent.click(submitBtn);

    expect(mutateMock).toHaveBeenCalledTimes(1);
    expect(mutateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'shelf-100',
        dnf_page: 150,
        dnf_notes: 'Could not connect with characters',
      }),
      expect.any(Object)
    );
  });
});
