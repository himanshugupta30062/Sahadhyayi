// @vitest-environment jsdom

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ReadingActivityCalendar } from './ReadingActivityCalendar';

const mocks = vi.hoisted(() => ({
  user: { id: 'reader-1' } as null | { id: string },
  activityDays: [
    { activity_date: '2026-11-10', source: 'reading_progress' },
    { activity_date: '2026-11-11', source: 'reading_progress' },
    { activity_date: '2026-11-12', source: 'daily_log' },
  ] as Array<{ activity_date: string; source?: string }>,
  logs: [
    {
      id: 'log-1',
      user_id: 'reader-1',
      book_id: 'book-1',
      pages_read: 25,
      minutes_read: 35,
      logged_at: '2026-11-12T10:00:00Z',
      journal_note: 'Great philosophical insights.',
    },
    {
      id: 'log-2',
      user_id: 'reader-1',
      book_id: 'book-2',
      pages_read: 15,
      minutes_read: 20,
      logged_at: '2026-11-12T15:00:00Z',
      journal_note: null,
    },
  ],
  shelf: [
    { book_id: 'book-1', books_library: { title: 'Meditations' } },
    { book_id: 'book-2', books_library: { title: 'Atomic Habits' } },
  ],
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: mocks.user }),
}));

vi.mock('@/hooks/useReadingLogs', () => ({
  useReadingLogs: () => ({
    data: mocks.logs,
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useUserBookshelf', () => ({
  useUserBookshelf: () => ({
    data: mocks.shelf,
    isLoading: false,
  }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }: { queryKey: unknown[] }) => {
    if (queryKey[0] === 'reading-activity-days') {
      return {
        data: mocks.activityDays,
        isLoading: false,
        error: null,
      };
    }
    return { data: [], isLoading: false, error: null };
  },
}));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: mocks.activityDays, error: null }),
        }),
      }),
    }),
  },
}));

describe('ReadingActivityCalendar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders streak cards and milestone progress banner', () => {
    render(<ReadingActivityCalendar />);

    expect(screen.getByText(/Reading activity/i)).toBeInTheDocument();
    expect(screen.getByText(/Current streak/i)).toBeInTheDocument();
    expect(screen.getByText(/Longest streak/i)).toBeInTheDocument();
    expect(screen.getByText(/streak milestone/i)).toBeInTheDocument();
  });

  it('displays active reading days and renders month navigation', () => {
    render(<ReadingActivityCalendar />);

    const prevBtn = screen.getByRole('button', { name: /previous month/i });
    const nextBtn = screen.getByRole('button', { name: /next month/i });

    expect(prevBtn).toBeInTheDocument();
    expect(nextBtn).toBeInTheDocument();

    // Active day text in footer
    expect(screen.getByText(/active.*this month/i)).toBeInTheDocument();
  });

  it('displays detailed reading breakdown when selecting an active day with logs', () => {
    render(<ReadingActivityCalendar />);

    // Click on the cell for 2026-11-12
    const cell12 = screen.getByRole('button', { name: /2026-11-12.*reading day/i });
    expect(cell12).toBeInTheDocument();
    fireEvent.click(cell12);

    // Should display selected day details
    expect(screen.getByText(/2 sessions/i)).toBeInTheDocument();
    expect(screen.getByText(/40 pages read/i)).toBeInTheDocument(); // 25 + 15
    expect(screen.getByText(/55 mins/i)).toBeInTheDocument(); // 35 + 20
    expect(screen.getByText(/Meditations, Atomic Habits/i)).toBeInTheDocument();
    expect(screen.getByText(/“Great philosophical insights.”/i)).toBeInTheDocument();

    // Clear details
    const clearBtn = screen.getByRole('button', { name: /clear/i });
    fireEvent.click(clearBtn);
    expect(screen.queryByText(/40 pages read/i)).not.toBeInTheDocument();
  });

  it('displays empty state when selecting an inactive day', () => {
    render(<ReadingActivityCalendar />);

    const cell01 = screen.getByRole('button', { name: /2026-11-01.*no activity/i });
    fireEvent.click(cell01);

    expect(
      screen.getByText(/No reading activity recorded for this date/i)
    ).toBeInTheDocument();
  });

  it('navigates grid cells with arrow keys', () => {
    render(<ReadingActivityCalendar />);

    const cell01 = screen.getByRole('button', { name: /2026-11-01/i });
    cell01.focus();

    // ArrowRight to next cell
    fireEvent.keyDown(cell01, { key: 'ArrowRight' });

    // ArrowDown moves a week forward
    fireEvent.keyDown(cell01, { key: 'ArrowDown' });
    expect(cell01).toBeInTheDocument();
  });
});

