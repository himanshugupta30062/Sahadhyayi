/** @vitest-environment jsdom */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import SocialMedia from '@/pages/SocialMedia';

const mockUseAuth = vi.fn();
const mockUseReadingRooms = vi.fn();
const mockUseMarginNotes = vi.fn();
const mockUseSpoilerThreads = vi.fn();
const mockUseGroups = vi.fn();
const mockUseAllUsers = vi.fn();
const mockUseReadingProgress = vi.fn();
const mockSendFriendRequest = vi.fn();

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/hooks/useReadingRoom', () => ({
  useReadingRooms: () => mockUseReadingRooms(),
}));

vi.mock('@/hooks/useMarginNotes', () => ({
  useMarginNotes: () => mockUseMarginNotes(),
}));

vi.mock('@/hooks/useSpoilerThreads', () => ({
  useSpoilerThreads: () => mockUseSpoilerThreads(),
}));

vi.mock('@/hooks/useGroupManagement', () => ({
  useGroups: () => mockUseGroups(),
}));

vi.mock('@/hooks/useUserSearch', () => ({
  useAllUsers: () => mockUseAllUsers(),
}));

vi.mock('@/hooks/useReadingProgress', () => ({
  useReadingProgress: () => mockUseReadingProgress(),
}));

vi.mock('@/hooks/useFriends', () => ({
  useSendFriendRequest: () => ({
    mutateAsync: mockSendFriendRequest,
    isPending: false,
  }),
}));

vi.mock('@/components/social/BookPulseBar', () => ({
  BookPulseBar: () => <div data-testid="book-pulse-bar" />,
}));

vi.mock('@/components/social/EnhancedSocialFeed', () => ({
  EnhancedSocialFeed: () => <div data-testid="enhanced-social-feed">Community Feed Stream</div>,
}));

vi.mock('@/components/notifications/NotificationDropdown', () => ({
  NotificationDropdown: () => <button aria-label="Notifications">Notifications</button>,
}));

vi.mock('@/components/SEO', () => ({
  default: () => null,
}));

