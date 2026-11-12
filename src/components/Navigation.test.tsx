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

  it('renders Social menu with Connect & Friends, Interactive Map, Live Circles, and Discussions', async () => {
    const { fireEvent } = await import('@testing-library/react');
    render(
      <MemoryRouter initialEntries={['/']}>
        <Navigation />
      </MemoryRouter>
    );

    const socialButton = screen.getByRole('button', { name: /social/i });
    expect(socialButton).toBeInTheDocument();
    fireEvent.mouseEnter(socialButton);

    expect(screen.getByText('Connect')).toBeInTheDocument();
    expect(screen.getByText('Reading Spaces')).toBeInTheDocument();
    expect(screen.getByText('Book Talk')).toBeInTheDocument();

    // Each Social category is exposed as a named group for assistive technology.
    expect(screen.getByRole('group', { name: 'Connect' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Reading Spaces' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Book Talk' })).toBeInTheDocument();

    const friendsFeedLink = screen.getByRole('menuitem', { name: 'Friends Feed' });
    expect(friendsFeedLink).toHaveAttribute('href', '/social');

    const discoverFriendsLink = screen.getByRole('menuitem', { name: 'Discover Friends' });
    expect(discoverFriendsLink).toHaveAttribute('href', '/social?tab=friends');

    const readingGroupsLink = screen.getByRole('menuitem', { name: 'Reading Groups' });
    expect(readingGroupsLink).toHaveAttribute('href', '/groups');

    const readerMapLink = screen.getByRole('menuitem', { name: 'Reader Map' });
    expect(readerMapLink).toHaveAttribute('href', '/map');
  });

  it('keeps keyboard focus indicators on the Social trigger and submenu links', async () => {
    const { fireEvent } = await import('@testing-library/react');
    render(
      <MemoryRouter initialEntries={['/']}>
        <Navigation />
      </MemoryRouter>
    );

    const socialButton = screen.getByRole('button', { name: /social/i });
    expect(socialButton).toHaveClass('focus-visible:ring-2');
    fireEvent.mouseEnter(socialButton);

    const friendsFeedLink = screen.getByRole('menuitem', { name: 'Friends Feed' });
    expect(friendsFeedLink).toHaveClass('focus-visible:ring-2');
    expect(friendsFeedLink).toHaveClass('focus-visible:outline-none');
  });

  it('opens Social with Enter and dismisses its menu with Escape', async () => {
    const { fireEvent } = await import('@testing-library/react');
    render(
      <MemoryRouter initialEntries={['/']}>
        <Navigation />
      </MemoryRouter>
    );

    const socialButton = screen.getByRole('button', { name: /social/i });
    socialButton.focus();
    fireEvent.keyDown(socialButton, { key: 'Enter', code: 'Enter' });

    expect(socialButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menuitem', { name: 'Friends Feed' })).toBeInTheDocument();

    fireEvent.keyDown(socialButton, { key: 'Escape', code: 'Escape' });
    expect(socialButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('highlights the Reading Spaces group when a child route is active', async () => {
    const { fireEvent } = await import('@testing-library/react');
    render(
      <MemoryRouter initialEntries={['/groups']}>
        <Navigation />
      </MemoryRouter>
    );

    fireEvent.mouseEnter(screen.getByRole('button', { name: /social/i }));

    const readingSpacesHeading = screen.getByText('Reading Spaces');
    expect(readingSpacesHeading).toHaveClass('text-[hsl(var(--brand-primary))]');
    expect(screen.getByRole('menuitem', { name: 'Reading Groups' })).toHaveAttribute('aria-current', 'page');
  });

  it('renders Activity menu with interactive categories', async () => {
    const { fireEvent } = await import('@testing-library/react');
    render(
      <MemoryRouter initialEntries={['/']}>
        <Navigation />
      </MemoryRouter>
    );

    const activityButton = screen.getByRole('button', { name: /activity/i });
    expect(activityButton).toBeInTheDocument();
    fireEvent.mouseEnter(activityButton);

    expect(screen.getByText('Hub & Gatherings')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Events & Festivals' })).toBeInTheDocument();
    expect(screen.getByText('Challenges & Games')).toBeInTheDocument();

    expect(screen.getByRole('menuitem', { name: 'Activity Hub' })).toHaveAttribute('href', '/activity');
    expect(screen.getByRole('menuitem', { name: 'Events & Festivals' })).toHaveAttribute('href', '/events');
    expect(screen.getByRole('menuitem', { name: 'Reading Challenges' })).toHaveAttribute('href', '/activity?tab=challenges');
    expect(screen.getByRole('menuitem', { name: 'Book Games' })).toHaveAttribute('href', '/games');
    expect(screen.getByRole('menuitem', { name: 'Reader Meetups' })).toHaveAttribute('href', '/activity?tab=meetups');
  });
});
