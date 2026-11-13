// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotificationsPage from './Notifications';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/components/SEO', () => ({
  default: () => null,
}));

vi.mock('@/components/Breadcrumb', () => ({
  default: () => <nav aria-label="Breadcrumb">Breadcrumb</nav>,
}));

const mockMarkNotificationAsRead = vi.fn();
const mockMarkAllNotificationsAsRead = vi.fn();
const mockRefetch = vi.fn();

let mockNotifications: any[] = [];
let mockUnreadCount = 0;
let mockIsLoading = false;
let mockIsError = false;

vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: () => ({
    data: mockNotifications,
    isLoading: mockIsLoading,
    isError: mockIsError,
    refetch: mockRefetch,
  }),
  useUnreadNotificationsCount: () => ({
    data: mockUnreadCount,
  }),
  useMarkNotificationAsRead: () => ({
    mutate: mockMarkNotificationAsRead,
  }),
  useMarkAllNotificationsAsRead: () => ({
    mutate: mockMarkAllNotificationsAsRead,
    isPending: false,
  }),
}));

describe('NotificationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNotifications = [
      {
        id: 'notif-1',
        type: 'comment',
        title: 'New comment on your review',
        message: 'Aarav replied to your thoughts on Godan.',
        read: false,
        created_at: new Date().toISOString(),
        link: '/social?tab=reviews',
        actor: { full_name: 'Aarav Sharma', profile_photo_url: '' },
      },
      {
        id: 'notif-2',
        type: 'friend_request',
        title: 'Friend request accepted',
        message: 'Priya accepted your friendship request.',
        read: true,
        created_at: new Date(Date.now() - 3600000).toISOString(),
        link: '/social?tab=friends',
        actor: { full_name: 'Priya Patel', profile_photo_url: '' },
      },
    ];
    mockUnreadCount = 1;
    mockIsLoading = false;
    mockIsError = false;
  });

  afterEach(() => {
    cleanup();
  });

  it('renders notifications list, unread badge, and filter buttons', () => {
    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /notifications/i })).toBeInTheDocument();
    expect(screen.getByText('1 new')).toBeInTheDocument();
    expect(screen.getByText('All (2)')).toBeInTheDocument();
    expect(screen.getByText('Unread (1)')).toBeInTheDocument();
    expect(screen.getByText('New comment on your review')).toBeInTheDocument();
    expect(screen.getByText('Friend request accepted')).toBeInTheDocument();
  });

  it('filters by unread notifications when unread filter is active', () => {
    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Unread (1)'));
    expect(screen.getByText('New comment on your review')).toBeInTheDocument();
    expect(screen.queryByText('Friend request accepted')).not.toBeInTheDocument();
  });

  it('calls markAllAsRead when Mark all read button is clicked', () => {
    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>
    );

    const markAllBtn = screen.getByRole('button', { name: /mark all read/i });
    fireEvent.click(markAllBtn);
    expect(mockMarkAllNotificationsAsRead).toHaveBeenCalled();
  });

  it('marks unread notification as read and navigates when clicked', () => {
    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>
    );

    const unreadItem = screen.getByText('New comment on your review').closest('button');
    expect(unreadItem).toBeTruthy();
    if (unreadItem) {
      fireEvent.click(unreadItem);
      expect(mockMarkNotificationAsRead).toHaveBeenCalledWith('notif-1');
      expect(mockNavigate).toHaveBeenCalledWith('/social?tab=reviews');
    }
  });

  it('renders friendly empty state when there are no notifications', () => {
    mockNotifications = [];
    mockUnreadCount = 0;

    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('No notifications yet')).toBeInTheDocument();
  });
});
