// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MessagesPage from './Messages';

vi.mock('@/components/SEO', () => ({
  default: () => null,
}));

vi.mock('@/components/Breadcrumb', () => ({
  default: () => <nav aria-label="Breadcrumb">Breadcrumb</nav>,
}));

vi.mock('@/contexts/authHelpers', () => ({
  useAuth: () => ({
    user: { id: 'current-user-1', email: 'user@example.com' },
  }),
}));

const mockSendMessage = vi.fn().mockResolvedValue({});
const mockMarkMessagesAsRead = vi.fn();

let mockFriends: any[] = [];
let mockUnreadMessages: any[] = [];
let mockConversation: any[] = [];
let mockIsLoadingFriends = false;
let mockIsLoadingChat = false;

vi.mock('@/hooks/useFriends', () => ({
  useFriends: () => ({
    data: mockFriends,
    isLoading: mockIsLoadingFriends,
  }),
}));

vi.mock('@/hooks/useMessages', () => ({
  usePrivateMessages: () => ({
    data: mockConversation,
    isLoading: mockIsLoadingChat,
  }),
  useSendPrivateMessage: () => ({
    mutateAsync: mockSendMessage,
    isPending: false,
  }),
  useUnreadMessages: () => ({
    data: mockUnreadMessages,
  }),
  useMarkMessagesAsRead: () => ({
    mutate: mockMarkMessagesAsRead,
  }),
}));

vi.mock('@/integrations/supabase/client-universal', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: 'reader-99', full_name: 'Target Reader', username: 'targetreader' },
          }),
        }),
      }),
    }),
  },
}));

describe('MessagesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFriends = [
      {
        id: 'friendship-1',
        user1_id: 'current-user-1',
        user2_id: 'friend-1',
        created_at: new Date().toISOString(),
        friend_profile: {
          id: 'friend-1',
          full_name: 'Devika Sharma',
          username: 'devika',
          profile_photo_url: '',
        },
      },
    ];
    mockUnreadMessages = [
      {
        id: 'msg-unread-1',
        sender_id: 'friend-1',
        receiver_id: 'current-user-1',
        content: 'Have you finished chapter 4?',
        is_read: false,
        created_at: new Date().toISOString(),
        sender_profile: {
          id: 'friend-1',
          full_name: 'Devika Sharma',
          profile_photo_url: '',
        },
      },
    ];
    mockConversation = [];
    mockIsLoadingFriends = false;
    mockIsLoadingChat = false;
  });

  afterEach(() => {
    cleanup();
  });

  it('renders contacts list with friend name and unread badge', () => {
    render(
      <MemoryRouter initialEntries={['/messages']}>
        <MessagesPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /direct messages/i })).toBeInTheDocument();
    expect(screen.getByText('Devika Sharma')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // unread count badge
    expect(screen.getByText('Your Reader Inbox')).toBeInTheDocument();
  });

  it('loads recipient from URL search param and displays conversation header', async () => {
    mockConversation = [
      {
        id: 'msg-1',
        sender_id: 'friend-1',
        receiver_id: 'current-user-1',
        content: 'Hello fellow reader!',
        is_read: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'msg-2',
        sender_id: 'current-user-1',
        receiver_id: 'friend-1',
        content: 'Hi Devika! Great to connect.',
        is_read: true,
        created_at: new Date().toISOString(),
      },
    ];

    render(
      <MemoryRouter initialEntries={['/messages?recipient=friend-1']}>
        <MessagesPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Hello fellow reader!')).toBeInTheDocument();
    expect(screen.getByText('Hi Devika! Great to connect.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
  });

  it('sends private message when user submits chat form', async () => {
    render(
      <MemoryRouter initialEntries={['/messages?recipient=friend-1']}>
        <MessagesPage />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(input, { target: { value: 'Loved chapter 5!' } });

    const sendBtn = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendBtn);

    expect(mockSendMessage).toHaveBeenCalledWith({
      receiverId: 'friend-1',
      content: 'Loved chapter 5!',
    });
  });
});
