// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ReadingTracker from './ReadingTracker';

const mockMutate = vi.fn();

vi.mock('@/hooks/useReadingProgress', () => ({
  useReadingProgress: () => ({
    data: [
      {
        id: 1,
        book_title: 'Dune',
        total_pages: 500,
        current_page: 150,
      },
    ],
    isLoading: false,
  }),
  useUpdateReadingProgress: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

describe('ReadingTracker', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
    mockMutate.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders progress and triggers update mutation on button click', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ReadingTracker userId="user-1" />
      </QueryClientProvider>,
    );

    expect(screen.getByText('Dune')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText(/of 500/i)).toBeInTheDocument();

    // Click Increase page button
    const increaseBtn = screen.getByRole('button', { name: /increase page/i });
    fireEvent.click(increaseBtn);

    expect(mockMutate).toHaveBeenCalledWith({
      id: 1,
      current_page: 151,
    });
  });
});
