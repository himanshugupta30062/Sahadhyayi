// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BookSeriesSection } from './BookSeriesSection';

const mockSeriesData = {
  series: {
    id: 'series-dune-chronicles',
    name: 'Dune Chronicles',
    totalVolumes: 3,
    volumes: [
      {
        bookId: 'book-1',
        title: 'Dune',
        author: 'Frank Herbert',
        seriesName: 'Dune Chronicles',
        sequenceNumber: 1,
        rawSequence: '1',
        isCurrentBook: true,
      },
      {
        bookId: 'book-2',
        title: 'Dune Messiah',
        author: 'Frank Herbert',
        seriesName: 'Dune Chronicles',
        sequenceNumber: 2,
        rawSequence: '2',
        isCurrentBook: false,
      },
      {
        bookId: 'book-3',
        title: 'Children of Dune',
        author: 'Frank Herbert',
        seriesName: 'Dune Chronicles',
        sequenceNumber: 3,
        rawSequence: '3',
        isCurrentBook: false,
      },
    ],
  },
  prevVolume: null,
  nextVolume: {
    bookId: 'book-2',
    title: 'Dune Messiah',
    author: 'Frank Herbert',
    seriesName: 'Dune Chronicles',
    sequenceNumber: 2,
    isCurrentBook: false,
  },
  isLoading: false,
  isStandalone: false,
};

let mockHookReturn = { ...mockSeriesData };

vi.mock('@/hooks/useBookSeries', () => ({
  useBookSeries: () => mockHookReturn,
}));

describe('BookSeriesSection', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    mockHookReturn = { ...mockSeriesData };
  });

  afterEach(() => {
    cleanup();
  });

  const renderComponent = (book: any) =>
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <BookSeriesSection book={book} />
        </BrowserRouter>
      </QueryClientProvider>,
    );

  it('renders series header, sequence indicator, next volume link and volumes', () => {
    renderComponent({
      id: 'book-1',
      title: 'Dune (Dune Chronicles, #1)',
      author: 'Frank Herbert',
    });

    expect(screen.getByRole('region', { name: /book series navigation/i })).toBeInTheDocument();
    expect(screen.getByText('Dune Chronicles')).toBeInTheDocument();
    expect(screen.getByText(/Book 1 of 3/i)).toBeInTheDocument();
    expect(screen.getByText(/Next Book →/i)).toBeInTheDocument();
    expect(screen.getAllByText('Dune Messiah').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Children of Dune')).toBeInTheDocument();
    expect(screen.getByText(/Current Edition/i)).toBeInTheDocument();
  });

  it('renders nothing when the book is standalone', () => {
    mockHookReturn = {
      series: null,
      prevVolume: null,
      nextVolume: null,
      isLoading: false,
      isStandalone: true,
    };

    const { container } = renderComponent({
      id: 'book-solo',
      title: 'A Standalone Masterpiece',
      author: 'Solo Author',
    });

    expect(container.firstChild).toBeNull();
  });

  it('renders previous volume link when available', () => {
    mockHookReturn = {
      ...mockSeriesData,
      prevVolume: {
        bookId: 'book-1',
        title: 'Dune',
        author: 'Frank Herbert',
        seriesName: 'Dune Chronicles',
        sequenceNumber: 1,
        isCurrentBook: false,
      },
      nextVolume: {
        bookId: 'book-3',
        title: 'Children of Dune',
        author: 'Frank Herbert',
        seriesName: 'Dune Chronicles',
        sequenceNumber: 3,
        isCurrentBook: false,
      },
    };

    renderComponent({
      id: 'book-2',
      title: 'Dune Messiah (Dune Chronicles, #2)',
      author: 'Frank Herbert',
    });

    expect(screen.getByText(/← Previous Book/i)).toBeInTheDocument();
    expect(screen.getByText(/Next Book →/i)).toBeInTheDocument();
  });
});
