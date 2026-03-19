/** @vitest-environment jsdom */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const authState = vi.hoisted(() => ({
  user: null as null | { email?: string; user_metadata?: Record<string, unknown> },
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({
    user: authState.user,
    signOut: vi.fn(),
  }),
}));

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: undefined,
    isLoading: false,
    error: null,
  }),
}));

vi.mock('@/components/notifications/NotificationDropdown', () => ({
  NotificationDropdown: () => <div>notifications</div>,
}));

vi.mock('@/components/messages/MessageDropdown', () => ({
  MessageDropdown: () => <div>messages</div>,
}));

vi.mock('@/components/EnhancedGlobalSearch', () => ({
  EnhancedGlobalSearch: () => null,
}));

import { HeroContent } from '@/components/hero/HeroContent';
import CurrentReads from '@/components/library/CurrentReads';

describe('home navigation routes', () => {
  beforeEach(() => {
    authState.user = null;
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    );
  });

  it('sends guests to the public library from the hero CTA', () => {
    render(
      <MemoryRouter>
        <HeroContent />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /explore library/i })).toHaveAttribute('href', '/library');
  });

  it('sends signed-in readers to the dashboard from the hero CTA', () => {
    authState.user = { email: 'reader@example.com', user_metadata: {} };

    render(
      <MemoryRouter>
        <HeroContent />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /go to dashboard/i })).toHaveAttribute('href', '/dashboard');
  });

  it('uses the existing sign-in route in current reads empty state', () => {
    authState.user = null;

    render(
      <MemoryRouter>
        <CurrentReads />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/signin');
  });
});
