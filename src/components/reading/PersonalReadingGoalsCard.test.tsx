// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import PersonalReadingGoalsCard from './PersonalReadingGoalsCard';

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: { id: 'u1' } }),
}));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    from: () => ({
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}));

describe('PersonalReadingGoalsCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders goals and pace targets', () => {
    render(
      <PersonalReadingGoalsCard
        completedThisYear={4}
        initialAnnualGoal={12}
        initialMonthlyPagesTarget={300}
        monthPages={150}
        weekMinutes={90}
      />
    );

    expect(screen.getByText(/Reading Goals/i)).toBeInTheDocument();
    expect(screen.getByText('4 / 12')).toBeInTheDocument();
    expect(screen.getByText('150 / 300')).toBeInTheDocument();
  });

  it('toggles edit mode when Edit Goals is clicked', () => {
    render(
      <PersonalReadingGoalsCard
        completedThisYear={4}
        initialAnnualGoal={12}
        initialMonthlyPagesTarget={300}
        monthPages={150}
        weekMinutes={90}
      />
    );

    const editBtn = screen.getByRole('button', { name: /Edit Goals/i });
    fireEvent.click(editBtn);

    expect(screen.getByLabelText(/Annual Books Target/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Monthly Pages Target/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save Targets/i })).toBeInTheDocument();
  });
});
