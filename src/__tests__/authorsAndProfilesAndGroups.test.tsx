/** @vitest-environment jsdom */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { FollowButton } from '@/components/authors/FollowButton';
import UserProfileModal from '@/components/profile/UserProfileModal';
import ReadingGroupsDirectory from '@/components/groups/ReadingGroupsDirectory';
import { EnhancedFriendsManager } from '@/components/social/EnhancedFriendsManager';
import GroupDetails from '@/pages/GroupDetails';

// Mock contexts and hooks
const mockUser = { id: 'reader-1', email: 'active_reader@example.com' };
let currentUser: typeof mockUser | null = mockUser;

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({
    user: currentUser,
  }),
}));

let isFollowingMock = false;
const toggleFollowMock = vi.fn();

vi.mock('@/hooks/useAuthorFollow', () => ({
  useAuthorFollow: () => ({
    isFollowing: isFollowingMock,
    isLoading: false,
    toggleFollow: toggleFollowMock,
  }),
}));

// Mock friends hooks
const sendFriendRequestMock = vi.fn();
const respondToFriendRequestMock = vi.fn();
const cancelFriendRequestMock = vi.fn();

vi.mock('@/hooks/useFriends', () => ({
  useFriends: () => ({
    data: [],
    isLoading: false,
  }),
  useFriendRequests: () => ({
    data: [],
    isLoading: false,
  }),
  useSendFriendRequest: () => ({
    mutateAsync: sendFriendRequestMock,
    isPending: false,
  }),
  useRespondToFriendRequest: () => ({
    mutateAsync: respondToFriendRequestMock,
    isPending: false,
  }),
  useCancelFriendRequest: () => ({
    mutateAsync: cancelFriendRequestMock,
    isPending: false,
  }),
}));

