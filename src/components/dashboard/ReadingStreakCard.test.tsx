// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

const mocks = vi.hoisted(() => ({
  data: null as null | {
    current: number;
    best: number;
    daysThisWeek: number;
    lastActiveAt: string | null;
  },
  isLoading: false,
}));

vi.mock('@/hooks/useReadingStreak', () => ({
  useReadingStreak: () => ({ data: mocks.data, isLoading: mocks.isLoading }),
}));

import ReadingStreakCard from './ReadingStreakCard';

describe('ReadingStreakCard', () => {
  beforeEach(() => {
    mocks.data = { current: 0, best: 0, daysThisWeek: 0, lastActiveAt: null };
    mocks.isLoading = false;
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows a loading placeholder until streak data is ready', () => {
    mocks.isLoading = true;
    render(<ReadingStreakCard />);

    expect(screen.getByRole('heading', { name: 'Reading Streak' })).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders current and best streaks and highlights the active days', () => {
    mocks.data = {
      current: 1,
      best: 6,
      daysThisWeek: 5,
      lastActiveAt: new Date().toISOString(),
    };
    render(<ReadingStreakCard />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('day in a row')).toBeInTheDocument();
    expect(screen.getByText('6', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText('Active today')).toBeInTheDocument();
    expect(screen.getAllByText('✓')).toHaveLength(5);
  });

  it('uses plural wording and prompts the reader when they have not read today', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    mocks.data = {
      current: 3,
      best: 8,
      daysThisWeek: 2,
      lastActiveAt: yesterday.toISOString(),
    };
    render(<ReadingStreakCard />);

    expect(screen.getByText('days in a row')).toBeInTheDocument();
    expect(screen.getByText('Read today to keep it alive')).toBeInTheDocument();
    expect(screen.getAllByText('✓')).toHaveLength(2);
  });
});
