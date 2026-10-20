/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach } from 'vitest';
import Navigation from '@/components/Navigation';
import Dashboard from '@/pages/Dashboard';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { MessageDropdown } from '@/components/messages/MessageDropdown';

// Mock contexts and hooks
let mockUser: any = {
  id: 'user-123',
  email: 'reader@example.com',
  user_metadata: {
    full_name: 'Test Reader',
    avatar_url: 'https://example.com/avatar.jpg',
  },
};
const mockSignOut = vi.fn().mockResolvedValue({});

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({
    user: mockUser,
    signOut: mockSignOut,
    loading: false,
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

let mockUnreadNotifications = 3;
const mockNotificationsList: any[] = [];
vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: () => ({ data: mockNotificationsList }),
  useUnreadNotificationsCount: () => ({ data: mockUnreadNotifications }),
  useMarkNotificationAsRead: () => ({ mutate: vi.fn() }),
  useMarkAllNotificationsAsRead: () => ({ mutate: vi.fn() }),
}));

let mockUnreadMessages = 2;
const mockMessagesList: any[] = [];
vi.mock('@/hooks/useMessages', () => ({
  useUnreadMessages: () => ({ data: mockMessagesList }),
  useUnreadMessagesCount: () => ({ data: mockUnreadMessages }),
  useMarkMessagesAsRead: () => ({ mutate: vi.fn() }),
  useMarkAllMessagesAsRead: () => ({ mutate: vi.fn() }),
}));

let mockBookshelfItems: any[] = [];
vi.mock('@/hooks/useUserBookshelf', () => ({
  useUserBookshelf: () => ({ data: mockBookshelfItems, isLoading: false, error: null }),
  useUpdateBookshelfItem: () => ({ mutate: vi.fn() }),
  useAddToBookshelf: () => ({ mutate: vi.fn() }),
}));

