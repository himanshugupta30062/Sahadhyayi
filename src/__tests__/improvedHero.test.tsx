/** @vitest-environment jsdom */

import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const bookCountState = vi.hoisted(() => ({
  data: undefined as number | null | undefined,
  isLoading: false,
  isError: false,
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock('@/components/SignInLink', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/hooks/useLibraryBookCount', () => ({
  useLibraryBookCount: () => bookCountState,
}));

import ImprovedHero from '@/components/hero/ImprovedHero';

afterEach(() => {
  cleanup();
  bookCountState.data = undefined;
  bookCountState.isLoading = false;
  bookCountState.isError = false;
});

const renderHero = () =>
  render(
    <MemoryRouter>
      <ImprovedHero />
    </MemoryRouter>,
  );

describe('ImprovedHero Books Available metric', () => {
  it('shows the exact library count with locale formatting', () => {
    bookCountState.data = 12543;

    renderHero();

    expect(screen.getByText('12,543')).toBeInTheDocument();
  });

  it('does not show a fabricated count while loading', () => {
    bookCountState.data = 12500;
    bookCountState.isLoading = true;

    renderHero();

    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.queryByText('12,500+')).not.toBeInTheDocument();
  });

  it('does not show a fabricated count when the count query fails', () => {
    bookCountState.data = 12500;
    bookCountState.isError = true;

    renderHero();

    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.queryByText('12,500+')).not.toBeInTheDocument();
  });
});
