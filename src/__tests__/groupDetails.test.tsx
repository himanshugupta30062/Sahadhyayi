/** @vitest-environment jsdom */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GroupDetails from '@/pages/GroupDetails';

vi.mock('@/components/groups/GroupReadingBoard', () => ({
  default: () => <div data-testid="group-reading-board">Shared reading board</div>,
}));

vi.mock('@/components/groups/GroupReadingDiscussions', () => ({
  default: () => <div data-testid="group-reading-discussions">Chapter discussions</div>,
}));

vi.mock('@/components/groups/GroupModerationPanel', () => ({
  default: () => <div data-testid="group-moderation-panel">Group moderation</div>,
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({
    user: { id: 'test-user-123', email: 'reader@example.com' },
  }),
}));

const mockGroup = {
  id: 'group-101',
  name: 'Classical Sanskrit Readers',
  description: 'Discussing the Upanishads, Gita, and classical literary poetry.',
  created_by: 'test-user-123',
  created_at: '2026-01-01',
  group_members: [{ count: 12 }],
};

vi.mock('@/hooks/useGroupManagement', () => ({
  DEFAULT_READING_GROUP_NAME: 'Sahadhyayi Community Reading Circle',
  useGroups: () => ({
    data: [mockGroup],
    isLoading: false,
  }),
  useJoinGroup: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useLeaveGroup: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useCreateGroupInvitation: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('@/hooks/useUserGroups', () => ({
  useUserJoinedGroups: () => ({
    data: [{ id: 'membership-101', group_id: 'group-101', status: 'active', role: 'admin', name: 'Classical Sanskrit Readers' }],
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useGroupMessaging', () => ({
  useGroupMembers: () => ({
    data: [
      {
        id: 'member-1',
        group_id: 'group-101',
        user_id: 'test-user-123',
        role: 'admin',
        status: 'active',
        joined_at: '2026-01-01',
        user_profile: {
          id: 'test-user-123',
          full_name: 'Himanshu Gupta',
          username: 'himanshu',
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

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

describe('GroupDetails Page Tests', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders the shared reading board for active members', () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/groups/group-101']}>
          <Routes><Route path="/groups/:id" element={<GroupDetails />} /></Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
    expect(screen.getByTestId('group-reading-board')).toBeInTheDocument();
    expect(screen.getByTestId('group-reading-discussions')).toBeInTheDocument();
  });

  it('renders group details with membership status and chat button', () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/groups/group-101']}>
          <Routes>
            <Route path="/groups/:id" element={<GroupDetails />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Group info rendered
    expect(screen.getAllByText('Classical Sanskrit Readers').length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByText('Discussing the Upanishads, Gita, and classical literary poetry.')
    ).toBeInTheDocument();

    // Member status badge and count
    expect(screen.getByText('Joined Member')).toBeInTheDocument();
    expect(screen.getByText('1 member')).toBeInTheDocument();

    // Open Chat & Invite buttons rendered for member
    expect(screen.getByText('Open Group Chat')).toBeInTheDocument();
    expect(screen.getByText('Invite')).toBeInTheDocument();

    // Members list rendered
    expect(screen.getByText('Himanshu Gupta')).toBeInTheDocument();
    expect(screen.getByText('@himanshu')).toBeInTheDocument();
  });
});