vi.mock('@/hooks/useProfile', () => ({
  useProfile: () => ({
    data: { id: 'user-123', full_name: 'Test Reader' },
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useUserGroups', () => ({
  useUserJoinedGroups: () => ({ data: [] }),
}));

vi.mock('@/hooks/useReadingGoal', () => ({
  useReadingGoal: () => ({
    goal: 12,
    setGoal: vi.fn(),
    currentYear: 2026,
  }),
}));

vi.mock('@/hooks/useReadingStreak', () => ({
  useReadingStreak: () => ({
    data: { current: 5, best: 14, daysThisWeek: 4, lastActiveAt: new Date().toISOString() },
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useReadingProgress', () => ({
  useReadingProgress: () => ({ data: [] }),
}));

vi.mock('@/hooks/useReadingRoom', () => ({
  useReadingRooms: () => ({ data: [], isLoading: false }),
}));

vi.mock('@/hooks/useCommunityStats', () => ({
  useCommunityStats: () => ({
    stats: { totalSignups: 1540 },
  }),
}));

vi.mock('@/hooks/useBookRecommendations', () => ({
  useBookRecommendations: () => ({
    data: [],
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useLibraryBooks', () => ({
  useLibraryBooks: () => ({
    data: [],
    isLoading: false,
  }),
}));

vi.mock('@/lib/analytics', () => ({
  trackUiEvent: vi.fn(),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

const renderWithProviders = (ui: React.ReactElement, initialEntries = ['/']) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Authenticated App Shell & Dashboard (Phase 4)', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    );
    mockUser = {
      id: 'user-123',
      email: 'reader@example.com',
      user_metadata: {
        full_name: 'Test Reader',
        avatar_url: 'https://example.com/avatar.jpg',
      },
    };
    mockUnreadNotifications = 3;
    mockUnreadMessages = 2;
    mockBookshelfItems = [];
  });

  describe('Navigation & Active State Highlighting', () => {
    it('renders all authenticated navigation items', () => {
      renderWithProviders(<Navigation />, ['/dashboard']);

      expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Library' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Articles' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Games' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Authors' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Social Media' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'My Books' })).toBeInTheDocument();
    });

    it('sets aria-current="page" on Home when on /dashboard', () => {
      renderWithProviders(<Navigation />, ['/dashboard']);

      const homeLink = screen.getByRole('link', { name: 'Home' });
      expect(homeLink).toHaveAttribute('aria-current', 'page');

      const articlesLink = screen.getByRole('link', { name: 'Articles' });
      expect(articlesLink).not.toHaveAttribute('aria-current');
    });

    it('correctly sets parent active state on nested routes like /articles/my', () => {
      renderWithProviders(<Navigation />, ['/articles/my']);

      const articlesLink = screen.getByRole('link', { name: 'Articles' });
      expect(articlesLink).toHaveAttribute('aria-current', 'page');

      const homeLink = screen.getByRole('link', { name: 'Home' });
      expect(homeLink).not.toHaveAttribute('aria-current');
    });

    it('correctly sets parent active state on nested author routes like /authors/premchand', () => {
      renderWithProviders(<Navigation />, ['/authors/premchand']);

      const authorsLink = screen.getByRole('link', { name: 'Authors' });
      expect(authorsLink).toHaveAttribute('aria-current', 'page');
    });

    it('correctly sets parent active state on nested book reader routes like /reader/42', () => {
      renderWithProviders(<Navigation />, ['/reader/42']);

      const libraryLink = screen.getByRole('link', { name: 'Library' });
      expect(libraryLink).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('User Account Menu', () => {
    it('provides an accessible trigger label containing the user display name', () => {
      renderWithProviders(<Navigation />, ['/dashboard']);

      const menuTrigger = screen.getByRole('button', {
        name: 'User account menu for Test Reader',
      });
      expect(menuTrigger).toBeInTheDocument();
    });

    it('displays user profile info, dedicated destinations, and sign out in dropdown', async () => {
      window.HTMLElement.prototype.hasPointerCapture = vi.fn();
      window.HTMLElement.prototype.setPointerCapture = vi.fn();
      window.HTMLElement.prototype.releasePointerCapture = vi.fn();

      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/dashboard']}>
            <Routes>
              <Route path="/dashboard" element={<Navigation />} />
              <Route path="/signin" element={<div>Sign In Screen</div>} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      );

      const menuTrigger = screen.getByRole('button', {
        name: 'User account menu for Test Reader',
      });
      fireEvent.pointerDown(menuTrigger, { button: 0 });
      fireEvent.keyDown(menuTrigger, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Test Reader')).toBeInTheDocument();
        expect(screen.getByText('reader@example.com')).toBeInTheDocument();
      });

      expect(screen.getByRole('menuitem', { name: /Profile/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /My Bookshelf/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /My Articles/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /Sign Out/i })).toBeInTheDocument();

      const signOutItem = screen.getByRole('menuitem', { name: /Sign Out/i });
      fireEvent.click(signOutItem);

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
        expect(screen.getByText('Sign In Screen')).toBeInTheDocument();
      });
    });
  });

  describe('Notification and Message Controls Accessibility', () => {
    it('announces unread count for notifications via aria-label', () => {
      render(
        <MemoryRouter>
          <NotificationDropdown />
        </MemoryRouter>
      );

      const button = screen.getByRole('button', {
        name: '3 unread notifications',
      });
      expect(button).toBeInTheDocument();
    });

    it('falls back to default label when there are no unread notifications', () => {
      mockUnreadNotifications = 0;
      render(
        <MemoryRouter>
          <NotificationDropdown />
        </MemoryRouter>
      );

      const button = screen.getByRole('button', {
        name: 'Notifications',
      });
      expect(button).toBeInTheDocument();
    });

    it('announces unread count for messages via aria-label', () => {
      render(
        <MemoryRouter>
          <MessageDropdown />
        </MemoryRouter>
      );

      const button = screen.getByRole('button', {
        name: '2 unread messages',
      });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Dashboard Landing Experience', () => {
    it('renders heading hierarchy starting with h1 and semantic h2 section titles', () => {
      renderWithProviders(<Dashboard />, ['/dashboard']);

      // Primary page h1
      const pageHeading = screen.getByRole('heading', { level: 1 });
      expect(pageHeading).toHaveTextContent(/Welcome back, Test!/i);

      // Semantic section h2 headings
      const h2Headings = screen.getAllByRole('heading', { level: 2 });
      const h2Texts = h2Headings.map(h => h.textContent);

      expect(h2Texts).toContain('Currently Reading');
      expect(h2Texts).toContain('Getting Started Checklist');
      expect(h2Texts).toContain('Quick Actions');
      expect(h2Texts.some(t => t?.includes('Reading Goal'))).toBe(true);
      expect(h2Texts.some(t => t?.includes('Community Pulse'))).toBe(true);
      expect(h2Texts.some(t => t?.includes('Reading Streak'))).toBe(true);
    });

    it('renders empty currently reading state with actionable CTA linking to library', () => {
      mockBookshelfItems = [];
      renderWithProviders(<Dashboard />, ['/dashboard']);

      expect(screen.getByText('No books in progress')).toBeInTheDocument();
      const findBookBtn = screen.getByRole('link', { name: /Find a Book/i });
      expect(findBookBtn).toHaveAttribute('href', '/library');
    });

    it('displays active reading cards when bookshelf items are in progress', () => {
      mockBookshelfItems = [
        {
          id: 'shelf-1',
          book_id: 'book-99',
          status: 'reading',
          books_library: {
            title: 'Godan',
            author: 'Munshi Premchand',
            cover_image_url: 'https://example.com/godan.jpg',
          },
        },
      ];

      renderWithProviders(<Dashboard />, ['/dashboard']);

      // Welcome message adapts to currently reading book
      const pageHeading = screen.getByRole('heading', { level: 1 });
      expect(pageHeading).toHaveTextContent(/Continue reading, Test/i);
      expect(screen.getByText(/Pick up where you left off with "Godan"/i)).toBeInTheDocument();
    });
  });
});
