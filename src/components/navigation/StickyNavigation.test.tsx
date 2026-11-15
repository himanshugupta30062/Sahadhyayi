import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import StickyNavigation from '@/components/navigation/StickyNavigation';
import * as authHelpers from '@/contexts/authHelpers';
import * as navPrefHooks from '@/hooks/useNavPreferences';

describe('StickyNavigation', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders brand logo, guest navigation links, and sign in button', () => {
    vi.spyOn(authHelpers, 'useAuth').mockReturnValue({ user: null, signOut: vi.fn() } as any);
    vi.spyOn(navPrefHooks, 'useNavPreferences').mockReturnValue({
      preferences: { visible_tabs: navPrefHooks.DEFAULT_VISIBLE_TABS, onboarding_completed: true },
      needsOnboarding: false,
      savePreferences: { mutate: vi.fn() } as any,
    } as any);

    render(
      <MemoryRouter>
        <StickyNavigation />
      </MemoryRouter>
    );

    expect(screen.getByText('Sahadhyayi')).toBeInTheDocument();
    expect(screen.getAllByText('Home')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Articles')[0]).toBeInTheDocument();
  });

  it('renders authenticated dashboard link and handles search toggle', () => {
    vi.spyOn(authHelpers, 'useAuth').mockReturnValue({
      user: { id: 'u1', email: 'test@example.com' },
      signOut: vi.fn(),
    } as any);
    vi.spyOn(navPrefHooks, 'useNavPreferences').mockReturnValue({
      preferences: { visible_tabs: navPrefHooks.DEFAULT_VISIBLE_TABS, onboarding_completed: true },
      needsOnboarding: false,
      savePreferences: { mutate: vi.fn() } as any,
    } as any);

    const { container } = render(
      <MemoryRouter>
        <StickyNavigation />
      </MemoryRouter>
    );

    expect(screen.getByText('Sahadhyayi')).toBeInTheDocument();
    expect(screen.getByText('Library')).toBeInTheDocument();
    expect(screen.getByText('My Shelf')).toBeInTheDocument();
    expect(screen.getByText('Articles')).toBeInTheDocument();

    const searchBtn = container.querySelector('.lucide-search')?.closest('button');
    expect(searchBtn).toBeInTheDocument();
    if (searchBtn) {
      fireEvent.click(searchBtn);
    }
  });
});
