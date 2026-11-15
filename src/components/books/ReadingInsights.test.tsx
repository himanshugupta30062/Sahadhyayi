import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ReadingInsights from './ReadingInsights';
import type { BookshelfItem } from '@/hooks/useUserBookshelf';

describe('ReadingInsights', () => {
  it('renders rating patterns and progress metrics', () => {
    const books = [
      {
        id: '1',
        book_id: 'b-1',
        status: 'completed',
        rating: 5,
        completed_at: '2026-02-01T00:00:00Z',
      },
      {
        id: '2',
        book_id: 'b-2',
        status: 'completed',
        rating: 4,
        completed_at: '2026-03-01T00:00:00Z',
      },
      {
        id: '3',
        book_id: 'b-3',
        status: 'reading',
        progress: 75,
      },
    ] as unknown as BookshelfItem[];

    render(<ReadingInsights books={books} />);

    expect(screen.getByText('Rating patterns')).toBeInTheDocument();
    expect(screen.getByText('Completion trend')).toBeInTheDocument();
    expect(screen.getByText('Reading pace right now')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });
});