describe('SocialMedia Page Redesign and Functional Fixes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseReadingRooms.mockReturnValue({ data: [] });
    mockUseMarginNotes.mockReturnValue({ data: [] });
    mockUseSpoilerThreads.mockReturnValue({ data: [] });
    mockUseGroups.mockReturnValue({ data: [] });
    mockUseAllUsers.mockReturnValue({ data: [] });
    mockUseReadingProgress.mockReturnValue({ data: [] });
  });

  afterEach(() => {
    cleanup();
  });

  describe('Guest Experience', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: null, loading: false });
    });

    it('does not start authenticated social data queries for signed-out visitors', () => {
      render(
        <MemoryRouter initialEntries={['/social?tab=friends']}>
          <SocialMedia />
        </MemoryRouter>
      );

      expect(mockUseReadingRooms).not.toHaveBeenCalled();
      expect(mockUseMarginNotes).not.toHaveBeenCalled();
      expect(mockUseSpoilerThreads).not.toHaveBeenCalled();
      expect(mockUseGroups).not.toHaveBeenCalled();
      expect(mockUseAllUsers).not.toHaveBeenCalled();
      expect(mockUseReadingProgress).not.toHaveBeenCalled();
      expect(mockSendFriendRequest).not.toHaveBeenCalled();
    });

    it('renders the guest hero copy matching the visual reference design without fabricated stats', () => {
      render(
        <MemoryRouter initialEntries={['/social']}>
          <SocialMedia />
        </MemoryRouter>
      );

      // Hero title & copy
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        /Where readers connect around books/i
      );
      expect(
        screen.getByText(/Share what you're reading, explore ideas, join reading rooms/i)
      ).toBeInTheDocument();

      // Fabricated metrics must NOT be present
      expect(screen.queryByText(/50K\+ Active Readers/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Reading 1M\+ Books/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/95% User Satisfaction/i)).not.toBeInTheDocument();

      // CTAs
      expect(screen.getByRole('link', { name: /create an account/i })).toHaveAttribute('href', '/signup');
      expect(screen.getAllByRole('link', { name: /sign in/i })[0]).toHaveAttribute('href', expect.stringContaining('/signin'));
    });

    it('renders the 4 feature cards with redirect preservation and no invalid nested interactive buttons', () => {
      render(
        <MemoryRouter initialEntries={['/social']}>
          <SocialMedia />
        </MemoryRouter>
      );

      // 4 feature pillars
      expect(screen.getByText('Live Reading Rooms')).toBeInTheDocument();
      expect(screen.getByText('Public Marginalia')).toBeInTheDocument();
      expect(screen.getByText('Spoiler-Safe Threads')).toBeInTheDocument();
      expect(screen.getByText('Reading DNA Match')).toBeInTheDocument();

      // Ensure the room card redirects to /social?tab=rooms
      const roomsLink = screen.getByRole('link', { name: /Live Reading Rooms/i });
      expect(roomsLink).toHaveAttribute('href', expect.stringContaining('tab%3Drooms'));

      const marginsLink = screen.getByRole('link', { name: /Public Marginalia/i });
      expect(marginsLink).toHaveAttribute('href', expect.stringContaining('tab%3Dmargins'));
    });
  });

  describe('Authenticated Experience', () => {
    const mockUser = {
      id: 'test-user-123',
      email: 'reader@example.com',
      user_metadata: {
        full_name: 'Aditi Sharma',
      },
    };

    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
    });

    it('renders a content-first community layout without a duplicate social navigation menu', () => {
      mockUseReadingRooms.mockReturnValue({
        data: [
          {
            id: 'room-1',
            name: 'Modern Literature Circle',
            participants_count: 42,
            books_library: { title: 'Atomic Habits', author: 'James Clear' },
          },
        ],
      });

      mockUseGroups.mockReturnValue({
        data: [
          {
            id: 'group-1',
            name: 'Fiction Lovers',
            member_count: 1200,
          },
        ],
      });

      mockUseAllUsers.mockReturnValue({
        data: [
          {
            id: 'user-2',
            full_name: 'Neha Verma',
            username: 'neha_v',
          },
        ],
      });

      render(
        <MemoryRouter initialEntries={['/social']}>
          <SocialMedia />
        </MemoryRouter>
      );

      // The global site header owns site navigation; this page stays content-first.
      expect(screen.getByRole('heading', { name: /Your Reading Community/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Start a conversation/i })).toBeInTheDocument();
      expect(screen.getByText(/Explore reading spaces/i)).toBeInTheDocument();
      // Reading destinations stay available without a permanent shortcut-card grid.
      expect(screen.queryByRole('button', { name: /Read together/i })).not.toBeInTheDocument();
      expect(screen.queryByText(/More to explore/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Toggle search/i })).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/Search books, authors, discussions…/i)).not.toBeInTheDocument();
      expect(screen.getByTestId('enhanced-social-feed')).toBeInTheDocument();

      // Right discovery rail: live rooms, popular groups, suggested readers
      expect(screen.getByText('Modern Literature Circle')).toBeInTheDocument();
      expect(screen.getByText('42 in room')).toBeInTheDocument();
      expect(screen.getByText('Fiction Lovers')).toBeInTheDocument();
      expect(screen.getByText('Neha Verma')).toBeInTheDocument();

      // Quote card
      expect(screen.getByText(/A room full of readers is a room full of friends/i)).toBeInTheDocument();
    });

    it('synchronizes tab changes with the search parameter', () => {
      render(
        <MemoryRouter initialEntries={['/social']}>
          <Routes>
            <Route path="/social" element={<SocialMedia />} />
          </Routes>
        </MemoryRouter>
      );

      // Feature cards replace the persistent nested navigation menu.
      fireEvent.click(screen.getByRole('button', { name: /Book discussions/i }));

      expect(screen.getByText('Chapter-Locked Discussions')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Community feed/i })).toBeInTheDocument();
    });

    it('renders reading progress card with valid /book/:id link', () => {
      mockUseReadingProgress.mockReturnValue({
        data: [
          {
            book_id: 'book-xyz',
            book_title: 'The Great Gatsby',
            current_page: 50,
            total_pages: 180,
            cover_image_url: 'https://example.com/cover.jpg',
          },
        ],
      });

      render(
        <MemoryRouter initialEntries={['/social']}>
          <SocialMedia />
        </MemoryRouter>
      );

      const continueReadingLink = screen.getByRole('link', { name: /Continue Reading →/i });
      expect(continueReadingLink).toHaveAttribute('href', '/book/book-xyz');
    });

    it('opens a feature from a deep link and provides a clear return to the community feed', () => {
      render(
        <MemoryRouter initialEntries={['/social?tab=dna']}>
          <SocialMedia />
        </MemoryRouter>
      );

      expect(screen.getByRole('button', { name: /Community feed/i })).toBeInTheDocument();
      expect(screen.getAllByText(/Reading DNA/i).length).toBeGreaterThan(0);
      expect(screen.queryByRole('button', { name: /Toggle search/i })).not.toBeInTheDocument();
    });
  });
});
