// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import DnfAnalyticsCard from './DnfAnalyticsCard';
import { BookshelfItem } from '@/hooks/useUserBookshelf';

describe('DnfAnalyticsCard', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders nothing when there are no DNF books', () => {
    const { container } = render(<DnfAnalyticsCard dnfBooks={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders DNF insights with average stop point and top reason', () => {
    const mockDnfBooks: BookshelfItem[] = [
      {
        id: '1',
        user_id: 'u1',
        book_id: 'b1',
        status: 'dnf',
        added_at: '2026-11-01T00:00:00Z',
        dnf_page: 50,
        dnf_reason: 'pacing_too_slow',
        books_library: { id: 'b1', title: 'Book 1', pages: 200 },
      },
      {
        id: '2',
        user_id: 'u1',
        book_id: 'b2',
        status: 'dnf',
        added_at: '2026-11-02T00:00:00Z',
        dnf_page: 100,
        dnf_reason: 'pacing_too_slow',
        books_library: { id: 'b2', title: 'Book 2', pages: 200 },
      },
    ];

    render(<DnfAnalyticsCard dnfBooks={mockDnfBooks} />);

    expect(screen.getByText('DNF Insights & Reading Habits')).toBeInTheDocument();
    expect(screen.getByText(/2 books set aside/i)).toBeInTheDocument();
    expect(screen.getByText(/Avg. Stop Point:/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Pacing too slow/i).length).toBeGreaterThanOrEqual(1);
  });
});