// Mock user search
vi.mock('@/hooks/useUserSearch', () => ({
  useUserSearch: () => ({
    data: [],
    isLoading: false,
    error: null,
  }),
  useAllUsers: () => ({
    data: [
      {
        id: 'user-abc',
        full_name: 'Ananya Sharma',
        username: 'ananya_reads',
        profile_photo_url: null,
        bio: 'Poetry lover and fiction writer',
      },
    ],
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useReadingDna', () => ({
  useReadingDna: () => ({
    data: {
      archetype: 'The Scholar',
      primaryGenre: 'Literary Classics',
    },
    isLoading: false,
  }),
  useDnaMatch: () => ({
    score: 88,
    myDna: { archetype: 'The Scholar', genres: [], moods: [], themes: [], pace: 'steady' },
    targetDna: { archetype: 'The Poet', genres: [], moods: [], themes: [], pace: 'steady' },
    isLoading: false,
  }),
  useUserShelfForCompare: () => ({
    data: [],
    isLoading: false,
  }),
}));

// Mock group hooks
const mockGroupsList = [
  {
    id: 'grp-1',
    name: 'Hindi Sahitya Circle',
    description: 'Weekly reading and discussion of Hindi literature classics.',
    created_by: 'reader-1',
    created_at: '2026-01-01',
    group_members: [{ count: 8 }],
    is_encrypted: false,
  },
];

vi.mock('@/hooks/useGroupManagement', () => ({
  useGroups: () => ({
    data: mockGroupsList,
    isLoading: false,
    error: null,
  }),
  useJoinGroup: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useLeaveGroup: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useCreateGroup: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useUpdateGroup: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useDeleteGroup: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('@/hooks/useUserGroups', () => ({
  useUserJoinedGroups: () => ({
    data: [{ id: 'membership-1', group_id: 'grp-1', name: 'Hindi Sahitya Circle' }],
    isLoading: false,
    error: null,
  }),
}));

vi.mock('@/hooks/useGroupMessaging', () => ({
  useGroupMembers: () => ({
    data: [
      {
        id: 'member-1',
        group_id: 'grp-1',
        user_id: 'reader-1',
        role: 'admin',
        joined_at: '2026-01-01',
        user_profile: {
          id: 'reader-1',
          full_name: 'Premchand Enthusiast',
          username: 'premchand_fan',
          profile_photo_url: null,
        },
      },
    ],
    isLoading: false,
  }),
  useGroupMessages: () => ({
    data: [],
    isLoading: false,
  }),
  useSendMessage: () => ({
    mutateAsync: vi.fn(),
  }),
}));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }),
  },
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

describe('Phase 7: Authors, Profiles, Reader Discovery and Reading Groups', () => {
  beforeEach(() => {
    currentUser = mockUser;
    isFollowingMock = false;
    vi.clearAllMocks();
  });

  describe('Author Follow Button Accessibility and Theming', () => {
    it('provides accessible name in icon-only mode when authenticated', () => {
      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <FollowButton authorId="author-101" showText={false} />
        </QueryClientProvider>
      );

      const button = screen.getByRole('button', { name: /Follow author/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-label', 'Follow author');
    });

    it('updates accessible label to Unfollow author when following in icon-only mode', () => {
      isFollowingMock = true;
      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <FollowButton authorId="author-101" showText={false} />
        </QueryClientProvider>
      );

      const button = screen.getByRole('button', { name: /Unfollow author/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-label', 'Unfollow author');
    });

    it('provides clear sign-in required accessible label when unauthenticated', () => {
      currentUser = null;
      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <FollowButton authorId="author-101" showText={false} />
        </QueryClientProvider>
      );

      const button = screen.getByRole('button', { name: /Follow author \(sign in required\)/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Reader Profile Privacy & Connection Integrity', () => {
    const mockTargetUser = {
      id: 'target-user-999',
      username: 'harish_reader',
      name: 'Harish Kumar',
      email: 'private_personal_email@domain.com', // MUST NEVER BE DISPLAYED
      profile_picture_url: '',
      bio: 'Avid reader of ancient epics and modern essays.',
      stories_written_count: 5,
      stories_read_count: 22,
    };

    it('NEVER renders the user email in UserProfileModal', () => {
      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <UserProfileModal
            isOpen={true}
            onClose={vi.fn()}
            user={mockTargetUser}
          />
        </QueryClientProvider>
      );

      // Name and username should appear
      expect(screen.getByText('Harish Kumar')).toBeInTheDocument();
      expect(screen.getByText('@harish_reader')).toBeInTheDocument();
      expect(screen.getByText('Avid reader of ancient epics and modern essays.')).toBeInTheDocument();

      // Email MUST NOT be present anywhere in the DOM
      expect(screen.queryByText('private_personal_email@domain.com')).not.toBeInTheDocument();
      expect(screen.queryByText(/@domain\.com/i)).not.toBeInTheDocument();
    });

    it('does NOT display fabricated 0 followers or following counters', () => {
      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <UserProfileModal
            isOpen={true}
            onClose={vi.fn()}
            user={mockTargetUser}
          />
        </QueryClientProvider>
      );

      // Verify no fabricated follower count cards
      expect(screen.queryByText(/0 Followers/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/0 Following/i)).not.toBeInTheDocument();
    });

    it('renders a functional Connect action button', async () => {
      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <UserProfileModal
            isOpen={true}
            onClose={vi.fn()}
            user={mockTargetUser}
          />
        </QueryClientProvider>
      );

      const connectBtn = screen.getByRole('button', { name: /Send friend request to Harish Kumar/i });
      expect(connectBtn).toBeInTheDocument();

      fireEvent.click(connectBtn);
      expect(sendFriendRequestMock).toHaveBeenCalledWith({ addresseeId: 'target-user-999' });
    });
  });

  describe('Reading Groups Directory Deep Linking and Detail Navigation', () => {
    it('renders reading groups with direct links to /groups/:id', () => {
      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <ReadingGroupsDirectory />
          </MemoryRouter>
        </QueryClientProvider>
      );

      // Group title should link directly to the group details page
      const groupLink = screen.getByRole('link', { name: 'Hindi Sahitya Circle' });
      expect(groupLink).toBeInTheDocument();
      expect(groupLink).toHaveAttribute('href', '/groups/grp-1');
    });
  });

  describe('Reading Group Details Page Accessibility', () => {
    it('provides accessible labels on invite and leave buttons in GroupDetails', () => {
      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/groups/grp-1']}>
            <Routes>
              <Route path="/groups/:id" element={<GroupDetails />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(screen.getAllByText('Hindi Sahitya Circle').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByRole('button', { name: /Copy group invite link/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Leave reading group/i })).toBeInTheDocument();
    });
  });

  describe('Reader Discovery Accessibility', () => {
    it('renders user cards with personalized accessible name for Add action', () => {
      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <EnhancedFriendsManager />
          </MemoryRouter>
        </QueryClientProvider>
      );

      const addBtn = screen.getByRole('button', { name: 'Send friend request to Ananya Sharma' });
      expect(addBtn).toBeInTheDocument();
    });
  });
});
