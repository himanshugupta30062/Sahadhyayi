// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navigation from './Navigation';

const authState = vi.hoisted(() => ({
  user: null as null | { id: string; email?: string; user_metadata?: Record<string, unknown> },
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({
    user: authState.user,
    signOut: vi.fn(),
  }),
}));

vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    toggleTheme: vi.fn(),
  }),
}));

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('@/components/EnhancedGlobalSearch', () => ({
  EnhancedGlobalSearch: () => null,
}));

vi.mock('@/components/messages/MessageDropdown', () => ({
  MessageDropdown: () => <div data-testid="message-dropdown" />,
}));

vi.mock('@/components/notifications/NotificationDropdown', () => ({
  NotificationDropdown: () => <div data-testid="notification-dropdown" />,
}));

vi.mock('@/components/ContactFormDialog', () => ({
  default: () => null,
}));

vi.mock('@/components/AuthenticatedUserDropdown', () => ({
  default: () => <div data-testid="user-dropdown" />,
}));

vi.mock('@/components/ui/sidebar', () => ({
  SidebarTrigger: () => <button aria-label="Toggle left navigation" />,
}));

describe('Primary Navigation (5 core sections)', () => {
  beforeEach(() => {
    authState.user = null;
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the 5 primary navigation items for visitors: Home, Library, Authors, Social, Activity', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Navigation />
      </MemoryRouter>
    );

    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    expect(nav).toBeInTheDocument();

    // 1. Home
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();

    // 2. Library
    expect(screen.getByRole('button', { name: /library/i })).toBeInTheDocument();

    // 3. Authors
    expect(screen.getByRole('button', { name: /authors/i })).toBeInTheDocument();

    // 4. Social
    expect(screen.getByRole('button', { name: /social/i })).toBeInTheDocument();

    // 5. Activity
    expect(screen.getByRole('button', { name: /activity/i })).toBeInTheDocument();
  });

  it('renders Dashboard as Home for authenticated readers alongside Library, Authors, Social, Activity', () => {
    authState.user = { id: 'u1', email: 'reader@example.com', user_metadata: { full_name: 'Test Reader' } };

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Navigation />
      </MemoryRouter>
    );

    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    expect(nav).toBeInTheDocument();

    // 1. Home (Dashboard)
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();

    // 2. Library
    expect(screen.getByRole('button', { name: /library/i })).toBeInTheDocument();

    // 3. Authors
    expect(screen.getByRole('button', { name: /authors/i })).toBeInTheDocument();

    // 4. Social
    expect(screen.getByRole('button', { name: /social/i })).toBeInTheDocument();

    // 5. Activity
    expect(screen.getByRole('button', { name: /activity/i })).toBeInTheDocument();
  });
});
