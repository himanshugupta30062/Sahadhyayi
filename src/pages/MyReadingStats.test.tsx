import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import StatsPage from './MyReadingStats';

vi.mock('@/components/SEO', () => ({
  default: () => null,
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/hooks/useUserBookshelf', () => ({
  useUserBookshelf: vi.fn(),
}));

vi.mock('@/hooks/useReadingLogs', () => ({
  useReadingLogs: vi.fn(),
}));

vi.mock('@/hooks/useReadingStreak', () => ({
  useReadingStreak: vi.fn(),
}));

vi.mock('@/hooks/useReadingGoal', () => ({
  useReadingGoal: vi.fn(),
}));

const mockSupabaseUpsert = vi.fn().mockResolvedValue({ error: null });
const mockSupabaseSelect = vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnValue({
    maybeSingle: vi.fn().mockResolvedValue({
      data: { monthly_page_target: 250 },
      error: null,
    }),
  }),
});

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'reading_goals') {
        return {
          select: mockSupabaseSelect,
          upsert: mockSupabaseUpsert,
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    }),
  },
}));

import { useAuth } from '@/contexts/authHelpers';
import { useUserBookshelf } from '@/hooks/useUserBookshelf';
import { useReadingLogs } from '@/hooks/useReadingLogs';
import { useReadingStreak } from '@/hooks/useReadingStreak';
import { useReadingGoal } from '@/hooks/useReadingGoal';

describe('MyReadingStats Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders sign-in message when user is not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null } as any);
    vi.mocked(useUserBookshelf).mockReturnValue({ data: [], isLoading: false } as any);
    vi.mocked(useReadingLogs).mockReturnValue({ data: [], isLoading: false } as any);
    vi.mocked(useReadingStreak).mockReturnValue({ data: { current: 0, best: 0 } } as any);
    vi.mocked(useReadingGoal).mockReturnValue({ goal: 12, currentYear: 2026, setGoal: vi.fn() } as any);

    render(
      <MemoryRouter>
        <StatsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Your reading stats')).toBeInTheDocument();
    expect(screen.getByText('Sign in to see your personal reading insights.')).toBeInTheDocument();
  });

  it('renders full stats, breakdown, streak, and trend when authenticated', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'usr-123' } } as any);
    const mockShelf = [
      {
        id: 'b1',
        status: 'completed',
        rating: 5,
        completed_at: '2026-03-15T12:00:00Z',
        books_library: { title: 'Dune', author: 'Frank Herbert', genre: 'Sci-Fi' },
      },
      {
        id: 'b2',
        status: 'reading',
        books_library: { title: 'Neuromancer', author: 'William Gibson', genre: 'Cyberpunk' },
      },
      {
        id: 'b3',
        status: 'want_to_read',
        books_library: { title: 'Foundation', author: 'Isaac Asimov', genre: 'Sci-Fi' },
      },
      {
        id: 'b4',
        status: 'dnf',
        books_library: { title: 'Ulysses', author: 'James Joyce', genre: 'Classic' },
      },
    ];
    vi.mocked(useUserBookshelf).mockReturnValue({ data: mockShelf, isLoading: false } as any);

    const today = new Date().toISOString();
    const mockLogs = [
      { id: 'l1', logged_at: today, pages_read: 30, minutes_read: 45, journal_note: 'Great chapter' },
      { id: 'l2', logged_at: today, pages_read: 20, minutes_read: 25, journal_note: null },
    ];
    vi.mocked(useReadingLogs).mockReturnValue({ data: mockLogs, isLoading: false } as any);
    vi.mocked(useReadingStreak).mockReturnValue({ data: { current: 4, best: 14 } } as any);
    const mockSetGoal = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useReadingGoal).mockReturnValue({ goal: 20, currentYear: 2026, setGoal: mockSetGoal } as any);

    render(
      <MemoryRouter>
        <StatsPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'My Reading Stats' })).toBeInTheDocument();

    // Verify shelf counts
    expect(screen.getByText('Books finished')).toBeInTheDocument();
    expect(screen.getByText('Currently reading')).toBeInTheDocument();
    expect(screen.getByText('Want to read')).toBeInTheDocument();
    expect(screen.getByText('Did not finish')).toBeInTheDocument();

    // Verify streak stats
    expect(screen.getByText('Best: 14 days')).toBeInTheDocument();

    // Verify Achievements
    expect(screen.getByText('First Chapter')).toBeInTheDocument();

    // Test trend range button toggle
    const twelveMonthsBtn = screen.getByRole('button', { name: '12 months' });
    fireEvent.click(twelveMonthsBtn);
    expect(twelveMonthsBtn).toHaveClass('bg-primary');

    // Test reading goals edit and save
    const editGoalsBtn = screen.getByRole('button', { name: /edit goals/i });
    fireEvent.click(editGoalsBtn);

    const saveTargetsBtn = screen.getByRole('button', { name: /save targets/i });
    fireEvent.click(saveTargetsBtn);

    await waitFor(() => {
      expect(mockSupabaseUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'usr-123',
          annual_book_target: 20,
        }),
        expect.anything()
      );
    });
  });
});
